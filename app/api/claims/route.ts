import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const VISIT_TYPES = ["first_visit", "first_follow_up", "second_follow_up"] as const;
const PATIENT_TYPES = ["client", "partner"] as const;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getClaimInput(body: Record<string, unknown>) {
  return {
    treatmentFormNo: textValue(body.treatmentFormNo),
    vspId: textValue(body.vspId),
    voucherId: textValue(body.voucherId),
    visitType: textValue(body.visitType),
    patientType: textValue(body.patientType),
    patientName: textValue(body.patientName),
    age: Number(body.age),
    gender: textValue(body.gender),
    address: textValue(body.address),
    doctorName: textValue(body.doctorName),
    drugsQty: Number(body.drugsQty || 0),
    drugsCost: Number(body.drugsCost || 0),
    thumbprintMismatch: body.thumbprintMismatch === true,
  };
}

function validateClaim(input: ReturnType<typeof getClaimInput>) {
  if (!input.treatmentFormNo || !input.vspId || !input.voucherId || !input.visitType || !input.patientType || !input.patientName || !input.gender || !input.address || !input.doctorName) {
    return "All required claim fields must be provided.";
  }
  if (!VISIT_TYPES.includes(input.visitType as (typeof VISIT_TYPES)[number])) {
    return "Visit type is invalid.";
  }
  if (!PATIENT_TYPES.includes(input.patientType as (typeof PATIENT_TYPES)[number])) {
    return "Patient type is invalid.";
  }
  if (!Number.isInteger(input.age) || input.age < 0) return "Age must be a valid non-negative whole number.";
  if (!Number.isInteger(input.drugsQty) || input.drugsQty < 0) return "Drugs quantity must be a valid non-negative whole number.";
  if (!Number.isFinite(input.drugsCost) || input.drugsCost < 0) return "Drugs cost must be a valid non-negative number.";
  return null;
}

function calculateClaimAmount(
  visitType: string,
  firstVisitFee: number,
  firstFollowUpFee: number,
  secondFollowUpFee: number,
  labFee: number,
  drugsQty: number,
  drugsCost: number,
) {
  const drugAmount = drugsQty * drugsCost;

  if (visitType === "first_visit") return firstVisitFee + labFee + drugAmount;
  if (visitType === "first_follow_up") return firstFollowUpFee + drugAmount;
  return secondFollowUpFee + drugAmount;
}

function nextClaimNumber(vspCode: string, lastClaimNumber: string | undefined) {
  const lastNumber = lastClaimNumber ? Number(lastClaimNumber.slice(-5)) : 0;
  return `${vspCode}-CL${(lastNumber + 1).toString().padStart(5, "0")}`;
}

export async function GET() {
  try {
    const claims = await prisma.claim.findMany({
      orderBy: { submittedDate: "desc" },
      include: {
        vsp: { select: { name: true, code: true } },
        voucher: { select: { voucherNumber: true } },
      },
    });
    return NextResponse.json(claims);
  } catch {
    return errorResponse("Unable to load claims.", 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.");
  }

  const input = getClaimInput(body);
  const validationError = validateClaim(input);
  if (validationError) return errorResponse(validationError);

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const vsp = await transaction.vSP.findUnique({
        where: { id: input.vspId },
        select: {
          id: true,
          code: true,
          firstVisitFee: true,
          firstFollowUpFee: true,
          secondFollowUpFee: true,
          labFee: true,
          mismatchCount: true,
          status: true,
        },
      });
      if (!vsp) throw new Error("VSP_NOT_FOUND");

      const voucher = await transaction.voucher.findFirst({
        where: {
          id: input.voucherId,
          status: "sold",
          claims: { none: {} },
        },
        select: { id: true, voucherNumber: true },
      });
      if (!voucher) throw new Error("VOUCHER_NOT_ELIGIBLE");

      const claimAmount = calculateClaimAmount(
        input.visitType,
        vsp.firstVisitFee,
        vsp.firstFollowUpFee,
        vsp.secondFollowUpFee,
        vsp.labFee,
        input.drugsQty,
        input.drugsCost,
      );
      const mismatchCount = input.thumbprintMismatch ? vsp.mismatchCount + 1 : vsp.mismatchCount;
      const vspDeactivated = input.thumbprintMismatch && mismatchCount >= 2;

      if (input.thumbprintMismatch) {
        await transaction.vSP.update({
          where: { id: vsp.id },
          data: {
            mismatchCount,
            ...(vspDeactivated ? { status: "in-active" } : {}),
          },
        });
      }

      const latestClaim = await transaction.claim.findFirst({
        where: { claimNo: { startsWith: `${vsp.code}-CL` } },
        orderBy: { claimNo: "desc" },
        select: { claimNo: true },
      });
      const claimNo = nextClaimNumber(vsp.code, latestClaim?.claimNo);
      const claim = await transaction.claim.create({
        data: {
          ...input,
          claimNo,
          claimAmount,
          claimStatus: input.thumbprintMismatch ? "quarantine" : "accepted",
        },
        include: {
          vsp: { select: { name: true, code: true } },
          voucher: { select: { voucherNumber: true } },
        },
      });

      return { claim, vspDeactivated, mismatchCount };
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ ...result, message: "Claim created successfully." }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "VSP_NOT_FOUND") return errorResponse("Selected VSP was not found.", 404);
      if (error.message === "VOUCHER_NOT_ELIGIBLE") return errorResponse("Selected voucher is not sold or has already been claimed.", 409);
    }
    return errorResponse("Unable to create claim.", 500);
  }
}
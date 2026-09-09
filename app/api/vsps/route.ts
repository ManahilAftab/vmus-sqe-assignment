import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function dateValue(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getVspInput(body: Record<string, unknown>) {
  return {
    code: textValue(body.code),
    name: textValue(body.name),
    physicalAddress: textValue(body.physicalAddress),
    communicationAddress: textValue(body.communicationAddress),
    contactPerson: textValue(body.contactPerson) || null,
    contactNo: textValue(body.contactNo) || null,
    email: textValue(body.email) || null,
    status: textValue(body.status) || "active",
    paymentMode: textValue(body.paymentMode) || null,
    bankAccountNo: textValue(body.bankAccountNo) || null,
    bankName: textValue(body.bankName) || null,
    paymentType: textValue(body.paymentType) || null,
    validFrom: dateValue(body.validFrom),
    validTo: dateValue(body.validTo),
    firstVisitFee: Number(body.firstVisitFee || 0),
    firstFollowUpFee: Number(body.firstFollowUpFee || 0),
    secondFollowUpFee: Number(body.secondFollowUpFee || 0),
    labFee: Number(body.labFee || 0),
  };
}

function validateVsp(input: ReturnType<typeof getVspInput>) {
  if (!input.name || !input.physicalAddress || !input.communicationAddress) {
    return "Name, physical address, and communication address are required.";
  }
  if (input.status !== "active" && input.status !== "in-active") {
    return "Status must be active or in-active.";
  }
  if (input.paymentMode && input.paymentMode !== "Cash" && input.paymentMode !== "Bank") {
    return "Payment mode must be Cash or Bank.";
  }
  if (input.paymentType && input.paymentType !== "Bi-Monthly" && input.paymentType !== "Monthly") {
    return "Payment type must be Bi-Monthly or Monthly.";
  }
  if (input.email && !/^\S+@\S+\.\S+$/.test(input.email)) {
    return "Email must be valid when provided.";
  }
  if ([input.firstVisitFee, input.firstFollowUpFee, input.secondFollowUpFee, input.labFee].some((fee) => !Number.isFinite(fee) || fee < 0)) {
    return "Payment fees must be valid non-negative numbers.";
  }
  if (input.validFrom && input.validTo && input.validTo < input.validFrom) {
    return "Valid to cannot be earlier than valid from.";
  }
  return null;
}

async function generateVspCode() {
  const latest = await prisma.vSP.findFirst({
    where: { code: { startsWith: "HP" } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const number = latest ? Number(latest.code.slice(2)) + 1 : 1;
  return `HP${number.toString().padStart(4, "0")}`;
}

export async function GET() {
  try {
    const vsps = await prisma.vSP.findMany({ orderBy: { code: "asc" } });
    return NextResponse.json(vsps);
  } catch {
    return errorResponse("Unable to load VSPs.", 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.");
  }

  const input = getVspInput(body);
  const validationError = validateVsp(input);
  if (validationError) return errorResponse(validationError);

  try {
    const code = input.code || await generateVspCode();
    const vsp = await prisma.vSP.create({ data: { ...input, code } });
    return NextResponse.json(vsp, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return errorResponse("VSP code must be unique.", 409);
    }
    return errorResponse("Unable to create VSP.", 500);
  }
}
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
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
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
  if (input.status !== "active" && input.status !== "in-active") return "Status must be active or in-active.";
  if (input.paymentMode && input.paymentMode !== "Cash" && input.paymentMode !== "Bank") return "Payment mode must be Cash or Bank.";
  if (input.paymentType && input.paymentType !== "Bi-Monthly" && input.paymentType !== "Monthly") return "Payment type must be Bi-Monthly or Monthly.";
  if (input.email && !/^\S+@\S+\.\S+$/.test(input.email)) return "Email must be valid when provided.";
  if ([input.firstVisitFee, input.firstFollowUpFee, input.secondFollowUpFee, input.labFee].some((fee) => !Number.isFinite(fee) || fee < 0)) return "Payment fees must be valid non-negative numbers.";
  if (input.validFrom && input.validTo && input.validTo < input.validFrom) return "Valid to cannot be earlier than valid from.";
  return null;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
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
    const vsp = await prisma.vSP.update({ where: { id }, data: input });
    return NextResponse.json(vsp);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2025") return errorResponse("VSP not found.", 404);
      if (error.code === "P2002") return errorResponse("VSP code must be unique.", 409);
    }
    return errorResponse("Unable to update VSP.", 500);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    await prisma.vSP.delete({ where: { id } });
    return NextResponse.json({ message: "VSP deleted successfully." });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2025") return errorResponse("VSP not found.", 404);
      if (error.code === "P2003") return errorResponse("VSP cannot be deleted because it has related claims.", 409);
    }
    return errorResponse("Unable to delete VSP.", 500);
  }
}
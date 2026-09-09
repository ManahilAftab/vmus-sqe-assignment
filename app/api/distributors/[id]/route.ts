import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function errorResponse(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getDistributorInput(body: Record<string, unknown>) {
  return {
    code: textValue(body.code),
    name: textValue(body.name),
    businessType: textValue(body.businessType),
    proprietorName: textValue(body.proprietorName),
    designation: textValue(body.designation) || null,
    address: textValue(body.address),
    contactNo: textValue(body.contactNo) || null,
    email: textValue(body.email) || null,
    status: textValue(body.status) || "active",
  };
}

function validateDistributor(input: ReturnType<typeof getDistributorInput>) {
  if (!input.name || !input.businessType || !input.proprietorName || !input.address) {
    return "Name, business type, proprietor name, and address are required.";
  }
  if (input.status !== "active" && input.status !== "deactivate") {
    return "Status must be active or deactivate.";
  }
  if (input.email && !/^\S+@\S+\.\S+$/.test(input.email)) {
    return "Email must be valid when provided.";
  }
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

  const input = getDistributorInput(body);
  const validationError = validateDistributor(input);
  if (validationError) return errorResponse(validationError);

  try {
    const duplicate = await prisma.distributor.findFirst({
      where: {
        name: { equals: input.name, mode: "insensitive" },
        id: { not: id },
      },
      select: { id: true, name: true, code: true },
    });

    if (duplicate && body.confirmDuplicate !== true) {
      return errorResponse(
        `A distributor named ${duplicate.name} already exists.`,
        409,
        { requiresConfirmation: true, duplicate },
      );
    }

    const distributor = await prisma.distributor.update({ where: { id }, data: input });
    return NextResponse.json(distributor);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2025") return errorResponse("Distributor not found.", 404);
      if (error.code === "P2002") return errorResponse("Distributor code must be unique.", 409);
    }
    return errorResponse("Unable to update distributor.", 500);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    await prisma.distributor.delete({ where: { id } });
    return NextResponse.json({ message: "Distributor deleted successfully." });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2025") return errorResponse("Distributor not found.", 404);
      if (error.code === "P2003") return errorResponse("Distributor cannot be deleted because it has related records.", 409);
    }
    return errorResponse("Unable to delete distributor.", 500);
  }
}
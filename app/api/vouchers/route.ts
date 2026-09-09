import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const MINIMUM_BATCH_QUANTITY = 10;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectCode: true,
        groupBatch: true,
        batchNumber: true,
        voucherNumber: true,
        securityCode: true,
        mrp: true,
        validityDate: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(vouchers);
  } catch {
    return errorResponse("Unable to load vouchers.", 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.");
  }

  const projectCode = typeof body.projectCode === "string" ? body.projectCode.trim() : "";
  const groupBatch = typeof body.groupBatch === "string" ? body.groupBatch.trim() : "";
  const batchNumber = typeof body.batchNumber === "string" ? body.batchNumber.trim() : "";
  const mrp = Number(body.mrp);
  const quantity = Number(body.quantity);
  const validityDate = typeof body.validityDate === "string"
    ? new Date(`${body.validityDate}T23:59:59.999Z`)
    : new Date("invalid");

  if (!projectCode || !groupBatch || !batchNumber) {
    return errorResponse("Project code, group batch, and batch number are required.");
  }

  if (!Number.isFinite(mrp) || mrp < 0) {
    return errorResponse("MRP must be a valid non-negative price.");
  }

  if (!Number.isInteger(quantity) || quantity < MINIMUM_BATCH_QUANTITY) {
    return errorResponse(`Quantity must be at least ${MINIMUM_BATCH_QUANTITY}.`);
  }

  if (Number.isNaN(validityDate.getTime())) {
    return errorResponse("Validity date must be a valid date.");
  }

  try {
    const vouchers = await prisma.$transaction(async (transaction) => {
      const records = [];
      const voucherNumbers = new Set<string>();

      while (records.length < quantity) {
        const sequence = randomInt(100000, 1000000).toString();
        const voucherNumber = `${projectCode}-${groupBatch}-${batchNumber}-${sequence}`;

        if (voucherNumbers.has(voucherNumber)) {
          continue;
        }

        const existingVoucher = await transaction.voucher.findUnique({
          where: { voucherNumber },
          select: { id: true },
        });

        if (existingVoucher) {
          continue;
        }

        voucherNumbers.add(voucherNumber);
        records.push({
          projectCode,
          groupBatch,
          batchNumber,
          voucherNumber,
          securityCode: randomInt(10000000, 100000000).toString(),
          mrp,
          validityDate,
        });
      }

      await transaction.voucher.createMany({ data: records });
      return records;
    });

    return NextResponse.json(
      { message: `${vouchers.length} vouchers created successfully.`, vouchers },
      { status: 201 },
    );
  } catch {
    return errorResponse("Unable to create vouchers. Please try again.", 500);
  }
}
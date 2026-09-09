import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Unsupported SRS assumption: wholesale price is fixed at 300 per voucher for now.
const WHOLESALE_PRICE = 300;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function nextInvoiceNumber(lastInvoiceNumber: string | undefined) {
  const lastNumber = lastInvoiceNumber ? Number(lastInvoiceNumber.replace("INV-", "")) : 0;
  return `INV-${(lastNumber + 1).toString().padStart(6, "0")}`;
}

export async function GET() {
  try {
    const [transactions, availableCount] = await Promise.all([
      prisma.distributionTransaction.findMany({
        orderBy: { date: "desc" },
        include: {
          distributor: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.voucher.count({ where: { status: "created" } }),
    ]);

    return NextResponse.json({ transactions, availableCount });
  } catch {
    return errorResponse("Unable to load distribution transactions.", 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.");
  }

  const distributorId = typeof body.distributorId === "string" ? body.distributorId.trim() : "";
  const quantity = Number(body.quantity);

  if (!distributorId) return errorResponse("Distributor is required.");
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return errorResponse("Quantity must be a positive whole number.");
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const distributor = await transaction.distributor.findUnique({
        where: { id: distributorId },
        select: { id: true, status: true },
      });

      if (!distributor) throw new Error("DISTRIBUTOR_NOT_FOUND");
      if (distributor.status !== "active") throw new Error("DISTRIBUTOR_INACTIVE");

      const availableVouchers = await transaction.voucher.findMany({
        where: { status: "created" },
        orderBy: { createdAt: "asc" },
        take: quantity,
        select: { id: true, voucherNumber: true },
      });

      if (availableVouchers.length < quantity) throw new Error("INSUFFICIENT_STOCK");

      const voucherIds = availableVouchers.map((voucher) => voucher.id);
      const updatedVouchers = await transaction.voucher.updateMany({
        where: { id: { in: voucherIds }, status: "created" },
        data: { status: "sold" },
      });

      if (updatedVouchers.count !== quantity) throw new Error("STOCK_CONFLICT");

      const latestTransaction = await transaction.distributionTransaction.findFirst({
        orderBy: { invoiceNo: "desc" },
        select: { invoiceNo: true },
      });
      const invoiceNo = nextInvoiceNumber(latestTransaction?.invoiceNo);
      const distribution = await transaction.distributionTransaction.create({
        data: {
          invoiceNo,
          distributorId,
          quantity,
          invoiceAmount: quantity * WHOLESALE_PRICE,
          items: {
            createMany: {
              data: voucherIds.map((voucherId) => ({ voucherId })),
            },
          },
        },
        include: { distributor: { select: { name: true } } },
      });

      return { distribution, vouchers: availableVouchers };
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ ...result, wholesalePrice: WHOLESALE_PRICE }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DISTRIBUTOR_NOT_FOUND") return errorResponse("Selected distributor was not found.", 404);
      if (error.message === "DISTRIBUTOR_INACTIVE") return errorResponse("Only active distributors can receive vouchers.");
      if (error.message === "INSUFFICIENT_STOCK") return errorResponse(`Insufficient voucher stock. ${quantity} requested, but fewer than ${quantity} vouchers are available.`, 409);
      if (error.message === "STOCK_CONFLICT") return errorResponse("Stock changed while processing the transaction. Please try again.", 409);
    }
    return errorResponse("Unable to create distribution transaction.", 500);
  }
}
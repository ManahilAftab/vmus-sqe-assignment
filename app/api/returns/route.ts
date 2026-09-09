import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const WHOLESALE_PRICE = 300;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const distributorId = new URL(request.url).searchParams.get("distributorId")?.trim();

  try {
    const returns = await prisma.salesReturn.findMany({
      orderBy: { date: "desc" },
      include: {
        distributor: { select: { name: true } },
        voucher: { select: { voucherNumber: true } },
      },
    });

    if (!distributorId) return NextResponse.json({ returns });

    const vouchers = await prisma.voucher.findMany({
      where: {
        status: "sold",
        distributionItems: {
          some: { transaction: { distributorId } },
        },
      },
      orderBy: { voucherNumber: "asc" },
      select: { id: true, voucherNumber: true },
    });

    return NextResponse.json({ returns, vouchers });
  } catch {
    return errorResponse("Unable to load sales returns.", 500);
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
  const voucherId = typeof body.voucherId === "string" ? body.voucherId.trim() : "";

  if (!distributorId) return errorResponse("Distributor is required.");
  if (!voucherId) return errorResponse("Voucher is required.");

  try {
    const salesReturn = await prisma.$transaction(async (transaction) => {
      const distributor = await transaction.distributor.findUnique({
        where: { id: distributorId },
        select: { id: true },
      });
      if (!distributor) throw new Error("DISTRIBUTOR_NOT_FOUND");

      const voucher = await transaction.voucher.findFirst({
        where: {
          id: voucherId,
          status: "sold",
          distributionItems: {
            some: { transaction: { distributorId } },
          },
        },
        select: { id: true },
      });

      if (!voucher) {
        const existingVoucher = await transaction.voucher.findUnique({
          where: { id: voucherId },
          select: { status: true },
        });

        if (existingVoucher?.status === "returned") throw new Error("ALREADY_RETURNED");
        throw new Error("VOUCHER_NOT_OWNED");
      }

      const updatedVoucher = await transaction.voucher.updateMany({
        where: { id: voucher.id, status: "sold" },
        data: { status: "returned" },
      });
      if (updatedVoucher.count !== 1) throw new Error("ALREADY_RETURNED");

      return transaction.salesReturn.create({
        data: { distributorId, voucherId, returnAmount: WHOLESALE_PRICE },
        include: {
          distributor: { select: { name: true } },
          voucher: { select: { voucherNumber: true } },
        },
      });
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ salesReturn, returnAmount: WHOLESALE_PRICE }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DISTRIBUTOR_NOT_FOUND") return errorResponse("Selected distributor was not found.", 404);
      if (error.message === "VOUCHER_NOT_OWNED") return errorResponse("This voucher was not sold to the selected distributor.", 409);
      if (error.message === "ALREADY_RETURNED") return errorResponse("This voucher has already been returned.", 409);
    }
    return errorResponse("Unable to create sales return.", 500);
  }
}
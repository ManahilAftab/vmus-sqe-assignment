import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const SCREEN_NAMES = ["Voucher", "Distributor", "Distribution", "VSP", "Claim", "SalesReturn", "User"] as const;
const PERMISSION_FIELDS = ["canNew", "canEdit", "canDelete", "canView", "canPrint"] as const;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isPermissionRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET() {
  try {
    const groups = await prisma.userGroup.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: { orderBy: { screenName: "asc" } },
        _count: { select: { users: true } },
      },
    });
    return NextResponse.json(groups);
  } catch {
    return errorResponse("Unable to load user groups.", 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const submittedPermissions = Array.isArray(body.permissions) ? body.permissions : [];

  if (!name) return errorResponse("Group name is required.");

  const permissionsByScreen = new Map<string, Record<string, unknown>>();
  for (const permission of submittedPermissions) {
    if (!isPermissionRecord(permission) || typeof permission.screenName !== "string") {
      return errorResponse("Each permission must include a screen name.");
    }
    permissionsByScreen.set(permission.screenName, permission);
  }

  if (SCREEN_NAMES.some((screenName) => !permissionsByScreen.has(screenName))) {
    return errorResponse("Permissions for all required screens must be provided.");
  }

  const hasInvalidPermission = SCREEN_NAMES.some((screenName) => {
    const permission = permissionsByScreen.get(screenName)!;
    return PERMISSION_FIELDS.some((field) => typeof permission[field] !== "boolean");
  });
  if (hasInvalidPermission) {
    return errorResponse("Permission values must be true or false.");
  }

  const permissionRows = SCREEN_NAMES.map((screenName) => {
    const permission = permissionsByScreen.get(screenName)!;
    return {
      screenName,
      canNew: permission.canNew as boolean,
      canEdit: permission.canEdit as boolean,
      canDelete: permission.canDelete as boolean,
      canView: permission.canView as boolean,
      canPrint: permission.canPrint as boolean,
    };
  });

  try {
    const group = await prisma.$transaction(async (transaction) => transaction.userGroup.create({
      data: {
        name,
        permissions: { create: permissionRows },
      },
      include: { permissions: true },
    }));

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return errorResponse(`A user group named ${name} already exists.`, 409);
    }
    return errorResponse("Unable to create user group.", 500);
  }
}
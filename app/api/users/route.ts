import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const PASSWORD_SALT_ROUNDS = 12;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { username: "asc" },
      select: {
        id: true,
        username: true,
        group: { select: { name: true } },
        createdAt: true,
      },
    });
    return NextResponse.json(users);
  } catch {
    return errorResponse("Unable to load users.", 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.");
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const groupId = typeof body.groupId === "string" ? body.groupId.trim() : "";

  if (!username) return errorResponse("Username is required.");
  if (!password) return errorResponse("Password is required.");
  if (!groupId) return errorResponse("User group is required.");

  try {
    const group = await prisma.userGroup.findUnique({ where: { id: groupId }, select: { id: true } });
    if (!group) return errorResponse("Selected user group was not found.", 404);

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { username, password: passwordHash, groupId },
      select: {
        id: true,
        username: true,
        group: { select: { name: true } },
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return errorResponse(`A user named ${username} already exists.`, 409);
    }
    return errorResponse("Unable to create user.", 500);
  }
}
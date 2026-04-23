import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "LEAGUE_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { userId } = await params;
    const body = await req.json();
    const updateData: { role?: UserRole; teamId?: string | null } = {};

    if (body.role !== undefined) {
      if (!Object.values(UserRole).includes(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      if (session.user.id === userId) {
        return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
      }
      updateData.role = body.role as UserRole;
    }

    if ("teamId" in body) {
      updateData.teamId = body.teamId ?? null;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        team: { select: { name: true } },
      },
    });
    return NextResponse.json(user);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      users: { select: { id: true, name: true, email: true, role: true } },
      persons: {
        select: { id: true, fullName: true, role: true, status: true, division: true, classLabel: true },
        orderBy: { fullName: "asc" },
      },
    },
  });
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(team);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "LEAGUE_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { teamId } = await params;
    const { name, shortName } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const team = await prisma.team.update({
      where: { id: teamId },
      data: { name, shortName: shortName || null },
    });
    return NextResponse.json(team);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A team with that name already exists" }, { status: 409 });
    }
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "LEAGUE_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { teamId } = await params;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { _count: { select: { persons: true, users: true } } },
    });
    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (team._count.persons > 0 || team._count.users > 0) {
      return NextResponse.json(
        { error: "Cannot delete team with linked persons or users. Remove them first." },
        { status: 409 }
      );
    }
    await prisma.team.delete({ where: { id: teamId } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

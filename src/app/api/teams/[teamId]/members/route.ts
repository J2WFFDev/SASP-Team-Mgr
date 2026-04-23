import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "LEAGUE_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { teamId } = await params;
    const { personId } = await req.json();
    if (!personId) return NextResponse.json({ error: "personId is required" }, { status: 400 });

    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    const person = await prisma.person.update({
      where: { id: personId },
      data: { teamId, team: team.name },
    });
    return NextResponse.json(person);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  _ctx: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "LEAGUE_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { personId } = await req.json();
    if (!personId) return NextResponse.json({ error: "personId is required" }, { status: 400 });

    const person = await prisma.person.update({
      where: { id: personId },
      data: { teamId: null, team: null },
    });
    return NextResponse.json(person);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

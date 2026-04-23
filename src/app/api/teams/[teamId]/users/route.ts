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
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { teamId },
    });
    return NextResponse.json(user);
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
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });
    return NextResponse.json(user);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

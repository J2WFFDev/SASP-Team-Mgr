import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function adminOrDirector(role: string) {
  return role === "LEAGUE_ADMIN" || role === "MATCH_DIRECTOR";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; assignmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminOrDirector(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { assignmentId } = await params;
  const { disciplineId, squadId, stageId, relay, relayCode, shootOrder, notes } = await req.json();

  try {
    const assignment = await prisma.athleteAssignment.update({
      where: { id: assignmentId },
      data: {
        ...(disciplineId !== undefined && { disciplineId: disciplineId || null }),
        ...(squadId !== undefined && { squadId: squadId || null }),
        ...(stageId !== undefined && { stageId: stageId || null }),
        ...(relay !== undefined && { relay: relay != null ? Number(relay) : null }),
        ...(relayCode !== undefined && { relayCode: relayCode || null }),
        ...(shootOrder !== undefined && { shootOrder: shootOrder != null ? Number(shootOrder) : null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: {
        person: { select: { id: true, fullName: true, division: true } },
        discipline: { select: { id: true, name: true } },
        flight: { select: { id: true, name: true } },
        squad: { select: { id: true, squadNum: true, squadName: true } },
      },
    });
    return NextResponse.json(assignment);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; assignmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminOrDirector(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { assignmentId } = await params;
  try {
    await prisma.athleteAssignment.delete({ where: { id: assignmentId } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

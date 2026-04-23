import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const assignments = await prisma.athleteAssignment.findMany({
    where: { eventId },
    include: {
      person: { select: { id: true, fullName: true, division: true } },
      discipline: { select: { id: true, name: true } },
      flight: { select: { id: true, name: true } },
      squad: { select: { id: true, squadNum: true, squadName: true } },
    },
    orderBy: [
      { flight: { flightOrder: "asc" } },
      { relay: "asc" },
      { shootOrder: "asc" },
    ],
  });
  return NextResponse.json(assignments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "LEAGUE_ADMIN" && session.user.role !== "MATCH_DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId } = await params;
  const { personId, flightId, disciplineId, squadId, stageId, relay, relayCode, shootOrder, notes } =
    await req.json();

  if (!personId || !flightId) {
    return NextResponse.json({ error: "personId and flightId are required" }, { status: 400 });
  }

  try {
    const assignment = await prisma.athleteAssignment.create({
      data: {
        eventId,
        personId,
        flightId,
        disciplineId: disciplineId || null,
        squadId: squadId || null,
        stageId: stageId || null,
        relay: relay != null ? Number(relay) : null,
        relayCode: relayCode || null,
        shootOrder: shootOrder != null ? Number(shootOrder) : null,
        notes: notes || null,
      },
      include: {
        person: { select: { id: true, fullName: true, division: true } },
        discipline: { select: { id: true, name: true } },
        flight: { select: { id: true, name: true } },
        squad: { select: { id: true, squadNum: true, squadName: true } },
      },
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

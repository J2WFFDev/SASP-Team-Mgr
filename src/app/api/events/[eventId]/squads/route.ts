import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const squads = await prisma.squad.findMany({
    where: { eventId },
    orderBy: { squadNum: "asc" },
    include: {
      athleteAssignments: {
        include: {
          person: { select: { id: true, fullName: true, division: true } },
          discipline: { select: { id: true, name: true } },
          flight: { select: { id: true, name: true } },
        },
        orderBy: [{ relay: "asc" }, { shootOrder: "asc" }],
      },
    },
  });
  return NextResponse.json(squads);
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
  const { squadNum, squadName, division } = await req.json();

  if (squadNum == null) {
    return NextResponse.json({ error: "squadNum is required" }, { status: 400 });
  }

  try {
    const squad = await prisma.squad.create({
      data: {
        eventId,
        squadNum: Number(squadNum),
        squadName: squadName || null,
        division: division || null,
      },
    });
    return NextResponse.json(squad, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

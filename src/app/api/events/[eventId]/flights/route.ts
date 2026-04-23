import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const flights = await prisma.flight.findMany({
    where: { eventId },
    orderBy: [{ flightOrder: "asc" }, { startTime: "asc" }],
    include: { _count: { select: { athleteAssignments: true, staffAssignments: true } } },
  });
  return NextResponse.json(flights);
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
  const { name, startTime, flightOrder } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  // Auto-compute order if not supplied
  const order =
    flightOrder != null
      ? Number(flightOrder)
      : ((await prisma.flight.count({ where: { eventId } })) + 1);

  try {
    const flight = await prisma.flight.create({
      data: {
        eventId,
        name,
        startTime: startTime ? new Date(startTime) : null,
        flightOrder: order,
      },
    });
    return NextResponse.json(flight, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

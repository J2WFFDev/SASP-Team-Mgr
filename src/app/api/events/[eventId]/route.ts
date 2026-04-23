import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { baySets: { orderBy: { baySetOrder: "asc" } } },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "LEAGUE_ADMIN" && session.user.role !== "MATCH_DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId } = await params;
  const { flightsPerDay } = await req.json();

  try {
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(flightsPerDay !== undefined && {
          flightsPerDay: Math.min(10, Math.max(1, Number(flightsPerDay) || 1)),
        }),
      },
    });
    return NextResponse.json(event);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function adminOrDirector(role: string) {
  return role === "LEAGUE_ADMIN" || role === "MATCH_DIRECTOR";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; flightId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminOrDirector(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { flightId } = await params;
  const { name, startTime, flightOrder } = await req.json();

  try {
    const flight = await prisma.flight.update({
      where: { id: flightId },
      data: {
        ...(name !== undefined && { name }),
        ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
        ...(flightOrder !== undefined && { flightOrder: Number(flightOrder) }),
      },
    });
    return NextResponse.json(flight);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; flightId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminOrDirector(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { flightId } = await params;
  try {
    await prisma.flight.delete({ where: { id: flightId } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

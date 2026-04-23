import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ForecastStatus } from "@prisma/client";

const VALID_STATUSES = Object.values(ForecastStatus);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "LEAGUE_ADMIN" && role !== "MATCH_DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId } = await params;
  const { forecastStatus } = await req.json();

  if (!forecastStatus || !VALID_STATUSES.includes(forecastStatus)) {
    return NextResponse.json({ error: "Invalid forecastStatus" }, { status: 400 });
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: { forecastStatus },
    select: { id: true, forecastStatus: true },
  });

  return NextResponse.json(event);
}

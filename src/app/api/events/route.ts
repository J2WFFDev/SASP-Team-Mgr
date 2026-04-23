import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const events = await prisma.event.findMany({ orderBy: { startDate: "asc" } });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "LEAGUE_ADMIN" && session.user.role !== "MATCH_DIRECTOR") {
    return NextResponse.json({ error: "Forbidden: only Match Directors and League Admins may create events" }, { status: 403 });
  }
  try {
    const { name, description, startDate, endDate } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

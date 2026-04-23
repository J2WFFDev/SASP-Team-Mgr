import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const events = await prisma.event.findMany({ orderBy: { startDate: "asc" } });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
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

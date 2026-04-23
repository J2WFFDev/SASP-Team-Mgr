import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const baySets = await prisma.baySet.findMany({
    where: { eventId },
    orderBy: { baySetOrder: "asc" },
  });
  return NextResponse.json(baySets);
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
  const { label, slotsPerBay, stage1, stage2, stage3, stage4 } = await req.json();

  // Determine next baySetOrder
  const count = await prisma.baySet.count({ where: { eventId } });

  try {
    const baySet = await prisma.baySet.create({
      data: {
        eventId,
        label: label || null,
        slotsPerBay: Math.min(50, Math.max(1, Number(slotsPerBay) || 16)),
        stage1: stage1 || "Go-Fast",
        stage2: stage2 || null,
        stage3: stage3 || null,
        stage4: stage4 || null,
        baySetOrder: count,
      },
    });
    return NextResponse.json(baySet, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

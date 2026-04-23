import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; baySetId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "LEAGUE_ADMIN" && session.user.role !== "MATCH_DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { baySetId } = await params;
  const { label, slotsPerBay, stage1, stage2, stage3, stage4 } = await req.json();

  try {
    const baySet = await prisma.baySet.update({
      where: { id: baySetId },
      data: {
        ...(label !== undefined && { label: label || null }),
        ...(slotsPerBay !== undefined && { slotsPerBay: Math.min(50, Math.max(1, Number(slotsPerBay))) }),
        ...(stage1 !== undefined && { stage1: stage1 || "Go-Fast" }),
        ...(stage2 !== undefined && { stage2: stage2 || null }),
        ...(stage3 !== undefined && { stage3: stage3 || null }),
        ...(stage4 !== undefined && { stage4: stage4 || null }),
      },
    });
    return NextResponse.json(baySet);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; baySetId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "LEAGUE_ADMIN" && session.user.role !== "MATCH_DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { baySetId } = await params;
  try {
    await prisma.baySet.delete({ where: { id: baySetId } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

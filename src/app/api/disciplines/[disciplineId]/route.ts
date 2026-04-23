import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ disciplineId: string }> }) {
  try {
    const { disciplineId } = await params;
    const { name, shortName, gunType } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const discipline = await prisma.discipline.update({
      where: { id: disciplineId },
      data: { name, shortName: shortName || null, gunType: gunType || null },
    });
    return NextResponse.json(discipline);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A discipline with that name already exists" }, { status: 409 });
    }
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ disciplineId: string }> }) {
  try {
    const { disciplineId } = await params;
    const commitments = await prisma.commitmentStatus.count({ where: { disciplineId } });
    const assignments = await prisma.athleteAssignment.count({ where: { disciplineId } });
    if (commitments + assignments > 0) {
      return NextResponse.json(
        { error: "Cannot delete: discipline is referenced by existing assignments or commitments." },
        { status: 409 }
      );
    }
    await prisma.discipline.delete({ where: { id: disciplineId } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

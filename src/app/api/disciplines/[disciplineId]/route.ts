import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

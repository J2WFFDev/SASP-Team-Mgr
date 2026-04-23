import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CommitmentStatusEnum } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const commitments = await prisma.commitmentStatus.findMany({
    where: { eventId },
    include: {
      person: { select: { id: true, fullName: true, role: true, division: true, classLabel: true } },
      discipline: { select: { id: true, name: true, gunType: true } },
    },
    orderBy: [{ person: { fullName: "asc" } }, { discipline: { name: "asc" } }],
  });
  return NextResponse.json(commitments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const { personId, disciplineId, status } = await req.json();
    if (!personId || !disciplineId) {
      return NextResponse.json({ error: "personId and disciplineId are required" }, { status: 400 });
    }
    const resolvedStatus: CommitmentStatusEnum =
      status && Object.values(CommitmentStatusEnum).includes(status) ? status : "NO_RESPONSE";

    const commitment = await prisma.commitmentStatus.upsert({
      where: { eventId_personId_disciplineId: { eventId, personId, disciplineId } },
      update: { status: resolvedStatus },
      create: { eventId, personId, disciplineId, status: resolvedStatus },
      include: {
        person: { select: { id: true, fullName: true, role: true, division: true, classLabel: true } },
        discipline: { select: { id: true, name: true, gunType: true } },
      },
    });
    return NextResponse.json(commitment, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

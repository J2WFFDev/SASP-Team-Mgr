import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CommitmentStatusEnum } from "@prisma/client";

// POST /api/events/[eventId]/commitment/bulk
// Body: { entries: { personId, disciplineId, status? }[] }
// Upserts all entries (existing records not overwritten if already set)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const { entries } = await req.json() as {
    entries: { personId: string; disciplineId: string; status?: CommitmentStatusEnum }[];
  };

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "entries array is required" }, { status: 400 });
  }

  const results = await prisma.$transaction(
    entries.map(({ personId, disciplineId, status }) =>
      prisma.commitmentStatus.upsert({
        where: { eventId_personId_disciplineId: { eventId, personId, disciplineId } },
        // Only create if missing — do NOT overwrite an existing status
        update: {},
        create: {
          eventId,
          personId,
          disciplineId,
          status: status ?? "NO_RESPONSE",
        },
      })
    )
  );

  return NextResponse.json({ count: results.length });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CommitmentStatusEnum } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; commitmentId: string }> }
) {
  try {
    const { commitmentId } = await params;
    const { status } = await req.json();
    if (!status || !Object.values(CommitmentStatusEnum).includes(status)) {
      return NextResponse.json({ error: "Valid status is required" }, { status: 400 });
    }
    const commitment = await prisma.commitmentStatus.update({
      where: { id: commitmentId },
      data: { status },
      include: {
        person: { select: { id: true, fullName: true } },
        discipline: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(commitment);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; commitmentId: string }> }
) {
  try {
    const { commitmentId } = await params;
    await prisma.commitmentStatus.delete({ where: { id: commitmentId } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

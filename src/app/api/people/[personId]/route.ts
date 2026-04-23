import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PersonRole, PersonStatus } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(person);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ personId: string }> }) {
  try {
    const { personId } = await params;
    const { fullName, email, role, status, teamId, gender, division, classLabel } = await req.json();
    if (!fullName) return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    if (role && !Object.values(PersonRole).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (status && !Object.values(PersonStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const teamRecord = teamId
      ? await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } })
      : null;
    const person = await prisma.person.update({
      where: { id: personId },
      data: {
        fullName,
        email: email || null,
        role: role || "ATHLETE",
        status: status || "ACTIVE",
        teamId: teamId || null,
        team: teamRecord?.name || null,
        gender: gender || null,
        division: division || null,
        classLabel: classLabel || null,
      },
    });
    return NextResponse.json(person);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A person with that name already exists" }, { status: 409 });
    }
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ personId: string }> }) {
  try {
    const { personId } = await params;
    const assignments = await prisma.athleteAssignment.count({ where: { personId } });
    const staffAssignments = await prisma.staffAssignment.count({ where: { personId } });
    if (assignments + staffAssignments > 0) {
      return NextResponse.json(
        { error: "Cannot delete: person has existing event assignments. Remove assignments first." },
        { status: 409 }
      );
    }
    // Delete commitment statuses first (no cascade)
    await prisma.commitmentStatus.deleteMany({ where: { personId } });
    await prisma.person.delete({ where: { id: personId } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

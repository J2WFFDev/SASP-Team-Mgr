import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PersonRole, PersonStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const statusFilter = searchParams.get("status");

  const people = await prisma.person.findMany({
    where: statusFilter && Object.values(PersonStatus).includes(statusFilter as PersonStatus)
      ? { status: statusFilter as PersonStatus }
      : undefined,
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json(people);
}

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, role, status, teamId, division, classLabel } = await req.json();
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
    const person = await prisma.person.create({
      data: {
        fullName,
        email: email || null,
        role: role || "ATHLETE",
        status: status || "ACTIVE",
        teamId: teamId || null,
        team: teamRecord?.name || null,
        division: division || null,
        classLabel: classLabel || null,
      },
    });
    return NextResponse.json(person, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A person with that name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  const { personId } = await params;
  const [coachLinks, athleteLinks] = await Promise.all([
    prisma.personLink.findMany({
      where: { coachId: personId },
      include: { athlete: { select: { id: true, fullName: true, division: true, team: true } } },
      orderBy: { athlete: { fullName: "asc" } },
    }),
    prisma.personLink.findMany({
      where: { athleteId: personId },
      include: { coach: { select: { id: true, fullName: true, role: true } } },
      orderBy: { coach: { fullName: "asc" } },
    }),
  ]);
  return NextResponse.json({ coachLinks, athleteLinks });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { personId } = await params;
  const { athleteId, coachId } = await req.json();

  // personId is either the coach (linking to an athlete) or the athlete (linking to a coach)
  const linkCoachId = coachId ?? personId;
  const linkAthleteId = athleteId ?? personId;

  if (linkCoachId === linkAthleteId) {
    return NextResponse.json({ error: "Cannot link a person to themselves" }, { status: 400 });
  }

  try {
    const link = await prisma.personLink.create({
      data: { coachId: linkCoachId, athleteId: linkAthleteId },
      include: {
        coach: { select: { id: true, fullName: true, role: true } },
        athlete: { select: { id: true, fullName: true, division: true, team: true } },
      },
    });
    return NextResponse.json(link, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

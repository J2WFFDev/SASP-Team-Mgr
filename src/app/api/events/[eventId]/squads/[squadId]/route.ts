import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function adminOrDirector(role: string) {
  return role === "LEAGUE_ADMIN" || role === "MATCH_DIRECTOR";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; squadId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminOrDirector(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { squadId } = await params;
  const { squadNum, squadName, division } = await req.json();

  try {
    const squad = await prisma.squad.update({
      where: { id: squadId },
      data: {
        ...(squadNum !== undefined && { squadNum: Number(squadNum) }),
        ...(squadName !== undefined && { squadName: squadName || null }),
        ...(division !== undefined && { division: division || null }),
      },
    });
    return NextResponse.json(squad);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; squadId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminOrDirector(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { squadId } = await params;
  try {
    await prisma.squad.delete({ where: { id: squadId } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

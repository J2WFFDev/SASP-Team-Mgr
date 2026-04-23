import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { personId } = await params;

  const notes = await prisma.athleteNote.findMany({
    where: {
      personId,
      teamId: session.user.teamId ?? undefined,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { personId } = await params;
  const { content } = await req.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const note = await prisma.athleteNote.create({
    data: {
      personId,
      authorId: session.user.id,
      teamId: session.user.teamId ?? null,
      content: content.trim(),
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(note, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ personId: string; noteId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { noteId } = await params;

  const note = await prisma.athleteNote.findUnique({ where: { id: noteId } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the author or a LEAGUE_ADMIN can delete
  const isAuthor = note.authorId === session.user.id;
  const isAdmin = session.user.role === "LEAGUE_ADMIN";
  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.athleteNote.delete({ where: { id: noteId } });
  return NextResponse.json({ ok: true });
}

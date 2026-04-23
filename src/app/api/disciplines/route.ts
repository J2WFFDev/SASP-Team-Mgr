import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const disciplines = await prisma.discipline.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(disciplines);
}

export async function POST(req: NextRequest) {
  try {
    const { name, gunType } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const discipline = await prisma.discipline.create({
      data: { name, gunType: gunType || null },
    });
    return NextResponse.json(discipline, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A discipline with that name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

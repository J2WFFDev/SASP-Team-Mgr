import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // First registered user automatically becomes LEAGUE_ADMIN; all others are HEAD_COACH
    const userCount = await prisma.user.count();
    const assignedRole = userCount === 0 ? "LEAGUE_ADMIN" : "HEAD_COACH";

    const hashed = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashed,
        role: assignedRole,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

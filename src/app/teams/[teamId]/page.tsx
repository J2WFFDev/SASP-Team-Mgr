import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import TeamDetailClient from "./TeamDetailClient";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "LEAGUE_ADMIN") {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <p className="text-red-600">403 — You do not have permission to view this page.</p>
      </div>
    );
  }

  const { teamId } = await params;
  const [team, allPersons, allUsers] = await Promise.all([
    prisma.team.findUnique({
      where: { id: teamId },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        persons: {
          select: {
            id: true,
            fullName: true,
            role: true,
            status: true,
            division: true,
            classLabel: true,
          },
          orderBy: { fullName: "asc" },
        },
      },
    }),
    prisma.person.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        role: true,
        status: true,
        division: true,
        classLabel: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  if (!team) notFound();

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/teams" className="hover:underline">
          Teams
        </Link>
        <span>/</span>
        <span>{team.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{team.name}</h1>

      <TeamDetailClient team={team} allPersons={allPersons} allUsers={allUsers} />
    </div>
  );
}

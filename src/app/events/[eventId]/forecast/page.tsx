import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ForecastClient from "./ForecastClient";

export const dynamic = "force-dynamic";

export default async function ForecastPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const role = session.user.role;
  const userTeamId = session.user.teamId ?? null;
  const canManageForecastStatus = role === "LEAGUE_ADMIN" || role === "MATCH_DIRECTOR";

  // Scope members: HEAD_COACH sees only their team; admins see all
  const memberWhere =
    role === "HEAD_COACH" && userTeamId
      ? { teamId: userTeamId, status: "ACTIVE" as const }
      : { status: "ACTIVE" as const };

  const [members, disciplines, commitments] = await Promise.all([
    prisma.person.findMany({
      where: memberWhere,
      include: { teamRef: { select: { id: true, name: true } } },
      orderBy: [{ fullName: "asc" }],
    }),
    prisma.discipline.findMany({ orderBy: { name: "asc" } }),
    prisma.commitmentStatus.findMany({
      where: { eventId },
      select: { id: true, personId: true, disciplineId: true, status: true },
    }),
  ]);

  const formattedMembers = members.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    role: m.role,
    teamId: m.teamId,
    teamName: m.teamRef?.name ?? null,
  }));

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">
          Events
        </Link>
        <span>/</span>
        <Link href={`/events/${eventId}`} className="hover:underline">
          {event.name}
        </Link>
        <span>/</span>
        <span>Forecast</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Event Forecast</h1>
        <p className="text-sm text-gray-500">{event.name}</p>
      </div>

      {role === "HEAD_COACH" && !userTeamId && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded px-4 py-3 text-sm text-amber-800">
          Your account is not assigned to a team. Ask a League Admin to assign you to a team under{" "}
          <a href="/admin/users" className="underline">
            Users
          </a>
          .
        </div>
      )}

      <ForecastClient
        eventId={eventId}
        forecastStatus={event.forecastStatus}
        canManageForecastStatus={canManageForecastStatus}
        members={formattedMembers}
        disciplines={disciplines.map((d) => ({
          id: d.id,
          name: d.name,
          gunType: d.gunType ?? null,
        }))}
        initialCommitments={commitments.map((c) => ({
          id: c.id,
          personId: c.personId,
          disciplineId: c.disciplineId,
          status: c.status,
        }))}
      />
    </div>
  );
}

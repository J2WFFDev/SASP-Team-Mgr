import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SquadPlannerClient from "./SquadPlannerClient";

export const dynamic = "force-dynamic";

export default async function SquadPlannerPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "LEAGUE_ADMIN" && role !== "MATCH_DIRECTOR") {
    redirect(`/events/${(await params).eventId}`);
  }

  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const [flights, squads, assignments, commitments, disciplines] = await Promise.all([
    prisma.flight.findMany({
      where: { eventId },
      orderBy: [{ flightOrder: "asc" }, { startTime: "asc" }],
    }),
    prisma.squad.findMany({
      where: { eventId },
      orderBy: { squadNum: "asc" },
    }),
    prisma.athleteAssignment.findMany({
      where: { eventId },
      include: {
        person: { select: { id: true, fullName: true, division: true } },
        discipline: { select: { id: true, name: true } },
        flight: { select: { id: true, name: true } },
        squad: { select: { id: true, squadNum: true, squadName: true } },
      },
      orderBy: [{ flight: { flightOrder: "asc" } }, { relay: "asc" }, { shootOrder: "asc" }],
    }),
    // Committed / Tentative athletes from forecast
    prisma.commitmentStatus.findMany({
      where: {
        eventId,
        status: { in: ["COMMITTED", "TENTATIVE"] },
      },
      include: {
        person: { select: { id: true, fullName: true, division: true } },
        discipline: { select: { id: true, name: true } },
      },
      orderBy: { person: { fullName: "asc" } },
    }),
    prisma.discipline.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Build pool: unique persons with their enrolled disciplines
  const poolMap = new Map<
    string,
    { personId: string; fullName: string; division: string | null; disciplines: { disciplineId: string; disciplineName: string }[] }
  >();
  for (const c of commitments) {
    if (!poolMap.has(c.personId)) {
      poolMap.set(c.personId, {
        personId: c.personId,
        fullName: c.person.fullName,
        division: c.person.division,
        disciplines: [],
      });
    }
    poolMap.get(c.personId)!.disciplines.push({
      disciplineId: c.disciplineId,
      disciplineName: c.discipline.name,
    });
  }
  const pool = Array.from(poolMap.values()).sort((a, b) =>
    a.fullName.localeCompare(b.fullName)
  );

  // Attach squads to flights for initial state
  const squadsByFlight = new Map<string, typeof squads>();
  for (const s of squads) {
    // Squads aren't tied to a flight directly in the schema — they live at event level.
    // Determine which flight a squad belongs to by looking at its assignments.
    const flightId = assignments.find((a) => a.squadId === s.id)?.flightId ?? null;
    if (flightId) {
      if (!squadsByFlight.has(flightId)) squadsByFlight.set(flightId, []);
      squadsByFlight.get(flightId)!.push(s);
    }
  }

  const flightsWithSquads = flights.map((f) => ({
    ...f,
    startTime: f.startTime?.toISOString() ?? null,
    squads: (squadsByFlight.get(f.id) ?? []).map((s) => ({
      ...s,
      flightId: f.id,
      assignments: assignments
        .filter((a) => a.squadId === s.id)
        .map((a) => ({
          ...a,
          flight: { id: a.flight.id, name: a.flight.name },
        })),
    })),
  }));

  const serialisedAssignments = assignments.map((a) => ({
    id: a.id,
    personId: a.personId,
    person: a.person,
    disciplineId: a.disciplineId,
    discipline: a.discipline,
    flightId: a.flightId,
    squadId: a.squadId,
    relay: a.relay,
    shootOrder: a.shootOrder,
  }));

  const unassignedSquads = squads.filter(
    (s) => !assignments.some((a) => a.squadId === s.id)
  );

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <Link href={`/events/${eventId}`} className="hover:underline">{event.name}</Link>
        <span>/</span>
        <span>Squad Planner</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Squad Planner</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{pool.length} committed/tentative athletes</span>
          <Link
            href={`/events/${eventId}/schedule`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded"
          >
            View Schedule →
          </Link>
        </div>
      </div>

      {unassignedSquads.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          <strong>{unassignedSquads.length} squad(s)</strong> have no athletes assigned yet (may have been created via TSV import):
          {" "}{unassignedSquads.map((s) => `#${s.squadNum}${s.squadName ? ` ${s.squadName}` : ""}`).join(", ")}
        </div>
      )}

      <SquadPlannerClient
        eventId={eventId}
        initialFlights={flightsWithSquads}
        initialAssignments={serialisedAssignments}
        pool={pool}
        disciplines={disciplines.map((d) => ({ id: d.id, name: d.name }))}
      />
    </div>
  );
}

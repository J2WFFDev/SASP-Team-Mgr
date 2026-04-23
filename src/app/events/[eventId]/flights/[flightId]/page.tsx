import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; flightId: string }>;
}) {
  const { eventId, flightId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) notFound();

  const athleteAssignments = await prisma.athleteAssignment.findMany({
    where: { flightId, eventId },
    include: { person: true, stage: true, discipline: true, squad: true },
    orderBy: [{ relay: "asc" }, { shootOrder: "asc" }, { person: { fullName: "asc" } }],
  });

  const staffAssignments = await prisma.staffAssignment.findMany({
    where: { flightId: flightId, eventId: eventId },
    include: { person: true },
    orderBy: [{ relay: "asc" }, { role: "asc" }],
  });

  // Get coach-athlete links to show relay staffing hints
  const athleteIds = athleteAssignments.map((a) => a.personId);
  const coachLinks = await prisma.personLink.findMany({
    where: { athleteId: { in: athleteIds } },
    include: { coach: { select: { id: true, fullName: true, role: true } } },
  });

  // Map relay → coaches (deduplicated)
  const coachesByRelay = new Map<number | null, { id: string; fullName: string; role: string }[]>();
  for (const a of athleteAssignments) {
    const links = coachLinks.filter((l) => l.athleteId === a.personId);
    if (links.length > 0) {
      const existing = coachesByRelay.get(a.relay) ?? [];
      for (const l of links) {
        if (!existing.some((c) => c.id === l.coach.id)) existing.push(l.coach);
      }
      coachesByRelay.set(a.relay, existing);
    }
  }

  // Group by relay
  const relays = new Map<number | null, typeof athleteAssignments>();
  for (const a of athleteAssignments) {
    const key = a.relay;
    if (!relays.has(key)) relays.set(key, []);
    relays.get(key)!.push(a);
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <Link href={`/events/${eventId}`} className="hover:underline">{event.name}</Link>
        <span>/</span>
        <Link href={`/events/${eventId}/flights`} className="hover:underline">Flights</Link>
        <span>/</span>
        <span>{flight.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{flight.name}</h1>
      {flight.startTime && (
        <p className="text-gray-500 mb-4">{flight.startTime.toLocaleString()}</p>
      )}

      <div className="flex gap-2 mb-6 no-print">
        <a
          href={`/events/${eventId}/print/flight/${flightId}`}
          target="_blank"
          rel="noreferrer"
          className="bg-gray-800 text-white hover:bg-gray-900 px-4 py-2 rounded text-sm"
        >
          🖨 Print Flight Card
        </a>
      </div>

      {staffAssignments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Staff / Coaches</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">Role</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">Stage</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">Relay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffAssignments.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link href={`/events/${eventId}/staff/${s.personId}`} className="text-blue-600 hover:underline">
                        {s.person.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{s.role ?? "—"}</td>
                    <td className="px-4 py-2 text-gray-600">{s.stageRef ?? "—"}</td>
                    <td className="px-4 py-2 text-gray-600">{s.relay ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-700 mb-3">Athlete Roster</h2>
      {athleteAssignments.length === 0 ? (
        <p className="text-gray-500">No athletes assigned to this flight.</p>
      ) : (
        <div className="space-y-6">
          {Array.from(relays.entries()).map(([relay, relayAssignments]) => (
            <div key={relay ?? "no-relay"}>
              {relay !== null && (
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Relay {relay}{relayAssignments[0]?.relayCode ? ` – ${relayAssignments[0].relayCode}` : ""}
                  </h3>
                  {coachesByRelay.has(relay) && (
                    <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2 py-0.5">
                      Coaches: {coachesByRelay.get(relay)!.map((c) => c.fullName).join(", ")}
                    </span>
                  )}
                </div>
              )}
              <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">#</th>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Athlete</th>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Discipline</th>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Stage</th>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Squad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {relayAssignments.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{a.shootOrder ?? "—"}</td>
                        <td className="px-4 py-2">
                          <Link href={`/events/${eventId}/athletes/${a.personId}`} className="text-blue-600 hover:underline">
                            {a.person.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{a.discipline?.name ?? "—"}</td>
                        <td className="px-4 py-2 text-gray-600">{a.stage?.name ?? "—"}</td>
                        <td className="px-4 py-2 text-gray-600">{a.squad ? `#${a.squad.squadNum}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

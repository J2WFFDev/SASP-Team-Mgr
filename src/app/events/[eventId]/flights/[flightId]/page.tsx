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
        <p className="text-gray-500 mb-6">{flight.startTime.toLocaleString()}</p>
      )}

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
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Relay {relay}{relayAssignments[0]?.relayCode ? ` – ${relayAssignments[0].relayCode}` : ""}
                </h3>
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

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SchedulePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const assignments = await prisma.athleteAssignment.findMany({
    where: { eventId: eventId },
    include: {
      flight: true,
      stage: true,
      person: true,
      discipline: true,
      squad: true,
    },
    orderBy: [
      { flight: { flightOrder: "asc" } },
      { flight: { startTime: "asc" } },
      { relay: "asc" },
      { shootOrder: "asc" },
      { person: { fullName: "asc" } },
    ],
  });

  // Group by flight
  const byFlight = new Map<string, typeof assignments>();
  for (const a of assignments) {
    const key = a.flight.name;
    if (!byFlight.has(key)) byFlight.set(key, []);
    byFlight.get(key)!.push(a);
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <Link href={`/events/${eventId}`} className="hover:underline">{event.name}</Link>
        <span>/</span>
        <span>Schedule</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Master Schedule</h1>
        <div className="flex gap-2">
          <a
            href={`/api/events/${eventId}/export?type=schedule&format=csv`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm"
          >
            Export CSV
          </a>
          <a
            href={`/api/events/${eventId}/export?type=schedule&format=tsv`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm"
          >
            Export TSV
          </a>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No assignments yet. <Link href={`/events/${eventId}/import`} className="text-blue-600 hover:underline">Import TSV data</Link> to get started.
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(byFlight.entries()).map(([flightName, flightAssignments]) => (
            <div key={flightName}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg font-semibold text-gray-800">{flightName}</h2>
                {flightAssignments[0]?.flight.startTime && (
                  <span className="text-sm text-gray-500">
                    {flightAssignments[0].flight.startTime.toLocaleString()}
                  </span>
                )}
                <Link href={`/events/${eventId}/flights/${flightAssignments[0]?.flightId}`} className="text-xs text-blue-600 hover:underline">
                  Detail →
                </Link>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Athlete</th>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Discipline</th>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Stage</th>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Squad</th>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Relay</th>
                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {flightAssignments.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <Link href={`/events/${eventId}/athletes/${a.personId}`} className="text-blue-600 hover:underline">
                            {a.person.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-gray-700">{a.discipline?.name ?? "—"}</td>
                        <td className="px-4 py-2 text-gray-700">{a.stage?.name ?? "—"}</td>
                        <td className="px-4 py-2 text-gray-700">{a.squad ? `#${a.squad.squadNum}${a.squad.squadName ? ` ${a.squad.squadName}` : ""}` : "—"}</td>
                        <td className="px-4 py-2 text-gray-700">{a.relay ?? "—"}{a.relayCode ? ` (${a.relayCode})` : ""}</td>
                        <td className="px-4 py-2 text-gray-700">{a.shootOrder ?? "—"}</td>
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

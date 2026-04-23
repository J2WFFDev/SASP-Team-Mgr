import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PrintSchedulePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const assignments = await prisma.athleteAssignment.findMany({
    where: { eventId },
    include: { flight: true, stage: true, person: true, discipline: true, squad: true },
    orderBy: [
      { flight: { flightOrder: "asc" } },
      { flight: { startTime: "asc" } },
      { relay: "asc" },
      { shootOrder: "asc" },
      { person: { fullName: "asc" } },
    ],
  });

  const byFlight = new Map<string, typeof assignments>();
  for (const a of assignments) {
    const key = a.flight.id;
    if (!byFlight.has(key)) byFlight.set(key, []);
    byFlight.get(key)!.push(a);
  }

  const printedAt = new Date().toLocaleString();

  return (
    <div className="pt-12 px-4 pb-6 bg-white print:pt-0">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-2 mb-4">
        <h1 className="text-xl font-bold text-gray-900">{event.name} — Master Schedule</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {event.startDate ? new Date(event.startDate).toLocaleDateString() : ""}
          {" · "}Printed {printedAt}
        </p>
      </div>

      {assignments.length === 0 ? (
        <p className="text-gray-500 text-sm">No assignments yet.</p>
      ) : (
        <div className="space-y-6">
          {Array.from(byFlight.values()).map((flightAssignments) => {
            const flight = flightAssignments[0].flight;
            return (
              <div key={flight.id} className="break-inside-avoid">
                <div className="flex items-baseline gap-3 mb-1">
                  <h2 className="text-base font-bold text-gray-900">{flight.name}</h2>
                  {flight.startTime && (
                    <span className="text-xs text-gray-500">{new Date(flight.startTime).toLocaleString()}</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{flightAssignments.length} athletes</span>
                </div>
                <table className="w-full text-xs border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700">Athlete</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700">Division</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700">Discipline</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700">Stage</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700">Squad</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700">Relay</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700">#</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flightAssignments.map((a, i) => (
                      <tr key={a.id} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                        <td className="border border-gray-300 px-2 py-0.5 font-medium">{a.person.fullName}</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-600">{a.person.division ?? "—"}</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-600">{a.discipline?.name ?? "—"}</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-600">{a.stage?.name ?? "—"}</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-600">
                          {a.squad ? `#${a.squad.squadNum}${a.squad.squadName ? ` ${a.squad.squadName}` : ""}` : "—"}
                        </td>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-600">
                          {a.relay ?? "—"}{a.relayCode ? ` (${a.relayCode})` : ""}
                        </td>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-600">{a.shootOrder ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6 border-t pt-2">
        {event.name} · SASP Team Manager · {printedAt}
      </p>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PrintFlightPage({
  params,
}: {
  params: Promise<{ eventId: string; flightId: string }>;
}) {
  const { eventId, flightId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (!flight) notFound();

  const [athleteAssignments, staffAssignments] = await Promise.all([
    prisma.athleteAssignment.findMany({
      where: { flightId, eventId },
      include: {
        person: true,
        stage: true,
        discipline: true,
        squad: true,
        // also get coach links for relay hints
      },
      orderBy: [{ relay: "asc" }, { shootOrder: "asc" }, { person: { fullName: "asc" } }],
    }),
    prisma.staffAssignment.findMany({
      where: { flightId, eventId },
      include: { person: true },
      orderBy: [{ relay: "asc" }, { role: "asc" }],
    }),
  ]);

  // Group athletes by relay
  const relays = new Map<number | null, typeof athleteAssignments>();
  for (const a of athleteAssignments) {
    const key = a.relay;
    if (!relays.has(key)) relays.set(key, []);
    relays.get(key)!.push(a);
  }

  // Get coach-athlete links for athletes in this flight
  const athleteIds = athleteAssignments.map((a) => a.personId);
  const coachLinks = await prisma.personLink.findMany({
    where: { athleteId: { in: athleteIds } },
    include: { coach: { select: { id: true, fullName: true } } },
  });

  // Build a map: relay → Set of coach names
  const coachesByRelay = new Map<number | null, string[]>();
  for (const a of athleteAssignments) {
    const coaches = coachLinks
      .filter((l) => l.athleteId === a.personId)
      .map((l) => l.coach.fullName);
    if (coaches.length > 0) {
      const existing = coachesByRelay.get(a.relay) ?? [];
      for (const c of coaches) {
        if (!existing.includes(c)) existing.push(c);
      }
      coachesByRelay.set(a.relay, existing);
    }
  }

  const printedAt = new Date().toLocaleString();

  return (
    <div className="pt-12 px-4 pb-6 bg-white print:pt-0">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-2 mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {event.name} — {flight.name}
        </h1>
        {flight.startTime && (
          <p className="text-sm text-gray-600">{new Date(flight.startTime).toLocaleString()}</p>
        )}
        <p className="text-xs text-gray-500 mt-0.5">Printed {printedAt}</p>
      </div>

      {/* Staff */}
      {staffAssignments.length > 0 && (
        <div className="mb-5 break-inside-avoid">
          <h2 className="text-sm font-bold text-gray-800 mb-1 uppercase tracking-wide">Staff / Coaches</h2>
          <table className="w-full text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Name</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Role</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Stage</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Relay</th>
              </tr>
            </thead>
            <tbody>
              {staffAssignments.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-2 py-0.5 font-medium">{s.person.fullName}</td>
                  <td className="border border-gray-300 px-2 py-0.5 text-gray-600">{s.role ?? "—"}</td>
                  <td className="border border-gray-300 px-2 py-0.5 text-gray-600">{s.stageRef ?? "—"}</td>
                  <td className="border border-gray-300 px-2 py-0.5 text-gray-600">{s.relay ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Relays */}
      {athleteAssignments.length === 0 ? (
        <p className="text-gray-500 text-sm">No athletes assigned.</p>
      ) : (
        <div className="space-y-5">
          {Array.from(relays.entries()).map(([relay, relayAthletes]) => {
            const relayCoaches = coachesByRelay.get(relay) ?? [];
            return (
              <div key={relay ?? "no-relay"} className="break-inside-avoid">
                {relay !== null && (
                  <div className="flex items-baseline gap-3 mb-1">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      Relay {relay}
                      {relayAthletes[0]?.relayCode ? ` — ${relayAthletes[0].relayCode}` : ""}
                    </h2>
                    <span className="text-xs text-gray-400">{relayAthletes.length} athletes</span>
                    {relayCoaches.length > 0 && (
                      <span className="text-xs text-blue-700 ml-2">
                        Coaches: {relayCoaches.join(", ")}
                      </span>
                    )}
                  </div>
                )}
                <table className="w-full text-xs border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold">#</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Athlete</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Division</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Discipline</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Stage</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Squad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relayAthletes.map((a, i) => (
                      <tr key={a.id} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-500">{a.shootOrder ?? "—"}</td>
                        <td className="border border-gray-300 px-2 py-0.5 font-medium">{a.person.fullName}</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-600">{a.person.division ?? "—"}</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-600">{a.discipline?.name ?? "—"}</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-600">{a.stage?.name ?? "—"}</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-gray-600">
                          {a.squad ? `#${a.squad.squadNum}` : "—"}
                        </td>
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
        {event.name} · {flight.name} · SASP Team Manager · {printedAt}
      </p>
    </div>
  );
}

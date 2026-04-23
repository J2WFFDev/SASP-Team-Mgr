import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AthleteSchedulePage({
  params,
}: {
  params: Promise<{ eventId: string; personId: string }>;
}) {
  const { eventId, personId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) notFound();

  const assignments = await prisma.athleteAssignment.findMany({
    where: { eventId, personId },
    include: { flight: true, stage: true, discipline: true, squad: true },
    orderBy: [
      { flight: { flightOrder: "asc" } },
      { flight: { startTime: "asc" } },
      { relay: "asc" },
      { shootOrder: "asc" },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <Link href={`/events/${eventId}`} className="hover:underline">{event.name}</Link>
        <span>/</span>
        <Link href={`/events/${eventId}/athletes`} className="hover:underline">Athletes</Link>
        <span>/</span>
        <span>{person.fullName}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{person.fullName}</h1>
          {person.division && <p className="text-sm text-gray-500 mt-1">Division: {person.division}</p>}
        </div>
        <a
          href={`/api/events/${eventId}/export?type=athlete&personId=${personId}&format=csv`}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm"
        >
          Export CSV
        </a>
      </div>

      {assignments.length === 0 ? (
        <p className="text-gray-500">No assignments found for this athlete.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Flight</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Time</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Stage</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Discipline</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Squad</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Relay</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{a.flight.name}</td>
                  <td className="px-4 py-2 text-gray-500">{a.flight.startTime?.toLocaleString() ?? "—"}</td>
                  <td className="px-4 py-2">{a.stage?.name ?? "—"}</td>
                  <td className="px-4 py-2">{a.discipline?.name ?? "—"}</td>
                  <td className="px-4 py-2">{a.squad ? `#${a.squad.squadNum}` : "—"}</td>
                  <td className="px-4 py-2">{a.relay ?? "—"}{a.relayCode ? ` (${a.relayCode})` : ""}</td>
                  <td className="px-4 py-2">{a.shootOrder ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

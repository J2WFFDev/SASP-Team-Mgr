import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PrintAthletePage({
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

  // Get linked coaches for this athlete
  const coachLinks = await prisma.personLink.findMany({
    where: { athleteId: personId },
    include: { coach: { select: { id: true, fullName: true, email: true } } },
  });

  const printedAt = new Date().toLocaleString();

  return (
    <div className="pt-12 px-4 pb-6 bg-white print:pt-0 max-w-2xl">
      {/* Header card */}
      <div className="border-2 border-gray-800 rounded p-4 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{person.fullName}</h1>
            {person.division && (
              <p className="text-sm text-gray-600 mt-0.5">Division: {person.division}</p>
            )}
            {person.team && (
              <p className="text-sm text-gray-600">Team: {person.team}</p>
            )}
            {coachLinks.length > 0 && (
              <p className="text-sm text-gray-600">
                Coach: {coachLinks.map((l) => l.coach.fullName).join(", ")}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-semibold text-base text-gray-900">{event.name}</p>
            {event.startDate && (
              <p>{new Date(event.startDate).toLocaleDateString()}</p>
            )}
            <p className="mt-1">Printed {printedAt}</p>
          </div>
        </div>
      </div>

      {/* Schedule */}
      {assignments.length === 0 ? (
        <p className="text-gray-500 text-sm">No assignments for this event.</p>
      ) : (
        <table className="w-full text-sm border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Flight</th>
              <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Time</th>
              <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Discipline</th>
              <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Stage</th>
              <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Squad</th>
              <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Relay</th>
              <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">#</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a, i) => (
              <tr key={a.id} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <td className="border border-gray-300 px-3 py-1 font-medium">{a.flight.name}</td>
                <td className="border border-gray-300 px-3 py-1 text-gray-600">
                  {a.flight.startTime ? new Date(a.flight.startTime).toLocaleString() : "—"}
                </td>
                <td className="border border-gray-300 px-3 py-1 text-gray-600">{a.discipline?.name ?? "—"}</td>
                <td className="border border-gray-300 px-3 py-1 text-gray-600">{a.stage?.name ?? "—"}</td>
                <td className="border border-gray-300 px-3 py-1 text-gray-600">
                  {a.squad ? `#${a.squad.squadNum}${a.squad.squadName ? ` ${a.squad.squadName}` : ""}` : "—"}
                </td>
                <td className="border border-gray-300 px-3 py-1 text-gray-600">
                  {a.relay ?? "—"}{a.relayCode ? ` (${a.relayCode})` : ""}
                </td>
                <td className="border border-gray-300 px-3 py-1 text-gray-600">{a.shootOrder ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Notes / signature area */}
      <div className="mt-6 border border-gray-300 rounded p-3">
        <p className="text-xs font-semibold text-gray-600 mb-4">Notes:</p>
        <div className="border-b border-gray-200 mb-2"></div>
        <div className="border-b border-gray-200 mb-2"></div>
        <div className="border-b border-gray-200"></div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        {event.name} · {person.fullName} · SASP Team Manager · {printedAt}
      </p>
    </div>
  );
}

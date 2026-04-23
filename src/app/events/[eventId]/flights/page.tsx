import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FlightsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const flights = await prisma.flight.findMany({
    where: { eventId: eventId },
    orderBy: [{ flightOrder: "asc" }, { startTime: "asc" }],
    include: {
      _count: { select: { athleteAssignments: true, staffAssignments: true } },
    },
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <Link href={`/events/${eventId}`} className="hover:underline">{event.name}</Link>
        <span>/</span>
        <span>Flights</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Flights</h1>

      {flights.length === 0 ? (
        <p className="text-gray-500">No flights yet.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Flight</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Start Time</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Athletes</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Staff</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flights.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{f.name}</td>
                  <td className="px-4 py-2 text-gray-500">{f.startTime?.toLocaleString() ?? "—"}</td>
                  <td className="px-4 py-2">{f._count.athleteAssignments}</td>
                  <td className="px-4 py-2">{f._count.staffAssignments}</td>
                  <td className="px-4 py-2">
                    <Link href={`/events/${eventId}/flights/${f.id}`} className="text-blue-600 hover:underline text-xs">
                      Detail →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

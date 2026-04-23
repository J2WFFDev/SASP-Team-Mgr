import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventOverviewPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: {
        select: {
          flights: true,
          squads: true,
          athleteAssignments: true,
          staffAssignments: true,
        },
      },
    },
  });

  if (!event) notFound();

  const personCount = await prisma.person.count({
    where: {
      OR: [
        { athleteAssignments: { some: { eventId } } },
        { staffAssignments: { some: { eventId } } },
      ],
    },
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <span>{event.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.name}</h1>
      {event.description && <p className="text-gray-600 mb-4">{event.description}</p>}
      {event.startDate && (
        <p className="text-sm text-gray-500 mb-6">
          {event.startDate.toLocaleDateString()} {event.endDate ? `– ${event.endDate.toLocaleDateString()}` : ""}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Flights", value: event._count.flights },
          { label: "Squads", value: event._count.squads },
          { label: "Persons", value: personCount },
          { label: "Assignments", value: event._count.athleteAssignments },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/events/${event.id}/import`} className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 text-sm font-medium">
          Import TSV Data
        </Link>
        <Link href={`/events/${event.id}/schedule`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium">
          Master Schedule
        </Link>
        <Link href={`/events/${event.id}/athletes`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium">
          Athletes
        </Link>
        <Link href={`/events/${event.id}/staff`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium">
          Staff
        </Link>
        <Link href={`/events/${event.id}/flights`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium">
          Flights
        </Link>
      </div>
    </div>
  );
}

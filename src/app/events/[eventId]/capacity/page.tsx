import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import CapacityClient from "./CapacityClient";

export const dynamic = "force-dynamic";

export default async function EventCapacityPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const [session, event] = await Promise.all([
    auth(),
    prisma.event.findUnique({
      where: { id: eventId },
      include: { baySets: { orderBy: { baySetOrder: "asc" } } },
    }),
  ]);
  if (!event) notFound();

  const canEdit =
    session?.user?.role === "LEAGUE_ADMIN" || session?.user?.role === "MATCH_DIRECTOR";

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <Link href={`/events/${eventId}`} className="hover:underline">{event.name}</Link>
        <span>/</span>
        <span>Capacity</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Capacity</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure venue bay sets and flights per day for {event.name}.
          </p>
        </div>
      </div>

      {/* SASP stage reference */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 mb-6">
        <strong>SASP Stage Groups:</strong> Each bay set uses Go-Fast (always) plus one stage from each group —
        Group 2: Focus / M · Group 3: V / In &amp; Out / Pop Quiz · Group 4: Exclamation / Speedtrap
      </div>

      <CapacityClient
        eventId={eventId}
        initialFlightsPerDay={event.flightsPerDay}
        initialBaySets={event.baySets}
        canEdit={canEdit}
      />
    </div>
  );
}

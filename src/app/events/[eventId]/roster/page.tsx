import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import RosterManager from "./RosterManager";

export const dynamic = "force-dynamic";

export default async function RosterPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  const [people, disciplines, commitments] = await Promise.all([
    prisma.person.findMany({ where: { status: "ACTIVE" }, orderBy: { fullName: "asc" } }),
    prisma.discipline.findMany({ orderBy: { name: "asc" } }),
    prisma.commitmentStatus.findMany({
      where: { eventId },
      include: {
        person: { select: { id: true, fullName: true, role: true, status: true, division: true, classLabel: true } },
        discipline: { select: { id: true, name: true, gunType: true } },
      },
      orderBy: [{ person: { fullName: "asc" } }, { discipline: { name: "asc" } }],
    }),
  ]);

  const committedCount = commitments.filter((c) => c.status === "COMMITTED").length;
  const tentativeCount = commitments.filter((c) => c.status === "TENTATIVE").length;

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <Link href={`/events/${eventId}`} className="hover:underline">{event.name}</Link>
        <span>/</span>
        <span>Roster</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Event Roster</h1>
        <div className="flex gap-3 text-sm">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
            ✅ {committedCount} committed
          </span>
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
            🟡 {tentativeCount} tentative
          </span>
          <span className="text-gray-500">
            {commitments.length} total entries
          </span>
        </div>
      </div>

      <RosterManager
        eventId={eventId}
        people={people}
        disciplines={disciplines}
        initialCommitments={commitments}
      />
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EditEventForm from "./EditEventForm";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "LEAGUE_ADMIN" && role !== "MATCH_DIRECTOR") {
    const { eventId } = await params;
    redirect(`/events/${eventId}`);
  }

  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <Link href={`/events/${eventId}`} className="hover:underline">{event.name}</Link>
        <span>/</span>
        <span>Edit</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h1>

      <EditEventForm
        event={{
          id: event.id,
          name: event.name,
          description: event.description ?? null,
          startDate: event.startDate ? event.startDate.toISOString() : null,
          endDate: event.endDate ? event.endDate.toISOString() : null,
        }}
      />
    </div>
  );
}

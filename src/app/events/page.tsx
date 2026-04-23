import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateEventForm from "./CreateEventForm";

export const dynamic = "force-dynamic";

const FORECAST_COLORS: Record<string, string> = {
  DRAFT:       "bg-gray-200 text-gray-600",
  PRELIM:      "bg-blue-100 text-blue-700",
  ARBITRATION: "bg-yellow-100 text-yellow-800",
  APPROVED:    "bg-green-100 text-green-800",
  PRODUCTION:  "bg-purple-100 text-purple-800",
};

export default async function EventsPage() {
  const events = await prisma.event.findMany({ orderBy: { startDate: "asc" } });

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
      </div>

      <CreateEventForm />

      <div className="mt-8 space-y-3">
        {events.length === 0 && (
          <p className="text-gray-500 text-sm">No events yet. Create one above.</p>
        )}
        {events.map((event) => (
          <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link href={`/events/${event.id}`} className="text-blue-700 font-semibold hover:underline text-lg">
                  {event.name}
                </Link>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FORECAST_COLORS[event.forecastStatus] ?? "bg-gray-100"}`}>
                  {event.forecastStatus}
                </span>
              </div>
              {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
              {event.startDate && (
                <p className="text-xs text-gray-400 mt-1">
                  {event.startDate.toLocaleDateString()} {event.endDate ? `– ${event.endDate.toLocaleDateString()}` : ""}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/events/${event.id}/forecast`} className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded font-medium">
                Forecast
              </Link>
              <Link href={`/events/${event.id}/schedule`} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                Schedule
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

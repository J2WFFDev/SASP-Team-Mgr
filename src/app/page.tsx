import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">SASP Team Manager</h1>
      <p className="text-lg text-gray-600 mb-8">
        Scheduling and squadding for the 2026 WilcoSS Texas State Championship and future SASP matches.
      </p>
      <div className="flex gap-4">
        <Link
          href="/events"
          className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 font-medium"
        >
          View Events
        </Link>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-2">📅 Master Schedule</h2>
          <p className="text-sm text-gray-500">View all flights, stages, and athlete assignments.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-2">🏃 Athlete Schedule</h2>
          <p className="text-sm text-gray-500">Per-athlete schedule showing all assignments.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-2">🧑‍🏫 Staff Schedule</h2>
          <p className="text-sm text-gray-500">Coach and RO assignments per flight/relay.</p>
        </div>
      </div>
    </div>
  );
}

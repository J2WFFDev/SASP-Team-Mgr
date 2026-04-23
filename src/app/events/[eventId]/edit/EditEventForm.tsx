"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
}

export default function EditEventForm({ event }: { event: Event }) {
  const router = useRouter();
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description ?? "");
  const [startDate, setStartDate] = useState(
    event.startDate ? event.startDate.slice(0, 10) : ""
  );
  const [endDate, setEndDate] = useState(
    event.endDate ? event.endDate.slice(0, 10) : ""
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (startDate && endDate && endDate < startDate) {
      setError("End date cannot be before start date.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, startDate, endDate }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update event");
      }
      router.push(`/events/${event.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${event.name}"? This will remove all flights, squads, assignments, and related data.`)) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete event");
      }
      router.push("/events");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5">
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-100 text-red-700 px-5 py-2 rounded hover:bg-red-200 text-sm disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete Event"}
        </button>
      </div>
    </form>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateFlightForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/flights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), startTime: startTime || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create flight");
      }
      setName("");
      setStartTime("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Create Flight</h2>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Flight Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Flight"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Time (optional)</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="bg-blue-700 text-white px-4 py-1.5 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create Flight"}
        </button>
      </div>
    </form>
  );
}

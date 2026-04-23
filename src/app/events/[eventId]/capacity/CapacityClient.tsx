"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Fixed SASP stage options per group
const STAGE_GROUP_2 = ["Focus", "M"] as const;
const STAGE_GROUP_3 = ["V", "In & Out", "Pop Quiz"] as const;
const STAGE_GROUP_4 = ["Exclamation", "Speedtrap"] as const;

interface BaySet {
  id: string;
  label: string | null;
  slotsPerBay: number;
  stage1: string;
  stage2: string | null;
  stage3: string | null;
  stage4: string | null;
  baySetOrder: number;
}

interface Props {
  eventId: string;
  initialFlightsPerDay: number;
  initialBaySets: BaySet[];
  canEdit: boolean;
}

export default function CapacityClient({
  eventId,
  initialFlightsPerDay,
  initialBaySets,
  canEdit,
}: Props) {
  const router = useRouter();
  const [flightsPerDay, setFlightsPerDay] = useState(initialFlightsPerDay);
  const [savingFlights, setSavingFlights] = useState(false);
  const [baySets, setBaySets] = useState<BaySet[]>(initialBaySets);

  // New bay set form state
  const [newLabel, setNewLabel] = useState("");
  const [newSlots, setNewSlots] = useState(16);
  const [newStage2, setNewStage2] = useState<string>(STAGE_GROUP_2[0]);
  const [newStage3, setNewStage3] = useState<string>(STAGE_GROUP_3[0]);
  const [newStage4, setNewStage4] = useState<string>(STAGE_GROUP_4[0]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Derived capacity
  const athletesPerRelay = baySets.reduce((sum, bs) => sum + bs.slotsPerBay, 0);
  const totalPerDay = athletesPerRelay * flightsPerDay;

  async function handleSaveFlightsPerDay() {
    setSavingFlights(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightsPerDay }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingFlights(false);
    }
  }

  async function handleAddBaySet(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/bay-sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel || null,
          slotsPerBay: newSlots,
          stage1: "Go-Fast",
          stage2: newStage2,
          stage3: newStage3,
          stage4: newStage4,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add bay set");
      }
      const baySet: BaySet = await res.json();
      setBaySets((prev) => [...prev, baySet]);
      setNewLabel("");
      setNewSlots(16);
      setNewStage2(STAGE_GROUP_2[0]);
      setNewStage3(STAGE_GROUP_3[0]);
      setNewStage4(STAGE_GROUP_4[0]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(baySetId: string) {
    setDeletingId(baySetId);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/bay-sets/${baySetId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete");
      }
      setBaySets((prev) => prev.filter((bs) => bs.id !== baySetId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Capacity summary banner */}
      {baySets.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-blue-500 text-xs uppercase tracking-wide font-medium">Bay Sets</span>
            <div className="text-2xl font-bold text-blue-800">{baySets.length}</div>
          </div>
          <div>
            <span className="text-blue-500 text-xs uppercase tracking-wide font-medium">Athletes / Relay</span>
            <div className="text-2xl font-bold text-blue-800">{athletesPerRelay}</div>
          </div>
          <div>
            <span className="text-blue-500 text-xs uppercase tracking-wide font-medium">Flights / Day</span>
            <div className="text-2xl font-bold text-blue-800">{flightsPerDay}</div>
          </div>
          <div>
            <span className="text-blue-500 text-xs uppercase tracking-wide font-medium">Max Athletes / Day</span>
            <div className="text-2xl font-bold text-blue-800">{totalPerDay}</div>
          </div>
          <div className="text-xs text-blue-600 self-end pb-1">
            ({baySets.length} bay sets × {baySets.length > 0 ? (athletesPerRelay / baySets.length).toFixed(0) : 0} avg slots/bay × {flightsPerDay} flights)
          </div>
        </div>
      )}

      {/* Flights per day */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Match Schedule</h2>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flights per day <span className="text-gray-400 font-normal text-xs">(1–10)</span>
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={flightsPerDay}
              onChange={(e) => setFlightsPerDay(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
              disabled={!canEdit}
              className="w-24 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          {canEdit && (
            <button
              onClick={handleSaveFlightsPerDay}
              disabled={savingFlights}
              className="bg-blue-700 text-white px-4 py-2 rounded text-sm hover:bg-blue-800 disabled:opacity-50"
            >
              {savingFlights ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>

      {/* Existing bay sets */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-800">Bay Sets</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Each bay set = a named group of 4 stages at the venue. All 4 bays share the same slot count.
          </p>
        </div>
        {baySets.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            No bay sets configured yet. Add one below.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Label</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Slots / Bay</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Stage 1</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Stage 2</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Stage 3</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Stage 4</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Relay Capacity</th>
                {canEdit && <th className="px-4 py-2"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {baySets.map((bs) => (
                <tr key={bs.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{bs.label || <span className="text-gray-400 italic">—</span>}</td>
                  <td className="px-4 py-2 text-gray-700">{bs.slotsPerBay}</td>
                  <td className="px-4 py-2 text-gray-700">{bs.stage1}</td>
                  <td className="px-4 py-2 text-gray-700">{bs.stage2 || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-2 text-gray-700">{bs.stage3 || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-2 text-gray-700">{bs.stage4 || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-2 font-semibold text-blue-700">{bs.slotsPerBay} athletes</td>
                  {canEdit && (
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDelete(bs.id)}
                        disabled={deletingId === bs.id}
                        className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add bay set form */}
      {canEdit && (
        <form onSubmit={handleAddBaySet} className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Add Bay Set</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label <span className="text-gray-400 font-normal text-xs">(e.g. "Red Range", "Avenue A")</span>
              </label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Bay Set 1"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slots per Bay <span className="text-gray-400 font-normal text-xs">(1–50)</span>
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={newSlots}
                onChange={(e) => setNewSlots(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Stage 1 is always Go-Fast */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stage 1 <span className="text-gray-400 font-normal text-xs">(always Go-Fast)</span>
              </label>
              <input
                value="Go-Fast"
                disabled
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage 2</label>
              <select
                value={newStage2}
                onChange={(e) => setNewStage2(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STAGE_GROUP_2.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage 3</label>
              <select
                value={newStage3}
                onChange={(e) => setNewStage3(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STAGE_GROUP_3.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage 4</label>
              <select
                value={newStage4}
                onChange={(e) => setNewStage4(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STAGE_GROUP_4.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={adding}
              className="bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add Bay Set"}
            </button>
            {newSlots > 0 && (
              <span className="text-xs text-gray-500">
                This bay set will hold <strong>{newSlots} athletes</strong> per relay.
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

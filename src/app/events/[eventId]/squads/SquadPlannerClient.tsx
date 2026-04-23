"use client";
import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Discipline {
  id: string;
  name: string;
}

interface Person {
  id: string;
  fullName: string;
  division: string | null;
}

/** A committed/tentative person + their enrolled disciplines for the event */
interface PoolEntry {
  personId: string;
  fullName: string;
  division: string | null;
  disciplines: { disciplineId: string; disciplineName: string }[];
}

interface Assignment {
  id: string;
  personId: string;
  person: { id: string; fullName: string; division: string | null };
  disciplineId: string | null;
  discipline: { id: string; name: string } | null;
  flightId: string;
  squadId: string | null;
  relay: number | null;
  shootOrder: number | null;
}

interface Squad {
  id: string;
  squadNum: number;
  squadName: string | null;
  division: string | null;
  assignments: Assignment[];
}

interface Flight {
  id: string;
  name: string;
  startTime: string | null;
  flightOrder: number;
  squads: Squad[];
}

interface Props {
  eventId: string;
  initialFlights: Flight[];
  initialAssignments: Assignment[];
  pool: PoolEntry[];
  disciplines: Discipline[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLocalDatetimeInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SquadPlannerClient({
  eventId,
  initialFlights,
  initialAssignments,
  pool,
  disciplines,
}: Props) {
  // Augment initialFlights with their assignments
  const buildFlights = (flights: Omit<Flight, "squads">[], assignments: Assignment[]): Flight[] => {
    return flights.map((f) => {
      // squads come from the flight's assignments – group by squadId
      const squadMap = new Map<string | null, Assignment[]>();
      for (const a of assignments.filter((x) => x.flightId === f.id)) {
        const key = a.squadId ?? "__none__";
        if (!squadMap.has(key)) squadMap.set(key, []);
        squadMap.get(key)!.push(a);
      }
      return { ...f, squads: [] }; // squads managed separately
    });
  };

  const [flights, setFlights] = useState<Omit<Flight, "squads">[]>(
    initialFlights.map(({ squads: _s, ...rest }) => rest)
  );
  const [squads, setSquads] = useState<(Squad & { flightId: string })[]>(() => {
    // squads from initialFlights already include their assignment data
    return initialFlights.flatMap((f) =>
      f.squads.map((s) => ({ ...s, flightId: f.id }))
    );
  });
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);

  // ── Flight management ──────────────────────────────────────────────────────

  const [newFlightName, setNewFlightName] = useState("");
  const [newFlightTime, setNewFlightTime] = useState("");
  const [addingFlight, setAddingFlight] = useState(false);
  const [flightError, setFlightError] = useState("");

  async function handleAddFlight(e: React.FormEvent) {
    e.preventDefault();
    if (!newFlightName.trim()) return;
    setAddingFlight(true);
    setFlightError("");
    try {
      const res = await fetch(`/api/events/${eventId}/flights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFlightName.trim(),
          startTime: newFlightTime || null,
          flightOrder: flights.length + 1,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create flight");
      }
      const flight = await res.json();
      setFlights((prev) => [...prev, flight]);
      setNewFlightName("");
      setNewFlightTime("");
    } catch (err: unknown) {
      setFlightError(err instanceof Error ? err.message : "Error");
    } finally {
      setAddingFlight(false);
    }
  }

  async function handleDeleteFlight(flightId: string) {
    const flightAssignments = assignments.filter((a) => a.flightId === flightId);
    if (
      flightAssignments.length > 0 &&
      !confirm(
        `This flight has ${flightAssignments.length} athlete assignment(s). Deleting it will remove all assignments. Continue?`
      )
    )
      return;
    const res = await fetch(`/api/events/${eventId}/flights/${flightId}`, { method: "DELETE" });
    if (res.ok) {
      setFlights((prev) => prev.filter((f) => f.id !== flightId));
      setSquads((prev) => prev.filter((s) => s.flightId !== flightId));
      setAssignments((prev) => prev.filter((a) => a.flightId !== flightId));
    }
  }

  // ── Squad management ───────────────────────────────────────────────────────

  const [addSquadFlightId, setAddSquadFlightId] = useState<string | null>(null);
  const [newSquadNum, setNewSquadNum] = useState("");
  const [newSquadName, setNewSquadName] = useState("");
  const [addingSquad, setAddingSquad] = useState(false);

  function nextSquadNum() {
    const nums = squads.map((s) => s.squadNum);
    return nums.length === 0 ? 1 : Math.max(...nums) + 1;
  }

  async function handleAddSquad(flightId: string) {
    const num = newSquadNum ? Number(newSquadNum) : nextSquadNum();
    setAddingSquad(true);
    try {
      const res = await fetch(`/api/events/${eventId}/squads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          squadNum: num,
          squadName: newSquadName || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Failed to create squad");
        return;
      }
      const squad = await res.json();
      setSquads((prev) => [...prev, { ...squad, flightId, assignments: [] }]);
      setNewSquadNum("");
      setNewSquadName("");
      setAddSquadFlightId(null);
    } finally {
      setAddingSquad(false);
    }
  }

  async function handleDeleteSquad(squadId: string) {
    if (!confirm("Delete this squad? Athletes will be un-squadded but remain assigned to the flight.")) return;
    const res = await fetch(`/api/events/${eventId}/squads/${squadId}`, { method: "DELETE" });
    if (res.ok) {
      setSquads((prev) => prev.filter((s) => s.id !== squadId));
      // Null out squadId on assignments
      setAssignments((prev) =>
        prev.map((a) => (a.squadId === squadId ? { ...a, squadId: null, squad: null } : a))
      );
    }
  }

  // ── Assignment management ──────────────────────────────────────────────────

  // addingTo: { flightId, squadId | null }
  const [addingTo, setAddingTo] = useState<{ flightId: string; squadId: string | null } | null>(null);
  const [newPersonId, setNewPersonId] = useState("");
  const [newDisciplineId, setNewDisciplineId] = useState("");
  const [newRelay, setNewRelay] = useState("");
  const [newOrder, setNewOrder] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Athletes in pool not yet assigned to the target flight
  const availableForFlight = useMemo(() => {
    if (!addingTo) return [];
    const assigned = new Set(
      assignments.filter((a) => a.flightId === addingTo.flightId).map((a) => a.personId)
    );
    return pool.filter((p) => !assigned.has(p.personId));
  }, [addingTo, assignments, pool]);

  // Disciplines for the selected person in this event
  const personDisciplines = useMemo(() => {
    if (!newPersonId) return disciplines;
    const entry = pool.find((p) => p.personId === newPersonId);
    if (!entry || entry.disciplines.length === 0) return disciplines;
    return disciplines.filter((d) => entry.disciplines.some((ed) => ed.disciplineId === d.id));
  }, [newPersonId, pool, disciplines]);

  async function handleAddAssignment() {
    if (!addingTo || !newPersonId) return;
    setSavingAssignment(true);
    try {
      const res = await fetch(`/api/events/${eventId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: newPersonId,
          flightId: addingTo.flightId,
          disciplineId: newDisciplineId || null,
          squadId: addingTo.squadId || null,
          relay: newRelay ? Number(newRelay) : null,
          shootOrder: newOrder ? Number(newOrder) : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Failed to add");
        return;
      }
      const a: Assignment = await res.json();
      setAssignments((prev) => [...prev, a]);
      setNewPersonId("");
      setNewDisciplineId("");
      setNewRelay("");
      setNewOrder("");
      setAddingTo(null);
    } finally {
      setSavingAssignment(false);
    }
  }

  async function handleRemoveAssignment(assignmentId: string) {
    const res = await fetch(`/api/events/${eventId}/assignments/${assignmentId}`, {
      method: "DELETE",
    });
    if (res.ok) setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  // Assignments that have no squadId (unassigned within flight)
  const unassignedInFlight = (flightId: string) =>
    assignments.filter((a) => a.flightId === flightId && !a.squadId);

  const assignmentsForSquad = (squadId: string) =>
    assignments.filter((a) => a.squadId === squadId);

  const squadsForFlight = (flightId: string) =>
    squads.filter((s) => s.flightId === flightId).sort((a, b) => a.squadNum - b.squadNum);

  // Pool stats
  const assignedPersonIds = new Set(assignments.map((a) => a.personId));
  const unassignedPool = pool.filter((p) => !assignedPersonIds.has(p.personId));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Add Flight Form */}
      <form
        onSubmit={handleAddFlight}
        className="bg-white border border-gray-200 rounded-lg p-5"
      >
        <h2 className="font-semibold text-gray-800 mb-4">Add Flight</h2>
        {flightError && <p className="text-red-600 text-sm mb-2">{flightError}</p>}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Flight Name *</label>
            <input
              value={newFlightName}
              onChange={(e) => setNewFlightName(e.target.value)}
              placeholder="e.g. Morning Flight"
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Time (optional)</label>
            <input
              type="datetime-local"
              value={newFlightTime}
              onChange={(e) => setNewFlightTime(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={addingFlight || !newFlightName.trim()}
            className="bg-blue-700 text-white px-4 py-1.5 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
          >
            {addingFlight ? "Adding…" : "Add Flight"}
          </button>
        </div>
      </form>

      {/* Unassigned pool banner */}
      {pool.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <span className="font-medium text-amber-800">
            {unassignedPool.length} of {pool.length} committed/tentative athletes not yet assigned to any flight.
          </span>
          {unassignedPool.length > 0 && (
            <span className="ml-2 text-amber-700">
              {unassignedPool.map((p) => p.fullName).join(", ")}
            </span>
          )}
        </div>
      )}

      {flights.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">
          No flights yet. Create one above to start planning squads.
        </p>
      )}

      {/* Flights */}
      {flights
        .slice()
        .sort((a, b) => a.flightOrder - b.flightOrder || a.name.localeCompare(b.name))
        .map((flight) => {
          const flightSquads = squadsForFlight(flight.id);
          const unassigned = unassignedInFlight(flight.id);

          return (
            <div key={flight.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Flight header */}
              <div className="bg-gray-700 text-white px-5 py-3 flex items-center gap-4">
                <div className="flex-1">
                  <h2 className="font-semibold text-lg">{flight.name}</h2>
                  {flight.startTime && (
                    <p className="text-gray-300 text-xs mt-0.5">
                      {new Date(flight.startTime).toLocaleString()}
                    </p>
                  )}
                </div>
                <span className="text-gray-300 text-sm">
                  {assignments.filter((a) => a.flightId === flight.id).length} athletes
                </span>
                <button
                  onClick={() => handleDeleteFlight(flight.id)}
                  className="text-red-300 hover:text-red-100 text-xs border border-red-400 rounded px-2 py-1"
                >
                  Delete Flight
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Squads */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {flightSquads.map((squad) => {
                    const squadAssignments = assignmentsForSquad(squad.id);
                    return (
                      <div key={squad.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Squad header */}
                        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-gray-800 text-sm">
                              Squad #{squad.squadNum}
                            </span>
                            {squad.squadName && (
                              <span className="ml-2 text-gray-500 text-xs">{squad.squadName}</span>
                            )}
                            {squad.division && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 rounded">
                                {squad.division}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteSquad(squad.id)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Athletes in squad */}
                        {squadAssignments.length === 0 ? (
                          <p className="text-gray-400 text-xs px-4 py-2">No athletes assigned yet.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Athlete</th>
                                <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Discipline</th>
                                <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Relay / #</th>
                                <th className="px-3 py-1.5"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {squadAssignments.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-1.5 font-medium text-gray-800">
                                    {a.person.fullName}
                                  </td>
                                  <td className="px-3 py-1.5 text-gray-600">
                                    {a.discipline?.name ?? "—"}
                                  </td>
                                  <td className="px-3 py-1.5 text-gray-500">
                                    {a.relay != null ? `R${a.relay}` : "—"}
                                    {a.shootOrder != null ? ` #${a.shootOrder}` : ""}
                                  </td>
                                  <td className="px-3 py-1.5 text-right">
                                    <button
                                      onClick={() => handleRemoveAssignment(a.id)}
                                      className="text-red-400 hover:text-red-600"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {/* Add athlete to squad */}
                        {addingTo?.flightId === flight.id && addingTo?.squadId === squad.id ? (
                          <div className="p-3 border-t border-gray-100 bg-blue-50 space-y-2">
                            <select
                              value={newPersonId}
                              onChange={(e) => { setNewPersonId(e.target.value); setNewDisciplineId(""); }}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                            >
                              <option value="">— select athlete —</option>
                              {availableForFlight.map((p) => (
                                <option key={p.personId} value={p.personId}>
                                  {p.fullName}{p.division ? ` (${p.division})` : ""}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <select
                                value={newDisciplineId}
                                onChange={(e) => setNewDisciplineId(e.target.value)}
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                              >
                                <option value="">— discipline —</option>
                                {personDisciplines.map((d) => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={newRelay}
                                onChange={(e) => setNewRelay(e.target.value)}
                                placeholder="Relay"
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
                              />
                              <input
                                type="number"
                                value={newOrder}
                                onChange={(e) => setNewOrder(e.target.value)}
                                placeholder="Order"
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleAddAssignment}
                                disabled={savingAssignment || !newPersonId}
                                className="flex-1 bg-blue-700 text-white text-xs py-1 rounded hover:bg-blue-800 disabled:opacity-50"
                              >
                                {savingAssignment ? "Saving…" : "Add"}
                              </button>
                              <button
                                onClick={() => { setAddingTo(null); setNewPersonId(""); setNewDisciplineId(""); setNewRelay(""); setNewOrder(""); }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                            {availableForFlight.length === 0 && (
                              <p className="text-xs text-amber-600">All committed athletes are already in this flight.</p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingTo({ flightId: flight.id, squadId: squad.id }); setNewPersonId(""); setNewDisciplineId(""); setNewRelay(""); setNewOrder(""); }}
                            className="w-full text-xs text-blue-600 hover:text-blue-800 py-1.5 border-t border-gray-100 hover:bg-blue-50"
                          >
                            + Add Athlete
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add squad card */}
                  {addSquadFlightId === flight.id ? (
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">New Squad</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={newSquadNum}
                          onChange={(e) => setNewSquadNum(e.target.value)}
                          placeholder={`#${nextSquadNum()}`}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <input
                          value={newSquadName}
                          onChange={(e) => setNewSquadName(e.target.value)}
                          placeholder="Squad name (optional)"
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddSquad(flight.id)}
                          disabled={addingSquad}
                          className="flex-1 bg-blue-700 text-white text-sm py-1.5 rounded hover:bg-blue-800 disabled:opacity-50"
                        >
                          {addingSquad ? "Adding…" : "Create Squad"}
                        </button>
                        <button
                          onClick={() => { setAddSquadFlightId(null); setNewSquadNum(""); setNewSquadName(""); }}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddSquadFlightId(flight.id); setNewSquadNum(""); setNewSquadName(""); }}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-400 hover:border-blue-400 hover:text-blue-600 text-sm flex items-center justify-center min-h-[80px]"
                    >
                      + Add Squad
                    </button>
                  )}
                </div>

                {/* Unassigned (no squad) athletes in this flight */}
                {unassigned.length > 0 && (
                  <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-yellow-700 mb-2">
                      {unassigned.length} athlete(s) in this flight with no squad assigned:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {unassigned.map((a) => (
                        <span key={a.id} className="flex items-center gap-1 bg-white border border-yellow-200 rounded-full px-2 py-0.5 text-xs">
                          {a.person.fullName}
                          {a.discipline && <span className="text-gray-400">({a.discipline.name})</span>}
                          <button
                            onClick={() => handleRemoveAssignment(a.id)}
                            className="text-red-400 hover:text-red-600 ml-1"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add athlete to flight (no squad) */}
                {addingTo?.flightId === flight.id && addingTo?.squadId === null ? (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Add athlete to flight (no squad)</p>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={newPersonId}
                        onChange={(e) => { setNewPersonId(e.target.value); setNewDisciplineId(""); }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-[160px]"
                      >
                        <option value="">— select athlete —</option>
                        {availableForFlight.map((p) => (
                          <option key={p.personId} value={p.personId}>
                            {p.fullName}{p.division ? ` (${p.division})` : ""}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newDisciplineId}
                        onChange={(e) => setNewDisciplineId(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="">— discipline —</option>
                        {personDisciplines.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <input type="number" value={newRelay} onChange={(e) => setNewRelay(e.target.value)} placeholder="Relay" className="w-20 border border-gray-300 rounded px-2 py-1 text-sm" />
                      <input type="number" value={newOrder} onChange={(e) => setNewOrder(e.target.value)} placeholder="Order" className="w-20 border border-gray-300 rounded px-2 py-1 text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddAssignment} disabled={savingAssignment || !newPersonId} className="bg-blue-700 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-800 disabled:opacity-50">
                        {savingAssignment ? "Saving…" : "Add"}
                      </button>
                      <button onClick={() => { setAddingTo(null); setNewPersonId(""); setNewDisciplineId(""); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingTo({ flightId: flight.id, squadId: null }); setNewPersonId(""); setNewDisciplineId(""); setNewRelay(""); setNewOrder(""); }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    + Add athlete to flight (unassigned to squad)
                  </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  COMMITTED: "✅ Committed",
  TENTATIVE: "🟡 Tentative",
  DECLINED: "❌ Declined",
  NO_RESPONSE: "⬜ No Response",
};

const STATUS_COLORS: Record<string, string> = {
  COMMITTED: "bg-green-100 text-green-800",
  TENTATIVE: "bg-yellow-100 text-yellow-800",
  DECLINED: "bg-red-100 text-red-700",
  NO_RESPONSE: "bg-gray-100 text-gray-500",
};

interface Person { id: string; fullName: string; role: string; division: string | null; classLabel: string | null; }
interface Discipline { id: string; name: string; gunType: string | null; }
interface Commitment {
  id: string;
  status: string;
  person: { id: string; fullName: string; role: string; division: string | null; classLabel: string | null };
  discipline: { id: string; name: string; gunType: string | null };
}

interface Props {
  eventId: string;
  people: Person[];
  disciplines: Discipline[];
  initialCommitments: Commitment[];
}

export default function RosterManager({ eventId, people, disciplines, initialCommitments }: Props) {
  const router = useRouter();
  const [commitments, setCommitments] = useState<Commitment[]>(initialCommitments);
  const [personId, setPersonId] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [status, setStatus] = useState("NO_RESPONSE");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Filter state
  const [filterName, setFilterName] = useState("");
  const [filterDisciplineId, setFilterDisciplineId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Bulk update state
  const [bulkDisciplineId, setBulkDisciplineId] = useState("");
  const [bulkStatus, setBulkStatus] = useState("COMMITTED");
  const [bulking, setBulking] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!personId || !disciplineId) { setAddError("Select a person and discipline."); return; }
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch(`/api/events/${eventId}/commitment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, disciplineId, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add");
      }
      const commitment: Commitment = await res.json();
      setCommitments((prev) => {
        const idx = prev.findIndex((c) => c.id === commitment.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = commitment;
          return next;
        }
        return [...prev, commitment].sort((a, b) =>
          a.person.fullName.localeCompare(b.person.fullName) || a.discipline.name.localeCompare(b.discipline.name)
        );
      });
      setPersonId(""); setDisciplineId(""); setStatus("NO_RESPONSE");
      router.refresh();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Error");
    } finally {
      setAdding(false);
    }
  }

  async function handleStatusChange(commitmentId: string, newStatus: string) {
    const res = await fetch(`/api/events/${eventId}/commitment/${commitmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setCommitments((prev) =>
        prev.map((c) => (c.id === commitmentId ? { ...c, status: newStatus } : c))
      );
    }
  }

  async function handleRemove(commitmentId: string) {
    if (!confirm("Remove this roster entry?")) return;
    const res = await fetch(`/api/events/${eventId}/commitment/${commitmentId}`, { method: "DELETE" });
    if (res.ok) {
      setCommitments((prev) => prev.filter((c) => c.id !== commitmentId));
      router.refresh();
    }
  }

  async function handleBulkUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkDisciplineId) return;
    const targets = commitments.filter((c) => c.discipline.id === bulkDisciplineId);
    if (targets.length === 0) return;
    const disciplineName = disciplines.find((d) => d.id === bulkDisciplineId)?.name ?? bulkDisciplineId;
    if (!confirm(`Set all ${targets.length} "${disciplineName}" entries to "${STATUS_LABELS[bulkStatus]}"?`)) return;
    setBulking(true);
    try {
      await Promise.all(
        targets.map((c) =>
          fetch(`/api/events/${eventId}/commitment/${c.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: bulkStatus }),
          })
        )
      );
      setCommitments((prev) =>
        prev.map((c) => (c.discipline.id === bulkDisciplineId ? { ...c, status: bulkStatus } : c))
      );
    } finally {
      setBulking(false);
    }
  }

  // Filtered view of commitments
  const filtered = useMemo(() => {
    const q = filterName.toLowerCase();
    return commitments.filter((c) => {
      if (q && !c.person.fullName.toLowerCase().includes(q)) return false;
      if (filterDisciplineId && c.discipline.id !== filterDisciplineId) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });
  }, [commitments, filterName, filterDisciplineId, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Add to roster form */}
      <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Add Person to Roster</h2>
        {addError && <p className="text-red-600 text-sm mb-3">{addError}</p>}
        {people.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            No people in the system yet.{" "}
            <a href="/people" className="underline">Add people first</a>.
          </p>
        ) : disciplines.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            No disciplines defined yet.{" "}
            <a href="/disciplines" className="underline">Add disciplines first</a>.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Person *</label>
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— select person —</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discipline *</label>
                <select
                  value={disciplineId}
                  onChange={(e) => setDisciplineId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— select discipline —</option>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}{d.gunType ? ` (${d.gunType})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="mt-4 bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add to Roster"}
            </button>
          </>
        )}
      </form>

      {/* Bulk status update */}
      {commitments.length > 0 && disciplines.length > 0 && (
        <form onSubmit={handleBulkUpdate} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bulk update — Discipline</label>
            <select
              value={bulkDisciplineId}
              onChange={(e) => setBulkDisciplineId(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— pick discipline —</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Set all to</label>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={bulking || !bulkDisciplineId}
            className="bg-gray-700 text-white px-4 py-1.5 rounded hover:bg-gray-800 text-sm disabled:opacity-50"
          >
            {bulking ? "Updating…" : "Apply to all"}
          </button>
        </form>
      )}

      {/* Roster table */}
      {commitments.length === 0 ? (
        <p className="text-gray-500 text-sm">No roster entries yet. Add one above.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-3 items-end p-4 border-b bg-gray-50">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Search person</label>
              <input
                type="search"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Name…"
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Discipline</label>
              <select
                value={filterDisciplineId}
                onChange={(e) => setFilterDisciplineId(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All disciplines</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            {(filterName || filterDisciplineId || filterStatus) && (
              <button
                onClick={() => { setFilterName(""); setFilterDisciplineId(""); setFilterStatus(""); }}
                className="text-xs text-gray-500 hover:text-gray-700 mt-4"
              >
                Clear filters
              </button>
            )}
            <span className="text-xs text-gray-400 mt-4 ml-auto">
              {filtered.length} of {commitments.length} shown
            </span>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Person</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Division / Class</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Discipline</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-gray-400 text-center text-sm">No entries match the current filters.</td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{c.person.fullName}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.person.role === "ATHLETE" ? "bg-blue-100 text-blue-700" :
                      c.person.role === "COACH"   ? "bg-green-100 text-green-700" :
                      c.person.role === "RO"      ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {c.person.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {[c.person.division, c.person.classLabel].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{c.discipline.name}</td>
                  <td className="px-4 py-2">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border-0 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 ${STATUS_COLORS[c.status] || "bg-gray-100"}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleRemove(c.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

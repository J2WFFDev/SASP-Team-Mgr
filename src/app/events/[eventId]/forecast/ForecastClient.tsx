"use client";
import { useState, useMemo } from "react";

const FORECAST_STATUS_FLOW = ["DRAFT", "PRELIM", "ARBITRATION", "APPROVED", "PRODUCTION"] as const;

const FORECAST_COLORS: Record<string, string> = {
  DRAFT:       "bg-gray-200 text-gray-700",
  PRELIM:      "bg-blue-100 text-blue-700",
  ARBITRATION: "bg-yellow-100 text-yellow-800",
  APPROVED:    "bg-green-100 text-green-800",
  PRODUCTION:  "bg-purple-100 text-purple-800",
};

const CELL_COLORS: Record<string, string> = {
  COMMITTED:   "bg-green-100 text-green-800",
  TENTATIVE:   "bg-yellow-100 text-yellow-800",
  DECLINED:    "bg-red-100 text-red-700",
  NO_RESPONSE: "bg-gray-100 text-gray-500",
  "":          "text-gray-300",
};

const CELL_LABELS: Record<string, string> = {
  "":          "—",
  NO_RESPONSE: "?",
  COMMITTED:   "✓",
  TENTATIVE:   "~",
  DECLINED:    "✗",
};

const STATUS_OPTIONS = [
  { value: "",            label: "— not enrolled" },
  { value: "NO_RESPONSE", label: "? No response" },
  { value: "COMMITTED",   label: "✓ Committed" },
  { value: "TENTATIVE",   label: "~ Tentative" },
  { value: "DECLINED",    label: "✗ Declined" },
];

interface Member {
  id: string;
  fullName: string;
  role: string;
  teamId: string | null;
  teamName: string | null;
}
interface Discipline {
  id: string;
  name: string;
  gunType: string | null;
}
interface CommitmentEntry {
  id: string;
  personId: string;
  disciplineId: string;
  status: string;
}
interface Props {
  eventId: string;
  forecastStatus: string;
  canManageForecastStatus: boolean;
  members: Member[];
  disciplines: Discipline[];
  initialCommitments: CommitmentEntry[];
}

type CellKey = string; // `${personId}__${disciplineId}`
type CellValue = { id: string; status: string } | null;

function cellKey(personId: string, disciplineId: string): CellKey {
  return `${personId}__${disciplineId}`;
}

export default function ForecastClient({
  eventId,
  forecastStatus: initialForecastStatus,
  canManageForecastStatus,
  members,
  disciplines,
  initialCommitments,
}: Props) {
  const [forecastStatus, setForecastStatus] = useState(initialForecastStatus);
  const [advancingStatus, setAdvancingStatus] = useState(false);

  // Map: cellKey → { id, status } | null
  const [commMap, setCommMap] = useState<Record<CellKey, CellValue>>(() => {
    const m: Record<CellKey, CellValue> = {};
    for (const c of initialCommitments) {
      m[cellKey(c.personId, c.disciplineId)] = { id: c.id, status: c.status };
    }
    return m;
  });

  const [prepopulating, setPrepopulating] = useState(false);
  const [filterName, setFilterName] = useState("");

  // Group members by team
  const teamGroups = useMemo(() => {
    const q = filterName.toLowerCase();
    const filtered = members.filter(
      (m) => !q || m.fullName.toLowerCase().includes(q)
    );
    const groups = new Map<string, { teamName: string; members: Member[] }>();
    for (const m of filtered) {
      const key = m.teamId ?? "__none__";
      const label = m.teamName ?? "Unassigned";
      if (!groups.has(key)) groups.set(key, { teamName: label, members: [] });
      groups.get(key)!.members.push(m);
    }
    return Array.from(groups.values()).sort((a, b) =>
      a.teamName.localeCompare(b.teamName)
    );
  }, [members, filterName]);

  async function handleCellChange(personId: string, disciplineId: string, newStatus: string) {
    const key = cellKey(personId, disciplineId);
    const existing = commMap[key];

    if (!newStatus) {
      // Delete if exists
      if (existing) {
        const res = await fetch(`/api/events/${eventId}/commitment/${existing.id}`, {
          method: "DELETE",
        });
        if (res.ok) setCommMap((prev) => ({ ...prev, [key]: null }));
      }
      return;
    }

    if (!existing) {
      // Create
      const res = await fetch(`/api/events/${eventId}/commitment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, disciplineId, status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommMap((prev) => ({ ...prev, [key]: { id: data.id, status: newStatus } }));
      }
    } else if (existing.status !== newStatus) {
      // Update
      const res = await fetch(`/api/events/${eventId}/commitment/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setCommMap((prev) => ({ ...prev, [key]: { ...existing, status: newStatus } }));
    }
  }

  async function handlePrepopulate() {
    if (members.length === 0 || disciplines.length === 0) return;
    setPrepopulating(true);
    try {
      const entries = members.flatMap((m) =>
        disciplines.map((d) => ({ personId: m.id, disciplineId: d.id }))
      );
      const res = await fetch(`/api/events/${eventId}/commitment/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (res.ok) {
        // Re-fetch commitments to update state
        const listRes = await fetch(`/api/events/${eventId}/commitment`);
        if (listRes.ok) {
          const all: CommitmentEntry[] = await listRes.json();
          const m: Record<CellKey, CellValue> = {};
          for (const c of all) {
            m[cellKey(c.personId, c.disciplineId)] = { id: c.id, status: c.status };
          }
          setCommMap(m);
        }
      }
    } finally {
      setPrepopulating(false);
    }
  }

  async function handleForecastStatusChange(newStatus: string) {
    setAdvancingStatus(true);
    try {
      const res = await fetch(`/api/events/${eventId}/forecast-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forecastStatus: newStatus }),
      });
      if (res.ok) setForecastStatus(newStatus);
    } finally {
      setAdvancingStatus(false);
    }
  }

  const nextStatus = FORECAST_STATUS_FLOW[FORECAST_STATUS_FLOW.indexOf(forecastStatus as typeof FORECAST_STATUS_FLOW[number]) + 1];

  // Summary counts
  const committedCount = Object.values(commMap).filter((v) => v?.status === "COMMITTED").length;
  const tentativeCount = Object.values(commMap).filter((v) => v?.status === "TENTATIVE").length;
  const enrolledCount  = Object.values(commMap).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Forecast status header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Forecast Status:</span>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${FORECAST_COLORS[forecastStatus] ?? "bg-gray-100"}`}>
            {forecastStatus}
          </span>
        </div>

        {canManageForecastStatus && (
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs text-gray-500">Change to:</label>
            <select
              value={forecastStatus}
              onChange={(e) => handleForecastStatusChange(e.target.value)}
              disabled={advancingStatus}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {FORECAST_STATUS_FLOW.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {nextStatus && (
              <button
                onClick={() => handleForecastStatusChange(nextStatus)}
                disabled={advancingStatus}
                className="bg-blue-700 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-800 disabled:opacity-50"
              >
                {advancingStatus ? "Saving…" : `Advance → ${nextStatus}`}
              </button>
            )}
          </div>
        )}

        <div className="flex gap-3 text-xs text-gray-500 ml-auto">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">✓ {committedCount}</span>
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">~ {tentativeCount}</span>
          <span className="text-gray-400">{enrolledCount} entries</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder="Filter by name…"
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {filterName && (
          <button onClick={() => setFilterName("")} className="text-xs text-gray-500 hover:text-gray-700">
            Clear
          </button>
        )}
        <button
          onClick={handlePrepopulate}
          disabled={prepopulating || members.length === 0 || disciplines.length === 0}
          className="ml-auto bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded disabled:opacity-50"
        >
          {prepopulating ? "Adding…" : "Pre-populate all members"}
        </button>
      </div>

      {disciplines.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          No disciplines defined. <a href="/disciplines" className="underline">Add disciplines first</a>.
        </p>
      )}

      {members.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          No team members found. Make sure members are assigned to your team under{" "}
          <a href="/people" className="underline">People</a>.
        </p>
      )}

      {/* Matrix per team group */}
      {teamGroups.map(({ teamName, members: groupMembers }) => (
        <div key={teamName} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-2">
            <h3 className="font-semibold text-gray-700 text-sm">{teamName}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-2 text-gray-600 font-medium min-w-[160px]">Member</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium w-20">Role</th>
                  {disciplines.map((d) => (
                    <th key={d.id} className="text-center px-2 py-2 text-gray-600 font-medium whitespace-nowrap min-w-[110px]">
                      {d.name}
                      {d.gunType && <span className="block text-xs font-normal text-gray-400">{d.gunType}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{member.fullName}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        member.role === "ATHLETE" ? "bg-blue-100 text-blue-700" :
                        member.role === "COACH"   ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    {disciplines.map((d) => {
                      const key = cellKey(member.id, d.id);
                      const cell = commMap[key];
                      const statusVal = cell?.status ?? "";
                      return (
                        <td key={d.id} className="px-2 py-1 text-center">
                          <select
                            value={statusVal}
                            onChange={(e) => handleCellChange(member.id, d.id, e.target.value)}
                            title={STATUS_OPTIONS.find((o) => o.value === statusVal)?.label ?? "—"}
                            className={`text-xs px-1 py-1 rounded border-0 w-full text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer ${CELL_COLORS[statusVal] ?? "bg-gray-100"}`}
                          >
                            {STATUS_OPTIONS.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {teamGroups.length === 0 && filterName && (
        <p className="text-sm text-gray-400 text-center py-6">No members match "{filterName}".</p>
      )}

      <div className="text-xs text-gray-400 mt-2">
        Legend: <span className="bg-green-100 text-green-800 px-1 rounded">✓ Committed</span>{" "}
        <span className="bg-yellow-100 text-yellow-800 px-1 rounded">~ Tentative</span>{" "}
        <span className="bg-red-100 text-red-700 px-1 rounded">✗ Declined</span>{" "}
        <span className="bg-gray-100 text-gray-500 px-1 rounded">? No response</span>{" "}
        <span className="text-gray-300 px-1">— Not enrolled</span>
      </div>
    </div>
  );
}

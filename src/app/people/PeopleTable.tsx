"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Person {
  id: string;
  fullName: string;
  role: string;
  status: string;
  gender: string | null;
  team: string | null;
  teamId: string | null;
  teamRef: { id: string; name: string } | null;
  division: string | null;
  classLabel: string | null;
  email: string | null;
  _count: { athleteAssignments: number; staffAssignments: number; commitmentStatuses: number };
}

const ROLES = ["ATHLETE", "COACH", "RO", "VOLUNTEER", "STAFF"] as const;
const STATUSES = ["ACTIVE", "INACTIVE", "ALUMNI"] as const;

const ROLE_COLORS: Record<string, string> = {
  ATHLETE:   "bg-blue-100 text-blue-700",
  COACH:     "bg-green-100 text-green-700",
  RO:        "bg-yellow-100 text-yellow-700",
  VOLUNTEER: "bg-purple-100 text-purple-700",
  STAFF:     "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-gray-100 text-gray-500",
  ALUMNI:   "bg-amber-100 text-amber-700",
};

const STATUS_NEXT: Record<string, string> = {
  ACTIVE:   "INACTIVE",
  INACTIVE: "ACTIVE",
  ALUMNI:   "ACTIVE",
};

export default function PeopleTable({ people }: { people: Person[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const teams = useMemo(() => {
    const set = new Set<string>();
    people.forEach((p) => {
      const name = p.teamRef?.name || p.team;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [people]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return people.filter((p) => {
      const teamName = p.teamRef?.name || p.team || "";
      if (q && !p.fullName.toLowerCase().includes(q) && !teamName.toLowerCase().includes(q)) return false;
      if (roleFilter && p.role !== roleFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (teamFilter && (p.teamRef?.name || p.team) !== teamFilter) return false;
      return true;
    });
  }, [people, search, roleFilter, statusFilter, teamFilter]);

  async function handleStatusToggle(person: Person, newStatus: string) {
    setTogglingId(person.id);
    try {
      await fetch(`/api/people/${person.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: person.fullName,
          email: person.email,
          role: person.role,
          status: newStatus,
          gender: person.gender,
          teamId: person.teamId,
          division: person.division,
          classLabel: person.classLabel,
        }),
      });
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  const hasFilters = search || roleFilter || statusFilter || teamFilter;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search name / team</label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {teams.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Team</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All teams</option>
              {teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setRoleFilter(""); setStatusFilter(""); setTeamFilter(""); }}
            className="text-xs text-gray-500 hover:text-gray-700 mt-4"
          >
            Clear filters
          </button>
        )}
        <span className="text-xs text-gray-400 mt-4 ml-auto">
          {filtered.length} of {people.length} shown
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">No people match the current filters.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Gender</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Team</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Div / Class</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Events</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.status === "INACTIVE" ? "opacity-60" : ""}`}>
                  <td className="px-4 py-2 font-medium text-gray-800">{p.fullName}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[p.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {p.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      title={`Click to set to ${STATUS_NEXT[p.status] ?? "ACTIVE"}`}
                      disabled={togglingId === p.id}
                      onClick={() => handleStatusToggle(p, STATUS_NEXT[p.status] ?? "ACTIVE")}
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 disabled:cursor-wait ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{p.gender || "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{p.teamRef?.name || p.team || "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{p.division || p.classLabel || "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{p.email || "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{p._count.commitmentStatuses}</td>
                  <td className="px-4 py-2">
                    <Link href={`/people/${p.id}`} className="text-blue-600 hover:underline text-xs">
                      Edit →
                    </Link>
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

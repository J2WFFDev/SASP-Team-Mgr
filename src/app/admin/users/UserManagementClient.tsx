"use client";
import { useState } from "react";

const USER_ROLES = ["LEAGUE_ADMIN", "MATCH_DIRECTOR", "HEAD_COACH"] as const;

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  teamId: string | null;
  createdAt: Date | string;
  team: { name: string } | null;
}

interface Team {
  id: string;
  name: string;
}

interface Props {
  users: UserRow[];
  teams: Team[];
  currentUserId: string;
}

export default function UserManagementClient({ users, teams, currentUserId }: Props) {
  const [rows, setRows] = useState(() =>
    users.map((u) => ({ ...u, _role: u.role, _teamId: u.teamId ?? "" }))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successes, setSuccesses] = useState<Record<string, boolean>>({});

  async function handleSave(userId: string) {
    const row = rows.find((r) => r.id === userId);
    if (!row) return;
    setSaving(userId);
    setErrors((prev) => ({ ...prev, [userId]: "" }));
    setSuccesses((prev) => ({ ...prev, [userId]: false }));
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: row._role,
          teamId: row._teamId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === userId
            ? { ...r, role: data.role, teamId: data.teamId, _role: data.role, _teamId: data.teamId ?? "" }
            : r
        )
      );
      setSuccesses((prev) => ({ ...prev, [userId]: true }));
      setTimeout(() => setSuccesses((prev) => ({ ...prev, [userId]: false })), 2000);
    } catch (err: unknown) {
      setErrors((prev) => ({
        ...prev,
        [userId]: err instanceof Error ? err.message : "Unknown error",
      }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
            <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
            <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
            <th className="text-left px-4 py-3 text-gray-600 font-medium">Team</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-medium text-gray-800">
                {row.name || "—"}
                {row.id === currentUserId && (
                  <span className="ml-2 text-xs text-gray-400">(you)</span>
                )}
              </td>
              <td className="px-4 py-2 text-gray-500">{row.email}</td>
              <td className="px-4 py-2">
                <select
                  value={row._role}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, _role: e.target.value } : r
                      )
                    )
                  }
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2">
                <select
                  value={row._teamId}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, _teamId: e.target.value } : r
                      )
                    )
                  }
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave(row.id)}
                    disabled={saving === row.id}
                    className="bg-blue-700 text-white px-3 py-1.5 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
                  >
                    {saving === row.id ? "Saving..." : "Save"}
                  </button>
                  {errors[row.id] && (
                    <span className="text-red-600 text-xs">{errors[row.id]}</span>
                  )}
                  {successes[row.id] && (
                    <span className="text-green-600 text-xs">Saved!</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

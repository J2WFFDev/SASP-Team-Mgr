"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_COLORS: Record<string, string> = {
  ATHLETE: "bg-blue-100 text-blue-700",
  COACH: "bg-green-100 text-green-700",
  RO: "bg-yellow-100 text-yellow-700",
  VOLUNTEER: "bg-purple-100 text-purple-700",
  STAFF: "bg-gray-100 text-gray-600",
};

const USER_ROLE_COLORS: Record<string, string> = {
  LEAGUE_ADMIN: "bg-red-100 text-red-700",
  MATCH_DIRECTOR: "bg-orange-100 text-orange-700",
  HEAD_COACH: "bg-blue-100 text-blue-700",
};

interface TeamUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface TeamPerson {
  id: string;
  fullName: string;
  role: string;
  status: string;
  division: string | null;
  classLabel: string | null;
}

interface Team {
  id: string;
  name: string;
  shortName: string | null;
  users: TeamUser[];
  persons: TeamPerson[];
}

interface Props {
  team: Team;
  allPersons: TeamPerson[];
  allUsers: TeamUser[];
}

export default function TeamDetailClient({ team, allPersons, allUsers }: Props) {
  const router = useRouter();

  const [name, setName] = useState(team.name);
  const [shortName, setShortName] = useState(team.shortName ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [infoError, setInfoError] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [userError, setUserError] = useState("");

  const [memberSearch, setMemberSearch] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  const teamUserIds = new Set(team.users.map((u) => u.id));
  const teamPersonIds = new Set(team.persons.map((p) => p.id));

  const availableUsers = allUsers.filter((u) => !teamUserIds.has(u.id));
  const availablePersons = allPersons.filter(
    (p) =>
      !teamPersonIds.has(p.id) &&
      p.fullName.toLowerCase().includes(memberSearch.toLowerCase())
  );

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setInfoError("");
    try {
      const res = await fetch(`/api/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, shortName: shortName || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      router.refresh();
    } catch (err: unknown) {
      setInfoError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTeam() {
    setDeleting(true);
    setInfoError("");
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      router.push("/teams");
    } catch (err: unknown) {
      setInfoError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  async function handleRemoveUser(userId: string) {
    setUserError("");
    try {
      const res = await fetch(`/api/teams/${team.id}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove user");
      }
      router.refresh();
    } catch (err: unknown) {
      setUserError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleAddUser() {
    if (!selectedUserId) return;
    setAddingUser(true);
    setUserError("");
    try {
      const res = await fetch(`/api/teams/${team.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add user");
      }
      setSelectedUserId("");
      router.refresh();
    } catch (err: unknown) {
      setUserError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAddingUser(false);
    }
  }

  async function handleRemoveMember(personId: string) {
    setMemberError("");
    try {
      const res = await fetch(`/api/teams/${team.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }
      router.refresh();
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleAddMember() {
    if (!selectedPersonId) return;
    setAddingMember(true);
    setMemberError("");
    try {
      const res = await fetch(`/api/teams/${team.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: selectedPersonId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add member");
      }
      setSelectedPersonId("");
      setMemberSearch("");
      router.refresh();
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAddingMember(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Team Info */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Team Info</h2>
        <form onSubmit={handleSaveInfo} className="bg-white border border-gray-200 rounded-lg p-5">
          {infoError && <p className="text-red-600 text-sm mb-3">{infoError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
              <input
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleDeleteTeam}
              disabled={deleting}
              className="bg-red-100 text-red-700 px-5 py-2 rounded hover:bg-red-200 text-sm disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Team"}
            </button>
          </div>
        </form>
      </section>

      {/* Coaches / Users */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Coaches / Users</h2>
        {userError && <p className="text-red-600 text-sm mb-2">{userError}</p>}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {team.users.length === 0 ? (
            <p className="text-gray-500 text-sm p-4">No users assigned to this team.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {team.users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{u.name || "—"}</td>
                    <td className="px-4 py-2 text-gray-500">{u.email}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                          USER_ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRemoveUser(u.id)}
                        className="bg-red-100 text-red-700 px-3 py-1.5 rounded hover:bg-red-200 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {availableUsers.length > 0 && (
          <div className="mt-3 flex gap-2 items-center">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            >
              <option value="">Select a user to add...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email} ({u.role})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddUser}
              disabled={!selectedUserId || addingUser}
              className="bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
            >
              {addingUser ? "Adding..." : "Add User"}
            </button>
          </div>
        )}
      </section>

      {/* Members */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Members</h2>
        {memberError && <p className="text-red-600 text-sm mb-2">{memberError}</p>}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {team.persons.length === 0 ? (
            <p className="text-gray-500 text-sm p-4">No members assigned to this team.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Division</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {team.persons.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{p.fullName}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                          ROLE_COLORS[p.role] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{p.status}</td>
                    <td className="px-4 py-2 text-gray-500">{p.division || "—"}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRemoveMember(p.id)}
                        className="bg-red-100 text-red-700 px-3 py-1.5 rounded hover:bg-red-200 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-3 space-y-2">
          <input
            type="search"
            value={memberSearch}
            onChange={(e) => {
              setMemberSearch(e.target.value);
              setSelectedPersonId("");
            }}
            placeholder="Search members to add..."
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {memberSearch && (
            <div className="flex gap-2 items-center">
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              >
                <option value="">
                  {availablePersons.length === 0
                    ? "No matching persons available"
                    : "Select a person..."}
                </option>
                {availablePersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.role})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedPersonId || addingMember}
                className="bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
              >
                {addingMember ? "Adding..." : "Add Member"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["ATHLETE", "COACH", "RO", "VOLUNTEER", "STAFF"] as const;
const STATUSES = ["ACTIVE", "INACTIVE", "ALUMNI"] as const;

export default function AddPersonForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ATHLETE");
  const [status, setStatus] = useState("ACTIVE");
  const [team, setTeam] = useState("");
  const [division, setDivision] = useState("");
  const [classLabel, setClassLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, role, status, team, division, classLabel }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add person");
      }
      setFullName(""); setEmail(""); setRole("ATHLETE"); setStatus("ACTIVE"); setTeam(""); setDivision(""); setClassLabel("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Add Person</h2>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
          <input
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Open, Junior"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
          <input
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Lincoln HS, Central Academy"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <input
            value={classLabel}
            onChange={(e) => setClassLabel(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Master, Expert"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Person"}
      </button>
    </form>
  );
}

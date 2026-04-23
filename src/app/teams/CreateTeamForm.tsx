"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTeamForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, shortName: shortName || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create team");
      }
      setName("");
      setShortName("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Create Team</h2>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Lincoln High School"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
          <input
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. LHS"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Team"}
      </button>
    </form>
  );
}

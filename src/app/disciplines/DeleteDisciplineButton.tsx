"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteDisciplineButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm(`Delete discipline "${name}"?`)) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/disciplines/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
      alert(err instanceof Error ? err.message : "Error deleting discipline");
    } finally {
      setLoading(false);
    }
  }

  if (error) return <span className="text-red-600 text-xs">{error}</span>;

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}

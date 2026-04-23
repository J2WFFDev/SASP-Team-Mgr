"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  name: string;
  shortName: string | null;
  gunType: string | null;
  assignmentCount: number;
  commitmentCount: number;
}

export default function DisciplineRow({ id, name, shortName, gunType, assignmentCount, commitmentCount }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editShortName, setEditShortName] = useState(shortName ?? "");
  const [editGunType, setEditGunType] = useState(gunType ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  function startEdit() {
    setEditName(name);
    setEditShortName(shortName ?? "");
    setEditGunType(gunType ?? "");
    setError("");
    setIsEditing(true);
  }

  function cancelEdit() {
    setError("");
    setIsEditing(false);
  }

  async function handleSave() {
    if (!editName.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/disciplines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), shortName: editShortName.trim(), gunType: editGunType.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setIsEditing(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete discipline "${name}"?`)) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/disciplines/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting");
      setDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Discipline name"
            autoFocus
          />
          {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
        </td>
        <td className="px-4 py-2">
          <input
            value={editShortName}
            onChange={(e) => setEditShortName(e.target.value)}
            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. PP"
          />
        </td>
        <td className="px-4 py-2">
          <input
            value={editGunType}
            onChange={(e) => setEditGunType(e.target.value)}
            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Pistol"
          />
        </td>
        <td className="px-4 py-2 text-gray-400 text-sm">{assignmentCount}</td>
        <td className="px-4 py-2 text-gray-400 text-sm">{commitmentCount}</td>
        <td className="px-4 py-2 text-right whitespace-nowrap">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-blue-700 hover:text-blue-900 text-xs font-medium disabled:opacity-50 mr-3"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={cancelEdit}
            className="text-gray-500 hover:text-gray-700 text-xs"
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 font-medium text-gray-800">{name}</td>
      <td className="px-4 py-2 text-gray-500">{shortName || "—"}</td>
      <td className="px-4 py-2 text-gray-500">{gunType || "—"}</td>
      <td className="px-4 py-2 text-gray-500">{assignmentCount}</td>
      <td className="px-4 py-2 text-gray-500">{commitmentCount}</td>
      <td className="px-4 py-2 text-right whitespace-nowrap">
        {error && <span className="text-red-600 text-xs mr-2">{error}</span>}
        <button
          onClick={startEdit}
          className="text-blue-600 hover:text-blue-800 text-xs mr-3"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}

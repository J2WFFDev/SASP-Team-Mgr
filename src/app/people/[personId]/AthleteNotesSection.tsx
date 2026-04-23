"use client";
import { useState } from "react";

interface NoteAuthor {
  id: string;
  name: string | null;
}

interface NoteRow {
  id: string;
  content: string;
  createdAt: string;
  author: NoteAuthor;
}

interface Props {
  personId: string;
  currentUserId: string;
  currentUserRole: string;
  initialNotes: NoteRow[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AthleteNotesSection({
  personId,
  currentUserId,
  currentUserRole,
  initialNotes,
}: Props) {
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!draft.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/people/${personId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save note");
      }
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setDraft("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    const res = await fetch(`/api/people/${personId}/notes/${noteId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  }

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Coach Notes</h2>

      {/* Add note */}
      <div className="mb-5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Add a note about this athlete…"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAdd}
            disabled={saving || !draft.trim()}
            className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add Note"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-sm text-gray-400">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => {
            const canDelete =
              note.author.id === currentUserId || currentUserRole === "LEAGUE_ADMIN";
            return (
              <li
                key={note.id}
                className="bg-gray-50 border border-gray-200 rounded p-3 text-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-gray-800 whitespace-pre-wrap flex-1">{note.content}</p>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-gray-400 hover:text-red-500 shrink-0 text-xs"
                      title="Delete note"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {note.author.name ?? "Unknown"} · {formatDate(note.createdAt)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

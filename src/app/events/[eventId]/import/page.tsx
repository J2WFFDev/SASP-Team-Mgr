"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type ImportType = "squadding" | "schedule" | "ath_schedule" | "vol_schedule" | "ref";

const IMPORT_TYPES: { value: ImportType; label: string; description: string }[] = [
  { value: "squadding", label: "Squadding.tsv", description: "Squad assignments, relay info" },
  { value: "schedule", label: "Schedule.tsv", description: "Master schedule with flights and stages" },
  { value: "ath_schedule", label: "Ath Schedule Indy.tsv", description: "Individual athlete schedules" },
  { value: "vol_schedule", label: "Vol Schedule Indy.tsv", description: "Volunteer/coach schedules" },
  { value: "ref", label: "ref.tsv", description: "Reference data: disciplines, gun types" },
];

export default function ImportPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [importType, setImportType] = useState<ImportType>("schedule");
  const [tsvText, setTsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearFirst, setClearFirst] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tsvText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/events/${eventId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: importType, tsv: tsvText, clearFirst }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult({ ok: true, message: data.message || "Import successful!" });
      setTsvText("");
    } catch (err: unknown) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setTsvText(ev.target?.result as string || "");
    reader.readAsText(file);
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <Link href={`/events/${eventId}`} className="hover:underline">Overview</Link>
        <span>/</span>
        <span>Import</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Import TSV Data</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {IMPORT_TYPES.map((t) => (
              <label
                key={t.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                  importType === t.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="importType"
                  value={t.value}
                  checked={importType === t.value}
                  onChange={() => setImportType(t.value)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">{t.label}</div>
                  <div className="text-xs text-gray-500">{t.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload TSV File</label>
          <input
            type="file"
            accept=".tsv,.csv,.txt"
            onChange={handleFileUpload}
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Or Paste TSV Content
          </label>
          <textarea
            value={tsvText}
            onChange={(e) => setTsvText(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste TSV content here..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="clearFirst"
            type="checkbox"
            checked={clearFirst}
            onChange={(e) => setClearFirst(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="clearFirst" className="text-sm text-gray-600">
            Clear existing event data before import (reimport mode)
          </label>
        </div>

        {result && (
          <div className={`text-sm px-4 py-3 rounded ${result.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !tsvText.trim()}
          className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? "Importing..." : "Import"}
        </button>
      </form>
    </div>
  );
}

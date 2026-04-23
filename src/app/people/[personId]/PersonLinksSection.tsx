"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LinkedPerson {
  id: string;
  fullName: string;
  role?: string;
  division?: string | null;
  team?: string | null;
}

interface PersonLinkRow {
  id: string;
  coach?: LinkedPerson;
  athlete?: LinkedPerson;
}

interface PickablePerson {
  id: string;
  fullName: string;
  role: string;
}

interface Props {
  personId: string;
  personRole: string;
  coachLinks: PersonLinkRow[]; // links where this person is the coach
  athleteLinks: PersonLinkRow[]; // links where this person is the athlete
  allPeople: PickablePerson[]; // full roster to pick from
}

export default function PersonLinksSection({
  personId,
  personRole,
  coachLinks: initialCoachLinks,
  athleteLinks: initialAthleteLinks,
  allPeople,
}: Props) {
  const router = useRouter();
  const [coachLinks, setCoachLinks] = useState<PersonLinkRow[]>(initialCoachLinks);
  const [athleteLinks, setAthleteLinks] = useState<PersonLinkRow[]>(initialAthleteLinks);

  const [addAthleteId, setAddAthleteId] = useState("");
  const [addCoachId, setAddCoachId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isCoachRole = ["COACH", "RO", "VOLUNTEER", "STAFF"].includes(personRole);
  const isAthleteRole = personRole === "ATHLETE";

  // People available to link as athletes (exclude self and already-linked)
  const linkedAthleteIds = new Set(coachLinks.map((l) => l.athlete?.id));
  const availableAthletes = allPeople.filter(
    (p) => p.id !== personId && !linkedAthleteIds.has(p.id)
  );

  // People available to link as coaches (exclude self and already-linked)
  const linkedCoachIds = new Set(athleteLinks.map((l) => l.coach?.id));
  const availableCoaches = allPeople.filter(
    (p) => p.id !== personId && !linkedCoachIds.has(p.id)
  );

  async function handleLinkAthlete() {
    if (!addAthleteId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/people/${personId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId: addAthleteId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to link");
      }
      const link = await res.json();
      setCoachLinks((prev) => [...prev, link]);
      setAddAthleteId("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleLinkCoach() {
    if (!addCoachId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/people/${personId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId: addCoachId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to link");
      }
      const link = await res.json();
      setAthleteLinks((prev) => [...prev, link]);
      setAddCoachId("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlink(linkId: string, side: "coach" | "athlete") {
    const res = await fetch(`/api/people/${personId}/links/${linkId}`, { method: "DELETE" });
    if (res.ok) {
      if (side === "coach") setCoachLinks((prev) => prev.filter((l) => l.id !== linkId));
      else setAthleteLinks((prev) => prev.filter((l) => l.id !== linkId));
    }
  }

  const hasAnything = coachLinks.length > 0 || athleteLinks.length > 0 || isCoachRole || isAthleteRole;
  if (!hasAnything) return null;

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Coach / Athlete Links</h2>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {/* Coach section: if this person is a coach/volunteer, show their athletes */}
      {(isCoachRole || coachLinks.length > 0) && (
        <div className="mb-5">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Linked Athletes <span className="text-gray-400 font-normal">(this person coaches / accompanies)</span>
          </h3>
          {coachLinks.length === 0 ? (
            <p className="text-sm text-gray-400">No athletes linked yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {coachLinks.map((l) => (
                <span
                  key={l.id}
                  className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm"
                >
                  <span className="font-medium text-blue-800">{l.athlete?.fullName}</span>
                  {l.athlete?.division && (
                    <span className="text-blue-500 text-xs">({l.athlete.division})</span>
                  )}
                  <button
                    onClick={() => handleUnlink(l.id, "coach")}
                    className="text-blue-400 hover:text-red-500 ml-1 text-xs"
                    title="Remove link"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <select
              value={addAthleteId}
              onChange={(e) => setAddAthleteId(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— add athlete link —</option>
              {availableAthletes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.role})
                </option>
              ))}
            </select>
            <button
              onClick={handleLinkAthlete}
              disabled={saving || !addAthleteId}
              className="bg-blue-700 text-white px-3 py-1 rounded text-sm hover:bg-blue-800 disabled:opacity-50"
            >
              Link
            </button>
          </div>
        </div>
      )}

      {/* Athlete section: if this person is an athlete, show their coaches */}
      {(isAthleteRole || athleteLinks.length > 0) && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Linked Coaches / Parents <span className="text-gray-400 font-normal">(who accompany this athlete)</span>
          </h3>
          {athleteLinks.length === 0 ? (
            <p className="text-sm text-gray-400">No coaches linked yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {athleteLinks.map((l) => (
                <span
                  key={l.id}
                  className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-sm"
                >
                  <span className="font-medium text-green-800">{l.coach?.fullName}</span>
                  {l.coach?.role && (
                    <span className="text-green-500 text-xs">({l.coach.role})</span>
                  )}
                  <button
                    onClick={() => handleUnlink(l.id, "athlete")}
                    className="text-green-400 hover:text-red-500 ml-1 text-xs"
                    title="Remove link"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <select
              value={addCoachId}
              onChange={(e) => setAddCoachId(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— add coach/parent link —</option>
              {availableCoaches.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.role})
                </option>
              ))}
            </select>
            <button
              onClick={handleLinkCoach}
              disabled={saving || !addCoachId}
              className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-800 disabled:opacity-50"
            >
              Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

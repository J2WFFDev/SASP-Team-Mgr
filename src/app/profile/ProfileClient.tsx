"use client";
import { useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  LEAGUE_ADMIN: "League Admin",
  MATCH_DIRECTOR: "Match Director",
  HEAD_COACH: "Head Coach",
};

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  teamId: string | null;
  team: { name: string } | null;
}

export default function ProfileClient({ user }: { user: User }) {
  const [name, setName] = useState(user.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameError("");
    setNameSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2000);
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update password");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 2000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Profile Info</h2>
        <form onSubmit={handleSaveName} className="bg-white border border-gray-200 rounded-lg p-5">
          {nameError && <p className="text-red-600 text-sm mb-3">{nameError}</p>}
          {nameSuccess && <p className="text-green-600 text-sm mb-3">Saved!</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>
          <button
            type="submit"
            disabled={savingName}
            className="mt-4 bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
          >
            {savingName ? "Saving..." : "Save"}
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Change Password</h2>
        <form onSubmit={handleChangePassword} className="bg-white border border-gray-200 rounded-lg p-5">
          {pwError && <p className="text-red-600 text-sm mb-3">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm mb-3">Password updated!</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingPw}
            className="mt-4 bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 text-sm disabled:opacity-50"
          >
            {savingPw ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>

      {/* Account Info */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Account Info</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Email: </span>
            <span className="text-sm text-gray-600">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Role: </span>
            <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Team: </span>
            <span className="text-sm text-gray-600">{user.team?.name ?? "—"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

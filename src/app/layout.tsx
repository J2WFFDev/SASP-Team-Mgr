import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { auth, signOut } from "@/auth";

export const metadata: Metadata = {
  title: "SASP Team Manager",
  description: "Scheduling and squadding for SASP matches",
};

const ROLE_LABELS: Record<string, string> = {
  LEAGUE_ADMIN: "League Admin",
  MATCH_DIRECTOR: "Match Director",
  HEAD_COACH: "Head Coach",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  return (
    <html lang="en">
      <body className="font-sans">
        <header className="bg-blue-800 text-white px-6 py-3 flex items-center gap-6">
          <Link href="/" className="text-xl font-bold hover:text-blue-200">
            SASP Team Mgr
          </Link>
          {user && (
            <nav className="flex gap-4 text-sm">
              <Link href="/events" className="hover:text-blue-200">Events</Link>
              <Link href="/people" className="hover:text-blue-200">People</Link>
              <Link href="/disciplines" className="hover:text-blue-200">Disciplines</Link>
              {user.role === "LEAGUE_ADMIN" && (
                <>
                  <Link href="/teams" className="hover:text-blue-200">Teams</Link>
                  <Link href="/admin/users" className="hover:text-blue-200">Users</Link>
                </>
              )}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-4 text-sm">
            {user ? (
              <>
                  <span className="text-blue-200 hidden sm:inline">
                    {user.name || user.email}
                    {user.role && (
                      <span className="ml-2 bg-blue-700 rounded px-1.5 py-0.5 text-xs">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    )}
                  </span>
                  <Link href="/profile" className="hover:text-blue-200 text-xs border border-blue-600 rounded px-2 py-1">
                    Profile
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/login" });
                    }}
                  >
                    <button
                      type="submit"
                      className="text-blue-200 hover:text-white border border-blue-600 rounded px-2 py-1 text-xs"
                    >
                      Sign out
                    </button>
                  </form>
                </>
            ) : (
              <Link href="/login" className="hover:text-blue-200">
                Sign in
              </Link>
            )}
          </div>
        </header>
        <main className="min-h-screen bg-gray-50">{children}</main>
      </body>
    </html>
  );
}

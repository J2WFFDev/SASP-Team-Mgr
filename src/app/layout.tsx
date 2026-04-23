import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SASP Team Manager",
  description: "Scheduling and squadding for SASP matches",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <header className="bg-blue-800 text-white px-6 py-3 flex items-center gap-6">
          <Link href="/" className="text-xl font-bold hover:text-blue-200">
            SASP Team Mgr
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/events" className="hover:text-blue-200">Events</Link>
            <Link href="/people" className="hover:text-blue-200">People</Link>
            <Link href="/disciplines" className="hover:text-blue-200">Disciplines</Link>
          </nav>
        </header>
        <main className="min-h-screen bg-gray-50">{children}</main>
      </body>
    </html>
  );
}

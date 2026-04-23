import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateTeamForm from "./CreateTeamForm";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "LEAGUE_ADMIN") {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <p className="text-red-600">403 — You do not have permission to view this page.</p>
      </div>
    );
  }

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { persons: true, users: true } } },
  });

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <span className="text-sm text-gray-500">
          {teams.length} {teams.length === 1 ? "team" : "teams"}
        </span>
      </div>

      <CreateTeamForm />

      <div className="mt-8">
        {teams.length === 0 ? (
          <p className="text-gray-500 text-sm">No teams yet. Create one above.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Short Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium"># Members</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium"># Users</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{t.name}</td>
                    <td className="px-4 py-2 text-gray-500">{t.shortName || "—"}</td>
                    <td className="px-4 py-2 text-gray-500">{t._count.persons}</td>
                    <td className="px-4 py-2 text-gray-500">{t._count.users}</td>
                    <td className="px-4 py-2">
                      <Link href={`/teams/${t.id}`} className="text-blue-600 hover:underline text-xs">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

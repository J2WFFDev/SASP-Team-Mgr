import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AddPersonForm from "./AddPersonForm";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await prisma.person.findMany({
    orderBy: { fullName: "asc" },
    include: {
      _count: {
        select: { athleteAssignments: true, staffAssignments: true, commitmentStatuses: true },
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">People / Roster</h1>
        <span className="text-sm text-gray-500">{people.length} {people.length === 1 ? "person" : "people"}</span>
      </div>

      <AddPersonForm />

      <div className="mt-8">
        {people.length === 0 ? (
          <p className="text-gray-500 text-sm">No people yet. Add one above.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Division</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Class</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Events</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {people.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{p.fullName}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.role === "ATHLETE" ? "bg-blue-100 text-blue-700" :
                        p.role === "COACH"   ? "bg-green-100 text-green-700" :
                        p.role === "RO"      ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{p.division || "—"}</td>
                    <td className="px-4 py-2 text-gray-500">{p.classLabel || "—"}</td>
                    <td className="px-4 py-2 text-gray-500">{p.email || "—"}</td>
                    <td className="px-4 py-2 text-gray-500">{p._count.commitmentStatuses}</td>
                    <td className="px-4 py-2">
                      <Link href={`/people/${p.id}`} className="text-blue-600 hover:underline text-xs">
                        Edit →
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

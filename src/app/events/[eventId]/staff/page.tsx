import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StaffPage({ params }: { params: { eventId: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();

  const persons = await prisma.person.findMany({
    where: {
      staffAssignments: { some: { eventId: params.eventId } },
    },
    orderBy: { fullName: "asc" },
    include: {
      _count: { select: { staffAssignments: true } },
    },
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/events" className="hover:underline">Events</Link>
        <span>/</span>
        <Link href={`/events/${params.eventId}`} className="hover:underline">{event.name}</Link>
        <span>/</span>
        <span>Staff</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff / Volunteers</h1>

      {persons.length === 0 ? (
        <p className="text-gray-500">No staff found. <Link href={`/events/${params.eventId}/import`} className="text-blue-600 hover:underline">Import volunteer data</Link> first.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Assignments</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {persons.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{p.fullName}</td>
                  <td className="px-4 py-2 text-gray-500">{p.role}</td>
                  <td className="px-4 py-2 text-gray-500">{p._count.staffAssignments}</td>
                  <td className="px-4 py-2">
                    <Link href={`/events/${params.eventId}/staff/${p.id}`} className="text-blue-600 hover:underline text-xs">
                      View Schedule →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

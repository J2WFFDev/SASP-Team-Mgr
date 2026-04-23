import { prisma } from "@/lib/prisma";
import AddDisciplineForm from "./AddDisciplineForm";
import DisciplineRow from "./DisciplineRow";

export const dynamic = "force-dynamic";

export default async function DisciplinesPage() {
  const disciplines = await prisma.discipline.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { athleteAssignments: true, commitmentStatuses: true } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disciplines</h1>
        <span className="text-sm text-gray-500">{disciplines.length} {disciplines.length === 1 ? "discipline" : "disciplines"}</span>
      </div>

      <AddDisciplineForm />

      <div className="mt-8">
        {disciplines.length === 0 ? (
          <p className="text-gray-500 text-sm">No disciplines yet. Add one above or import from TSV.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Short Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Gun Type</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Assignments</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Commitments</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disciplines.map((d) => (
                  <DisciplineRow
                    key={d.id}
                    id={d.id}
                    name={d.name}
                    shortName={d.shortName}
                    gunType={d.gunType}
                    assignmentCount={d._count.athleteAssignments}
                    commitmentCount={d._count.commitmentStatuses}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import AddPersonForm from "./AddPersonForm";
import PeopleTable from "./PeopleTable";

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
          <PeopleTable people={people} />
        )}
      </div>
    </div>
  );
}

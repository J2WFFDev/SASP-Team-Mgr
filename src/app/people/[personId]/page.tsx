import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditPersonForm from "./EditPersonForm";

export const dynamic = "force-dynamic";

export default async function EditPersonPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      _count: { select: { athleteAssignments: true, staffAssignments: true, commitmentStatuses: true } },
    },
  });
  if (!person) notFound();

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/people" className="hover:underline">People</Link>
        <span>/</span>
        <span>{person.fullName}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Person</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-blue-700">{person._count.athleteAssignments}</div>
          <div className="text-xs text-gray-500 mt-1">Athlete Assignments</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-blue-700">{person._count.staffAssignments}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Assignments</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-blue-700">{person._count.commitmentStatuses}</div>
          <div className="text-xs text-gray-500 mt-1">Event Commitments</div>
        </div>
      </div>

      <EditPersonForm person={person} />

      {person._count.athleteAssignments + person._count.staffAssignments > 0 && (
        <p className="mt-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          This person has existing event assignments. Delete those first before deleting the person.
        </p>
      )}
    </div>
  );
}

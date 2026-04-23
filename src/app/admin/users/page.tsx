import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserManagementClient from "./UserManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "LEAGUE_ADMIN") {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <p className="text-red-600">403 — You do not have permission to view this page.</p>
      </div>
    );
  }

  const [users, teams] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        createdAt: true,
        team: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
      <UserManagementClient
        users={users}
        teams={teams}
        currentUserId={session.user.id}
      />
    </div>
  );
}

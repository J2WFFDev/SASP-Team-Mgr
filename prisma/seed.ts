import { PrismaClient, PersonRole, CommitmentStatusEnum } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create sample event
  const event = await prisma.event.upsert({
    where: { name: "2026 WilcoSS Texas State Championship" },
    update: {},
    create: {
      name: "2026 WilcoSS Texas State Championship",
      description: "Preliminary scheduling data",
      startDate: new Date("2026-04-24"),
      endDate: new Date("2026-04-26"),
    },
  });

  console.log("Seeded event:", event.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

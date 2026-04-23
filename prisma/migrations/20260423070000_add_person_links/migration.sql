-- CreateTable
CREATE TABLE "person_links" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_links_coachId_athleteId_key" ON "person_links"("coachId", "athleteId");

-- AddForeignKey
ALTER TABLE "person_links" ADD CONSTRAINT "person_links_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_links" ADD CONSTRAINT "person_links_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

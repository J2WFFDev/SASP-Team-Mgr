-- AlterTable: add flightsPerDay to events
ALTER TABLE "events" ADD COLUMN "flightsPerDay" INTEGER NOT NULL DEFAULT 1;

-- CreateTable: bay_sets
CREATE TABLE "bay_sets" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT,
    "slotsPerBay" INTEGER NOT NULL DEFAULT 16,
    "stage1" TEXT NOT NULL DEFAULT 'Go-Fast',
    "stage2" TEXT,
    "stage3" TEXT,
    "stage4" TEXT,
    "baySetOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bay_sets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bay_sets" ADD CONSTRAINT "bay_sets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

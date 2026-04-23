-- AlterTable: add shortName to disciplines
ALTER TABLE "disciplines" ADD COLUMN "shortName" TEXT;

-- AlterTable: add team to persons
ALTER TABLE "persons" ADD COLUMN "team" TEXT;

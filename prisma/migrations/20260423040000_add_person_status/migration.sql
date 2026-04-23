-- CreateEnum
CREATE TYPE "PersonStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ALUMNI');

-- AlterTable
ALTER TABLE "persons" ADD COLUMN "status" "PersonStatus" NOT NULL DEFAULT 'ACTIVE';

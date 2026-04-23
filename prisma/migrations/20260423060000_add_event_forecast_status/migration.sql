-- CreateEnum
CREATE TYPE "ForecastStatus" AS ENUM ('DRAFT', 'PRELIM', 'ARBITRATION', 'APPROVED', 'PRODUCTION');

-- AlterTable
ALTER TABLE "events" ADD COLUMN "forecastStatus" "ForecastStatus" NOT NULL DEFAULT 'DRAFT';

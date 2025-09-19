-- CreateEnum
CREATE TYPE "PlanningKind" AS ENUM ('ANNUAL', 'SEMESTER', 'INDIVIDUAL');

-- AlterTable
ALTER TABLE "Planning" ADD COLUMN     "content" TEXT,
ADD COLUMN     "discipline" TEXT,
ADD COLUMN     "kind" "PlanningKind" NOT NULL DEFAULT 'ANNUAL',
ADD COLUMN     "lessonsPlanned" INTEGER,
ALTER COLUMN "date" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateEnum
CREATE TYPE "SignupStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SECRETARY';

-- CreateTable
CREATE TABLE "SignupRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleRequested" "Role" NOT NULL DEFAULT 'TEACHER',
    "status" "SignupStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,

    CONSTRAINT "SignupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignupRequest_email_key" ON "SignupRequest"("email");

-- AddForeignKey
ALTER TABLE "SignupRequest" ADD CONSTRAINT "SignupRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

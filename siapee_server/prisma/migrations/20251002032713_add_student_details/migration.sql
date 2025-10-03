-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "addressId" TEXT,
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "comorbidities" TEXT,
ADD COLUMN     "genderId" TEXT,
ADD COLUMN     "isTeacher" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medications" TEXT,
ADD COLUMN     "observations" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photo" TEXT;

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Brasil',
    "zipCode" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gender" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Gender_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

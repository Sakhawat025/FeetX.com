-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "reviewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plateNumber" TEXT,
ADD COLUMN     "vehicleId" TEXT,
ADD COLUMN     "vehicleName" TEXT,
ADD COLUMN     "zone" TEXT;

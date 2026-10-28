-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "maxActiveParcels" INTEGER NOT NULL DEFAULT 4,
    "autoAssignmentRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "priorityDeliveryBufferMin" INTEGER NOT NULL DEFAULT 15,
    "companyName" TEXT NOT NULL DEFAULT 'FleetX Logistics',
    "supportEmail" TEXT NOT NULL DEFAULT '',
    "operatingCity" TEXT NOT NULL DEFAULT 'Dhaka, Bangladesh',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

/*
  Warnings:

  - You are about to drop the column `priority` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "priority" "ParcelPriority";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "priority";

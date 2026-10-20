-- CreateEnum
CREATE TYPE "ParcelPriority" AS ENUM ('STANDARD', 'EXPRESS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "priority" "ParcelPriority";

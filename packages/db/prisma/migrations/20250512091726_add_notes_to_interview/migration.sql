/*
  Warnings:

  - You are about to drop the column `interviewId` on the `Note` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_interviewId_fkey";

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "interviewId";

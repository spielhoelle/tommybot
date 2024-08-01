/*
  Warnings:

  - You are about to drop the column `sessionId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_sessionId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "sessionId";

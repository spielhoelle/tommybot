-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "User_sessionId_key" ON "User"("sessionId" ASC);


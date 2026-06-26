-- DropForeignKey
ALTER TABLE "stalls" DROP CONSTRAINT "stalls_ownerId_fkey";

-- AlterTable
ALTER TABLE "stalls" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "stalls" ADD CONSTRAINT "stalls_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

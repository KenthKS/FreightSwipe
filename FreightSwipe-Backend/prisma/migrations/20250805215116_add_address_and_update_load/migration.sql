/*
  Warnings:

  - You are about to drop the column `destination` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the column `origin` on the `Load` table. All the data in the column will be lost.
  - Added the required column `destinationId` to the `Load` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originId` to the `Load` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Load" DROP COLUMN "destination",
DROP COLUMN "origin",
ADD COLUMN     "destinationId" TEXT NOT NULL,
ADD COLUMN     "originId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Load" ADD CONSTRAINT "Load_originId_fkey" FOREIGN KEY ("originId") REFERENCES "public"."Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Load" ADD CONSTRAINT "Load_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "public"."Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

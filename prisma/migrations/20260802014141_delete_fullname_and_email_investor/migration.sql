/*
  Warnings:

  - You are about to drop the column `email` on the `Investor` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `Investor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Investor" DROP COLUMN "email",
DROP COLUMN "full_name";

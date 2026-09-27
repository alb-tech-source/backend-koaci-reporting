/*
  Warnings:

  - You are about to drop the column `aggregate_fund_amount` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `applicant_profit_share_amount` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `applicant_profit_share_percentage` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `investor_profit_share_amount` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `investor_profit_share_percentage` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `koaci_profit_share_amount` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `koaci_profit_share_beneficiary_amount` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `koaci_profit_share_beneficiary_percentage` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `koaci_profit_share_percentage` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "aggregate_fund_amount",
DROP COLUMN "applicant_profit_share_amount",
DROP COLUMN "applicant_profit_share_percentage",
DROP COLUMN "investor_profit_share_amount",
DROP COLUMN "investor_profit_share_percentage",
DROP COLUMN "koaci_profit_share_amount",
DROP COLUMN "koaci_profit_share_beneficiary_amount",
DROP COLUMN "koaci_profit_share_beneficiary_percentage",
DROP COLUMN "koaci_profit_share_percentage";

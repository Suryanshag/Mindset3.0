-- =============================================================
-- Sprint A — add presenters & workshop payments (v1, additive only)
--
-- Generated via:
--   npx prisma migrate diff \
--     --from-schema /tmp/pre-sprintA.prisma \
--     --to-schema   prisma/schema.prisma \
--     --script
--
-- This file is byte-for-byte what `prisma db push` would emit against
-- a DB at the pre-Sprint-A schema. Apply manually because this project
-- does not use prisma/migrations/ (schema-first via db push).
--
-- Apply via:
--   psql "$DATABASE_URL" -f prisma/manual/sprint-A-add-presenters-and-workshop-payments.sql
-- Then verify with:
--   npx prisma db push   # should report "Your database is now in sync with your Prisma schema."
-- =============================================================

BEGIN;

-- CreateEnum
CREATE TYPE "PresenterTier" AS ENUM ('PROFESSIONAL', 'ASSOCIATE');
CREATE TYPE "WorkshopType" AS ENUM ('WORKSHOP', 'CIRCLE');
CREATE TYPE "WorkshopStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "PaymentType" ADD VALUE 'WORKSHOP';

-- AlterTable
ALTER TABLE "Workshop" ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "meet_link" TEXT,
ADD COLUMN     "min_capacity" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "presenter_id" TEXT,
ADD COLUMN     "presenter_split_pct" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "status" "WorkshopStatus" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "type" "WorkshopType" NOT NULL DEFAULT 'WORKSHOP';

-- AlterTable
ALTER TABLE "WorkshopRegistration" ADD COLUMN     "attended_at" TIMESTAMP(3),
ADD COLUMN     "payment_id" TEXT,
ADD COLUMN     "refunded_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "presenters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT,
    "linkedin_url" TEXT,
    "tier" "PresenterTier" NOT NULL,
    "upi" TEXT,
    "pan" TEXT,
    "bank_account" TEXT,
    "ifsc" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presenters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workshop_presenter_id_idx" ON "Workshop"("presenter_id");
CREATE INDEX "Workshop_date_status_idx" ON "Workshop"("date", "status");
CREATE UNIQUE INDEX "WorkshopRegistration_payment_id_key" ON "WorkshopRegistration"("payment_id");
CREATE INDEX "WorkshopRegistration_workshopId_refunded_at_idx" ON "WorkshopRegistration"("workshopId", "refunded_at");

-- AddForeignKey
ALTER TABLE "Workshop" ADD CONSTRAINT "Workshop_presenter_id_fkey" FOREIGN KEY ("presenter_id") REFERENCES "presenters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkshopRegistration" ADD CONSTRAINT "WorkshopRegistration_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;

ALTER TYPE "prescription_status" ADD VALUE IF NOT EXISTS 'partially_dispensed';
ALTER TYPE "prescription_status" ADD VALUE IF NOT EXISTS 'fully_dispensed';
ALTER TYPE "prescription_status" ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE "prescription_status" ADD VALUE IF NOT EXISTS 'revoked';
ALTER TYPE "prescription_status" ADD VALUE IF NOT EXISTS 'cancelled';

CREATE TYPE "prescription_requirement" AS ENUM ('none', 'prescription_required', 'pharmacist_review', 'restricted_online', 'controlled_medicine');
CREATE TYPE "prescription_item_status" AS ENUM ('pending', 'under_review', 'approved', 'partially_approved', 'rejected', 'expired', 'revoked', 'fully_consumed');
CREATE TYPE "order_item_status" AS ENUM ('reserved', 'partially_fulfilled', 'fulfilled', 'cancelled');

ALTER TABLE "products" ADD COLUMN "prescription_requirement" prescription_requirement NOT NULL DEFAULT 'none';
ALTER TABLE "products" ADD COLUMN "requires_pharmacist_approval" boolean NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "online_sale_allowed" boolean NOT NULL DEFAULT true;
ALTER TABLE "products" ADD COLUMN "controlled_medicine" boolean NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "maximum_dispensing_quantity" integer;
ALTER TABLE "products" ADD COLUMN "prescription_validity_days" integer NOT NULL DEFAULT 30;
ALTER TABLE "products" ADD COLUMN "allow_partial_dispensing" boolean NOT NULL DEFAULT true;
ALTER TABLE "products" ADD COLUMN "allow_generic_substitution" boolean NOT NULL DEFAULT false;
UPDATE "products" SET "prescription_requirement" = 'prescription_required', "requires_pharmacist_approval" = true WHERE "prescription_required" = true;
ALTER TABLE "products" ADD CONSTRAINT "products_dispensing_limits_check" CHECK ("maximum_dispensing_quantity" IS NULL OR "maximum_dispensing_quantity" > 0);
ALTER TABLE "products" ADD CONSTRAINT "products_validity_days_check" CHECK ("prescription_validity_days" > 0);

ALTER TABLE "prescriptions" ADD COLUMN "expires_at" timestamp;
ALTER TABLE "prescriptions" ADD COLUMN "revoked_at" timestamp;
ALTER TABLE "prescriptions" ADD COLUMN "revoked_by" varchar;
ALTER TABLE "prescriptions" ADD COLUMN "revocation_reason" text;
ALTER TABLE "prescriptions" ADD COLUMN "prescriber_name" varchar(255);
ALTER TABLE "prescriptions" ADD COLUMN "facility_name" varchar(255);
ALTER TABLE "order_items" ADD COLUMN "quantity_dispensed" integer NOT NULL DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN "status" order_item_status NOT NULL DEFAULT 'reserved';
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_dispensed_check" CHECK ("quantity_dispensed" >= 0 AND "quantity_dispensed" <= "quantity");

CREATE TABLE "prescription_order_items" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(), "branch_id" varchar NOT NULL,
  "prescription_id" varchar NOT NULL REFERENCES "prescriptions"("id") ON DELETE RESTRICT,
  "order_id" varchar NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
  "order_item_id" varchar NOT NULL UNIQUE REFERENCES "order_items"("id") ON DELETE RESTRICT,
  "product_id" varchar NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "prescribed_quantity" integer NOT NULL, "authorised_quantity" integer NOT NULL DEFAULT 0,
  "dispensed_quantity" integer NOT NULL DEFAULT 0, "approval_status" prescription_item_status NOT NULL DEFAULT 'pending',
  "substitution_allowed" boolean NOT NULL DEFAULT false, "reviewed_by" varchar, "reviewed_at" timestamp,
  "rejection_reason" text, "clinical_note" text, "version" integer NOT NULL DEFAULT 1,
  "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "prescription_order_item_quantities_check" CHECK ("prescribed_quantity" > 0 AND "authorised_quantity" >= 0 AND "dispensed_quantity" >= 0 AND "dispensed_quantity" <= "authorised_quantity" AND "authorised_quantity" <= "prescribed_quantity")
);
CREATE INDEX "idx_prescription_order_items_prescription" ON "prescription_order_items"("prescription_id");
CREATE INDEX "idx_prescription_order_items_order" ON "prescription_order_items"("order_id");

CREATE TABLE "dispensing_records" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(), "branch_id" varchar NOT NULL,
  "order_id" varchar NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
  "order_item_id" varchar NOT NULL REFERENCES "order_items"("id") ON DELETE RESTRICT,
  "prescription_id" varchar REFERENCES "prescriptions"("id") ON DELETE RESTRICT,
  "prescription_order_item_id" varchar REFERENCES "prescription_order_items"("id") ON DELETE RESTRICT,
  "reservation_id" varchar NOT NULL REFERENCES "inventory_reservations"("id") ON DELETE RESTRICT,
  "product_id" varchar NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "batch_id" varchar NOT NULL REFERENCES "stock_batches"("id") ON DELETE RESTRICT,
  "quantity" integer NOT NULL CHECK ("quantity" > 0), "dispensed_by" varchar NOT NULL,
  "counselling_completed" boolean NOT NULL DEFAULT false, "dispensing_note" text,
  "idempotency_key" varchar(128) NOT NULL UNIQUE, "correlation_id" varchar(100), "dispensed_at" timestamp NOT NULL DEFAULT now()
);

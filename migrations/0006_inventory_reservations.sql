ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'partially_cancelled';
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'fully_dispensed';

CREATE TYPE "reservation_status" AS ENUM ('active', 'partially_dispensed', 'fully_dispensed', 'partially_released', 'released', 'expired', 'cancelled');

ALTER TABLE "stock_batches" RENAME COLUMN "quantity" TO "quantity_on_hand";
ALTER TABLE "stock_batches" ADD COLUMN "quantity_reserved" integer NOT NULL DEFAULT 0;
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_reserved_nonnegative" CHECK ("quantity_reserved" >= 0);
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_reserved_within_on_hand" CHECK ("quantity_reserved" <= "quantity_on_hand");

ALTER TABLE "orders" ADD COLUMN "cancellation_reason_code" varchar(100);
ALTER TABLE "orders" ADD COLUMN "cancellation_reason" text;
ALTER TABLE "orders" ADD COLUMN "cancelled_by" varchar REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "orders" ADD COLUMN "cancelled_at" timestamp;
ALTER TABLE "orders" ADD COLUMN "cancellation_idempotency_key" varchar(128);
CREATE UNIQUE INDEX "orders_cancellation_idempotency_unique" ON "orders" ("id", "cancellation_idempotency_key") WHERE "cancellation_idempotency_key" IS NOT NULL;

CREATE TABLE "inventory_reservations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" varchar NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
  "order_item_id" varchar NOT NULL UNIQUE REFERENCES "order_items"("id") ON DELETE RESTRICT,
  "product_id" varchar NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "batch_id" varchar NOT NULL REFERENCES "stock_batches"("id") ON DELETE RESTRICT,
  "branch_id" varchar NOT NULL REFERENCES "branches"("id") ON DELETE RESTRICT,
  "quantity_reserved" integer NOT NULL,
  "quantity_dispensed" integer NOT NULL DEFAULT 0,
  "quantity_released" integer NOT NULL DEFAULT 0,
  "status" "reservation_status" NOT NULL DEFAULT 'active',
  "version" integer NOT NULL DEFAULT 1,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "inventory_reservations_quantities_valid" CHECK (
    "quantity_reserved" > 0 AND "quantity_dispensed" >= 0 AND "quantity_released" >= 0
    AND "quantity_dispensed" + "quantity_released" <= "quantity_reserved"
  )
);
CREATE INDEX "idx_inventory_reservations_order" ON "inventory_reservations" ("order_id");
CREATE INDEX "idx_inventory_reservations_batch_status" ON "inventory_reservations" ("batch_id", "status");

ALTER TABLE "stock_movements" ADD COLUMN "order_item_id" varchar REFERENCES "order_items"("id") ON DELETE RESTRICT;
ALTER TABLE "stock_movements" ADD COLUMN "reservation_id" varchar REFERENCES "inventory_reservations"("id") ON DELETE RESTRICT;
ALTER TABLE "stock_movements" ADD COLUMN "quantity_on_hand_before" integer;
ALTER TABLE "stock_movements" ADD COLUMN "quantity_on_hand_after" integer;
ALTER TABLE "stock_movements" ADD COLUMN "quantity_reserved_before" integer;
ALTER TABLE "stock_movements" ADD COLUMN "quantity_reserved_after" integer;
ALTER TABLE "stock_movements" ADD COLUMN "correlation_id" varchar(100);

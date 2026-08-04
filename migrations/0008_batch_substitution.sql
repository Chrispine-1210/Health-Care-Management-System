ALTER TABLE "inventory_reservations" DROP CONSTRAINT IF EXISTS "inventory_reservations_order_item_id_unique";
ALTER TABLE "inventory_reservations" DROP CONSTRAINT IF EXISTS "inventory_reservations_order_item_id_key";
CREATE INDEX "idx_inventory_reservations_order_item" ON "inventory_reservations"("order_item_id");

CREATE TABLE "batch_substitutions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(), "branch_id" varchar NOT NULL,
  "order_id" varchar NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
  "order_item_id" varchar NOT NULL REFERENCES "order_items"("id") ON DELETE RESTRICT,
  "original_reservation_id" varchar NOT NULL REFERENCES "inventory_reservations"("id") ON DELETE RESTRICT,
  "substitute_reservation_id" varchar NOT NULL REFERENCES "inventory_reservations"("id") ON DELETE RESTRICT,
  "original_batch_id" varchar NOT NULL REFERENCES "stock_batches"("id") ON DELETE RESTRICT,
  "substitute_batch_id" varchar NOT NULL REFERENCES "stock_batches"("id") ON DELETE RESTRICT,
  "quantity" integer NOT NULL CHECK ("quantity" > 0), "reason" text NOT NULL,
  "performed_by" varchar NOT NULL, "idempotency_key" varchar(128) NOT NULL UNIQUE,
  "correlation_id" varchar(100), "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "batch_substitution_distinct_batches" CHECK ("original_batch_id" <> "substitute_batch_id")
);
CREATE INDEX "idx_batch_substitutions_order_item" ON "batch_substitutions"("order_item_id", "created_at");

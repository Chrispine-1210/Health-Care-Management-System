CREATE TABLE "dispensing_reversals" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "dispensing_record_id" varchar NOT NULL REFERENCES "dispensing_records"("id") ON DELETE RESTRICT,
  "branch_id" varchar NOT NULL, "order_id" varchar NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
  "order_item_id" varchar NOT NULL REFERENCES "order_items"("id") ON DELETE RESTRICT,
  "reservation_id" varchar NOT NULL REFERENCES "inventory_reservations"("id") ON DELETE RESTRICT,
  "product_id" varchar NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "original_batch_id" varchar NOT NULL REFERENCES "stock_batches"("id") ON DELETE RESTRICT,
  "quarantine_batch_id" varchar NOT NULL REFERENCES "stock_batches"("id") ON DELETE RESTRICT,
  "quantity" integer NOT NULL CHECK ("quantity" > 0), "reason" text NOT NULL,
  "performed_by" varchar NOT NULL, "idempotency_key" varchar(128) NOT NULL UNIQUE,
  "correlation_id" varchar(100), "reversed_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "idx_dispensing_reversals_record" ON "dispensing_reversals"("dispensing_record_id", "reversed_at");

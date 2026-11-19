CREATE TYPE "stock_batch_status" AS ENUM ('active', 'quarantined', 'recalled', 'expired', 'damaged', 'returned', 'destroyed');
CREATE TYPE "stock_movement_type" AS ENUM ('receipt', 'reservation', 'release', 'dispense', 'adjustment', 'transfer_in', 'transfer_out', 'return', 'quarantine', 'destruction');

ALTER TABLE "stock_batches"
ADD COLUMN "status" "stock_batch_status" NOT NULL DEFAULT 'active';

CREATE TABLE "stock_movements" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" varchar NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "batch_id" varchar NOT NULL REFERENCES "stock_batches"("id") ON DELETE RESTRICT,
  "branch_id" varchar NOT NULL REFERENCES "branches"("id") ON DELETE RESTRICT,
  "order_id" varchar REFERENCES "orders"("id") ON DELETE RESTRICT,
  "movement_type" "stock_movement_type" NOT NULL,
  "quantity_delta" integer NOT NULL,
  "balance_after" integer NOT NULL,
  "reason" text NOT NULL,
  "performed_by" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "stock_movements_nonzero_delta" CHECK ("quantity_delta" <> 0),
  CONSTRAINT "stock_movements_nonnegative_balance" CHECK ("balance_after" >= 0)
);

CREATE INDEX "idx_stock_movements_batch_created" ON "stock_movements" ("batch_id", "created_at");
CREATE INDEX "idx_stock_movements_branch_created" ON "stock_movements" ("branch_id", "created_at");
CREATE INDEX "idx_stock_movements_order" ON "stock_movements" ("order_id");

CREATE OR REPLACE FUNCTION prevent_stock_movement_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'stock_movements is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_movements_append_only
BEFORE UPDATE OR DELETE ON "stock_movements"
FOR EACH ROW
EXECUTE FUNCTION prevent_stock_movement_mutation();

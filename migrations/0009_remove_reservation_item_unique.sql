-- 0008 targeted Drizzle's inferred name, while existing Neon databases created
-- this inline UNIQUE constraint using PostgreSQL's default `_key` suffix.
ALTER TABLE "inventory_reservations" DROP CONSTRAINT IF EXISTS "inventory_reservations_order_item_id_key";

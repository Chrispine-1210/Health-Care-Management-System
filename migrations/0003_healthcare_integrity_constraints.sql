ALTER TABLE "users" ADD CONSTRAINT "users_branch_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL NOT VALID;
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_product_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT NOT VALID;
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_branch_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT NOT VALID;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_fk" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE RESTRICT NOT VALID;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_reviewer_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL NOT VALID;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_fk" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT NOT VALID;
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT NOT VALID;
ALTER TABLE "orders" ADD CONSTRAINT "orders_prescription_fk" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE SET NULL NOT VALID;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE NOT VALID;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT NOT VALID;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_batch_fk" FOREIGN KEY ("batch_id") REFERENCES "stock_batches"("id") ON DELETE SET NULL NOT VALID;
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE NOT VALID;
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driver_fk" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL NOT VALID;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_fk" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE RESTRICT NOT VALID;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_practitioner_fk" FOREIGN KEY ("practitioner_id") REFERENCES "users"("id") ON DELETE SET NULL NOT VALID;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_branch_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL NOT VALID;
ALTER TABLE "content_items" ADD CONSTRAINT "content_author_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT NOT VALID;

ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_quantity_nonnegative" CHECK ("quantity" >= 0) NOT VALID;
ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_nonnegative" CHECK ("subtotal" >= 0 AND "delivery_charge" >= 0 AND "total" >= 0) NOT VALID;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_values_positive" CHECK ("quantity" > 0 AND "unit_price" >= 0 AND "subtotal" >= 0) NOT VALID;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_duration_positive" CHECK ("duration" IS NULL OR "duration" > 0) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS "order_items_order_product_batch_unique"
ON "order_items" ("order_id", "product_id", COALESCE("batch_id", ''));
CREATE INDEX IF NOT EXISTS "appointments_branch_scheduled_idx" ON "appointments" ("branch_id", "scheduled_at");
CREATE INDEX IF NOT EXISTS "deliveries_driver_status_idx" ON "deliveries" ("driver_id", "status");
CREATE INDEX IF NOT EXISTS "orders_branch_status_idx" ON "orders" ("branch_id", "status");

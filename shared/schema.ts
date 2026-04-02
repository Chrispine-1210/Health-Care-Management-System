import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['admin', 'pharmacist', 'staff', 'customer', 'driver']);
export const prescriptionStatusEnum = pgEnum('prescription_status', ['pending', 'under_review', 'approved', 'rejected', 'dispensed']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'processing', 'ready', 'in_transit', 'delivered', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'airtel_money', 'tnm_mpamba', 'card', 'bank_transfer']);
export const deliveryStatusEnum = pgEnum('delivery_status', ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published', 'archived']);

// ============================================================================
// SESSION TABLE (Required for Replit Auth)
// ============================================================================

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('customer'),
  phone: varchar("phone"),
  branchId: varchar("branch_id"),
  // Medical info for customers
  allergies: text("allergies").array(),
  chronicConditions: text("chronic_conditions").array(),
  // Driver specific
  vehicleInfo: text("vehicle_info"),
  licenseNumber: varchar("license_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  orders: many(orders),
  prescriptions: many(prescriptions),
  deliveries: many(deliveries),
  appointments: many(appointments),
}));

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// ============================================================================
// BRANCHES
// ============================================================================

export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  managerId: varchar("manager_id"),
  licenseNumber: varchar("license_number"),
  licenseExpiryDate: timestamp("license_expiry_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const branchesRelations = relations(branches, ({ many }) => ({
  staff: many(users),
  stockBatches: many(stockBatches),
  orders: many(orders),
}));

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;

// ============================================================================
// PRODUCTS
// ============================================================================

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }),
  description: text("description"),
  manufacturer: varchar("manufacturer", { length: 255 }),
  category: varchar("category", { length: 100 }),
  dosageForm: varchar("dosage_form", { length: 100 }), // tablet, capsule, syrup, etc.
  strength: varchar("strength", { length: 100 }), // e.g., "500mg"
  prescriptionRequired: boolean("prescription_required").notNull().default(false),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  storageConditions: text("storage_conditions"),
  sideEffects: text("side_effects").array(),
  contraindications: text("contraindications").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_products_sku").on(table.sku),
  index("idx_products_category").on(table.category),
]);

export const productsRelations = relations(products, ({ many }) => ({
  stockBatches: many(stockBatches),
  orderItems: many(orderItems),
}));

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// ============================================================================
// STOCK BATCHES
// ============================================================================

export const stockBatches = pgTable("stock_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  batchNumber: varchar("batch_number", { length: 100 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  expiryDate: timestamp("expiry_date").notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  supplierName: varchar("supplier_name", { length: 255 }),
  receivedAt: timestamp("received_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_stock_batches_product").on(table.productId),
  index("idx_stock_batches_branch").on(table.branchId),
  index("idx_stock_batches_expiry").on(table.expiryDate),
]);

export const stockBatchesRelations = relations(stockBatches, ({ one }) => ({
  product: one(products, {
    fields: [stockBatches.productId],
    references: [products.id],
  }),
  branch: one(branches, {
    fields: [stockBatches.branchId],
    references: [branches.id],
  }),
}));

export const insertStockBatchSchema = createInsertSchema(stockBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type StockBatch = typeof stockBatches.$inferSelect;
export type InsertStockBatch = z.infer<typeof insertStockBatchSchema>;

// ============================================================================
// PRESCRIPTIONS
// ============================================================================

export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  fileUrl: text("file_url"),
  status: prescriptionStatusEnum("status").notNull().default('pending'),
  reviewedBy: varchar("reviewed_by"),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  // Patient medical context
  patientAllergies: text("patient_allergies").array(),
  patientConditions: text("patient_conditions").array(),
  // Prescription details
  prescribedMedications: jsonb("prescribed_medications"), // Array of {productId, dosage, frequency, duration}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_prescriptions_patient").on(table.patientId),
  index("idx_prescriptions_status").on(table.status),
]);

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(users, {
    fields: [prescriptions.patientId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [prescriptions.reviewedBy],
    references: [users.id],
  }),
}));

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

// ============================================================================
// ORDERS
// ============================================================================

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  prescriptionId: varchar("prescription_id"),
  status: orderStatusEnum("status").notNull().default('pending'),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default('pending'),
  paymentMethod: paymentMethodEnum("payment_method"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).default('0'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  // Delivery details
  deliveryAddress: text("delivery_address"),
  deliveryCity: varchar("delivery_city"),
  deliveryLatitude: decimal("delivery_latitude", { precision: 10, scale: 7 }),
  deliveryLongitude: decimal("delivery_longitude", { precision: 10, scale: 7 }),
  deliveryDistance: decimal("delivery_distance", { precision: 6, scale: 2 }), // in km
  // Customer contact
  customerPhone: varchar("customer_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_orders_customer").on(table.customerId),
  index("idx_orders_branch").on(table.branchId),
  index("idx_orders_status").on(table.status),
  index("idx_orders_created").on(table.createdAt),
]);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [orders.branchId],
    references: [branches.id],
  }),
  prescription: one(prescriptions, {
    fields: [orders.prescriptionId],
    references: [prescriptions.id],
  }),
  items: many(orderItems),
  delivery: one(deliveries),
}));

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// ============================================================================
// ORDER ITEMS
// ============================================================================

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  batchId: varchar("batch_id"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  batch: one(stockBatches, {
    fields: [orderItems.batchId],
    references: [stockBatches.id],
  }),
}));

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// ============================================================================
// DELIVERIES
// ============================================================================

export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().unique(),
  driverId: varchar("driver_id"),
  status: deliveryStatusEnum("status").notNull().default('pending'),
  assignedAt: timestamp("assigned_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  proofOfDeliveryUrl: text("proof_of_delivery_url"),
  deliveryNotes: text("delivery_notes"),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_deliveries_order").on(table.orderId),
  index("idx_deliveries_driver").on(table.driverId),
  index("idx_deliveries_status").on(table.status),
]);

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
  driver: one(users, {
    fields: [deliveries.driverId],
    references: [users.id],
  }),
}));

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

// ============================================================================
// APPOINTMENTS & CONSULTATIONS
// ============================================================================

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(),
  practitionerId: varchar("practitioner_id"),
  branchId: varchar("branch_id"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").default(30), // in minutes
  type: varchar("type", { length: 50 }).notNull(), // video, phone, in-person
  status: appointmentStatusEnum("status").notNull().default('scheduled'),
  chiefComplaint: text("chief_complaint"),
  consultationNotes: text("consultation_notes"),
  prescriptionGenerated: varchar("prescription_generated"),
  videoRoomId: varchar("video_room_id"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_appointments_patient").on(table.patientId),
  index("idx_appointments_practitioner").on(table.practitionerId),
  index("idx_appointments_scheduled").on(table.scheduledAt),
]);

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(users, {
    fields: [appointments.patientId],
    references: [users.id],
  }),
  practitioner: one(users, {
    fields: [appointments.practitionerId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [appointments.branchId],
    references: [branches.id],
  }),
}));

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// ============================================================================
// CONTENT MANAGEMENT
// ============================================================================

export const contentItems = pgTable("content_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImageUrl: text("featured_image_url"),
  authorId: varchar("author_id").notNull(),
  category: varchar("category", { length: 100 }),
  tags: text("tags").array(),
  status: contentStatusEnum("status").notNull().default('draft'),
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_content_slug").on(table.slug),
  index("idx_content_status").on(table.status),
  index("idx_content_published").on(table.publishedAt),
]);

export const contentItemsRelations = relations(contentItems, ({ one }) => ({
  author: one(users, {
    fields: [contentItems.authorId],
    references: [users.id],
  }),
}));

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: varchar("entity_id"),
  changes: jsonb("changes"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_entity").on(table.entityType, table.entityId),
  index("idx_audit_logs_timestamp").on(table.timestamp),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

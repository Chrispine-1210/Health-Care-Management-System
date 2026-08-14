import {
  users,
  branches,
  products,
  stockBatches,
  stockMovements,
  inventoryReservations,
  prescriptionOrderItems,
  dispensingRecords,
  dispensingReversals,
  batchSubstitutions,
  orders,
  orderItems,
  prescriptions,
  deliveries,
  appointments,
  contentItems,
  auditLogs,
  emergencyAccessGrants,
  type User,
  type UpsertUser,
  type Branch,
  type InsertBranch,
  type Product,
  type InsertProduct,
  type StockBatch,
  type InsertStockBatch,
  type StockMovement,
  type InventoryReservation,
  type PrescriptionOrderItem,
  type DispensingRecord,
  type DispensingReversal,
  type BatchSubstitution,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Prescription,
  type InsertPrescription,
  type Delivery,
  type InsertDelivery,
  type Appointment,
  type InsertAppointment,
  type ContentItem,
  type InsertContentItem,
  type AuditLog,
  type InsertAuditLog,
  type EmergencyAccessGrant,
  type InsertEmergencyAccessGrant,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, lt, lte, gte, gt } from "drizzle-orm";
import { InsufficientStockError, InvalidDispensingError, InvalidOrderCancellationError, InvalidStockAdjustmentError } from "./storageErrors";

export interface ReleasedReservation {
  reservationId: string;
  productId: string;
  batchId: string;
  quantityReleased: number;
}

export interface OrderCancellationResult {
  order: Order;
  releasedReservations: ReleasedReservation[];
  idempotentReplay: boolean;
}
export type OrderLineInput = Omit<InsertOrderItem, 'orderId'> & { prescriptionLink?: { prescriptionId: string; prescribedQuantity: number } };
export interface DispensingResult { record: DispensingRecord; order: Order; item: OrderItem; reservation: InventoryReservation; idempotentReplay: boolean; }
export interface DispensingReversalResult { reversal: DispensingReversal; order: Order; item: OrderItem; reservation: InventoryReservation; quarantineBatch: StockBatch; idempotentReplay: boolean; }
export interface PrescriptionRevocationResult { prescription: Prescription; releasedReservations: ReleasedReservation[]; }
export interface BatchSubstitutionResult { substitution: BatchSubstitution; originalReservation: InventoryReservation; substituteReservation: InventoryReservation; idempotentReplay: boolean; }

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User>;
  getAllUsersForAdministration(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByBranch(branchId: string): Promise<User[]>;
  updateUserRole(id: string, role: string, branchId?: string): Promise<User>;
  assignUserRoleWithAudit(id: string, role: string, branchId: string | undefined, audit: InsertAuditLog): Promise<User>;

  // Branch operations
  getBranches(): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;

  // Stock Batch operations
  getStockBatches(): Promise<StockBatch[]>;
  getStockBatchesByBranch(branchId: string): Promise<StockBatch[]>;
  getStockBatchesByProduct(productId: string): Promise<StockBatch[]>;
  getLowStockBatches(threshold: number): Promise<StockBatch[]>;
  getExpiringBatches(daysThreshold: number): Promise<StockBatch[]>;
  createStockBatch(batch: InsertStockBatch): Promise<StockBatch>;
  updateStockBatch(id: string, batch: Partial<InsertStockBatch>): Promise<StockBatch>;
  createStockBatchWithAudit(batch: InsertStockBatch, audit: InsertAuditLog): Promise<StockBatch>;
  updateStockBatchWithAudit(id: string, branchId: string, batch: Partial<InsertStockBatch>, audit: InsertAuditLog): Promise<StockBatch | undefined>;
  adjustStockBatchWithAudit(id: string, branchId: string, quantityDelta: number, reason: string, audit: InsertAuditLog): Promise<StockBatch | undefined>;
  getStockMovements(filters?: { batchId?: string; branchId?: string }): Promise<StockMovement[]>;

  // Order operations
  getAllOrdersForOperations(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderForOwner(id: string, ownerId: string): Promise<Order | undefined>;
  getOrderWithinBranch(id: string, branchId: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByBranch(branchId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderWithItems(order: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]): Promise<{ order: Order; items: OrderItem[] }>;
  createOrderWithItemsAndAudit(order: InsertOrder, items: OrderLineInput[], audit: InsertAuditLog): Promise<{ order: Order; items: OrderItem[] }>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  updateOrderWithAudit(id: string, order: Partial<InsertOrder>, audit: InsertAuditLog): Promise<Order>;
  cancelOrderWithAudit(input: { orderId: string; actorId: string; reasonCode: string; reason: string; idempotencyKey: string; correlationId?: string }, audit: InsertAuditLog): Promise<OrderCancellationResult>;
  getReservationsByOrder(orderId: string): Promise<InventoryReservation[]>;
  getPrescriptionOrderItem(prescriptionId: string, orderItemId: string): Promise<PrescriptionOrderItem | undefined>;
  getPrescriptionOrderItems(prescriptionId: string): Promise<PrescriptionOrderItem[]>;
  reviewPrescriptionOrderItem(input: { prescriptionId: string; orderItemId: string; actorId: string; decision: 'approve' | 'partially_approve' | 'reject'; authorisedQuantity?: number; substitutionAllowed?: boolean; clinicalNote?: string; rejectionReason?: string }, audit: InsertAuditLog): Promise<PrescriptionOrderItem>;
  revokePrescriptionWithAudit(input: { prescriptionId: string; actorId: string; reason: string; correlationId?: string }, audit: InsertAuditLog): Promise<PrescriptionRevocationResult>;
  substituteReservationBatch(input: { orderId: string; orderItemId: string; reservationId: string; substituteBatchId: string; actorId: string; reason: string; idempotencyKey: string; correlationId?: string }, audit: InsertAuditLog): Promise<BatchSubstitutionResult>;
  dispenseOrderItem(input: { orderId: string; orderItemId: string; reservationId: string; quantity: number; actorId: string; idempotencyKey: string; counsellingCompleted: boolean; controlledMedicineAuthorized?: boolean; notes?: string; correlationId?: string }, audit: InsertAuditLog): Promise<DispensingResult>;
  reverseDispensing(input: { dispensingRecordId: string; quantity: number; actorId: string; actorBranchId?: string; reason: string; idempotencyKey: string; correlationId?: string }, audit: InsertAuditLog): Promise<DispensingReversalResult>;

  // Order Item operations
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Prescription operations
  getPrescriptions(): Promise<Prescription[]>;
  getPrescription(id: string): Promise<Prescription | undefined>;
  getPrescriptionsByPatient(patientId: string): Promise<Prescription[]>;
  getPrescriptionForPatient(id: string, patientId: string): Promise<Prescription | undefined>;
  getPendingPrescriptions(): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription>;
  reviewPrescriptionWithAudit(id: string, expectedStatus: Prescription['status'], prescription: Partial<InsertPrescription>, audit: InsertAuditLog): Promise<Prescription | undefined>;

  // Delivery operations
  getAllDeliveriesForOperations(): Promise<Delivery[]>;
  getDelivery(id: string): Promise<Delivery | undefined>;
  getAssignedDelivery(id: string, driverId: string): Promise<Delivery | undefined>;
  getDeliveriesByDriver(driverId: string): Promise<Delivery[]>;
  getActiveDeliveries(): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery>;

  // Appointment operations
  getAllAppointmentsForOperations(): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentForPatient(id: string, patientId: string): Promise<Appointment | undefined>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  getAppointmentsByPractitioner(practitionerId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  updateAppointmentWithAudit(id: string, appointment: Partial<InsertAppointment>, audit: InsertAuditLog): Promise<Appointment>;

  // Content operations
  getContentItems(status?: string): Promise<ContentItem[]>;
  getContentItem(id: string): Promise<ContentItem | undefined>;
  getContentItemBySlug(slug: string): Promise<ContentItem | undefined>;
  createContentItem(content: InsertContentItem): Promise<ContentItem>;
  updateContentItem(id: string, content: Partial<InsertContentItem>): Promise<ContentItem>;

  // Audit Log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  createEmergencyAccessGrant(grant: InsertEmergencyAccessGrant): Promise<EmergencyAccessGrant>;
  createEmergencyAccessGrantWithAudit(grant: InsertEmergencyAccessGrant, audit: InsertAuditLog): Promise<EmergencyAccessGrant>;
  getEmergencyAccessGrant(id: string): Promise<EmergencyAccessGrant | undefined>;
  reviewEmergencyAccessGrant(id: string, changes: Partial<InsertEmergencyAccessGrant>): Promise<EmergencyAccessGrant | undefined>;
  reviewEmergencyAccessGrantWithAudit(id: string, changes: Partial<InsertEmergencyAccessGrant>, audit: InsertAuditLog): Promise<EmergencyAccessGrant | undefined>;

  // Analytics/Stats
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async getAllUsersForAdministration(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.email);
  }

  async getUsersByBranch(branchId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.branchId, branchId));
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string, branchId?: string): Promise<User> {
    const updateData: any = { role: role as any, updatedAt: new Date() };
    if (branchId) {
      updateData.branchId = branchId;
    }
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async assignUserRoleWithAudit(id: string, role: string, branchId: string | undefined, audit: InsertAuditLog): Promise<User> {
    return db.transaction(async (tx) => {
      const updateData: any = { role, updatedAt: new Date() };
      if (branchId !== undefined) updateData.branchId = branchId;
      const [user] = await tx.update(users).set(updateData).where(eq(users.id, id)).returning();
      if (!user) throw new Error('User not found');
      await tx.insert(auditLogs).values(audit);
      return user;
    });
  }

  // Branch operations
  async getBranches(): Promise<Branch[]> {
    return await db.select().from(branches).orderBy(branches.name);
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async createBranch(branchData: InsertBranch): Promise<Branch> {
    const [branch] = await db.insert(branches).values(branchData).returning();
    return branch;
  }

  async updateBranch(id: string, branchData: Partial<InsertBranch>): Promise<Branch> {
    const [branch] = await db
      .update(branches)
      .set({ ...branchData, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();
    return branch;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(products.name);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.name)
      .limit(8);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  // Stock Batch operations
  async getStockBatches(): Promise<StockBatch[]> {
    return await db.select().from(stockBatches).orderBy(desc(stockBatches.expiryDate));
  }

  async getStockBatchesByBranch(branchId: string): Promise<StockBatch[]> {
    return await db.select().from(stockBatches).where(eq(stockBatches.branchId, branchId));
  }

  async getStockBatchesByProduct(productId: string): Promise<StockBatch[]> {
    return await db.select().from(stockBatches).where(eq(stockBatches.productId, productId));
  }

  async getLowStockBatches(threshold: number = 10): Promise<StockBatch[]> {
    return await db.select().from(stockBatches).where(lte(sql`${stockBatches.quantityOnHand} - ${stockBatches.quantityReserved}`, threshold));
  }

  async getExpiringBatches(daysThreshold: number = 30): Promise<StockBatch[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);
    
    return await db
      .select()
      .from(stockBatches)
      .where(
        and(
          lte(stockBatches.expiryDate, futureDate),
          gte(stockBatches.expiryDate, new Date())
        )
      );
  }

  async createStockBatch(batchData: InsertStockBatch): Promise<StockBatch> {
    const [batch] = await db.insert(stockBatches).values(batchData).returning();
    return batch;
  }

  async updateStockBatch(id: string, batchData: Partial<InsertStockBatch>): Promise<StockBatch> {
    const [batch] = await db
      .update(stockBatches)
      .set({ ...batchData, updatedAt: new Date() })
      .where(eq(stockBatches.id, id))
      .returning();
    return batch;
  }

  // Order operations
  async getAllOrdersForOperations(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByBranch(branchId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.branchId, branchId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async createStockBatchWithAudit(batchData: InsertStockBatch, audit: InsertAuditLog): Promise<StockBatch> {
    return db.transaction(async (tx) => {
      const [batch] = await tx.insert(stockBatches).values(batchData).returning();
      if (batch.quantityOnHand > 0) {
        await tx.insert(stockMovements).values({
          productId: batch.productId,
          batchId: batch.id,
          branchId: batch.branchId,
          movementType: 'receipt',
          quantityDelta: batch.quantityOnHand,
          balanceAfter: batch.quantityOnHand,
          quantityOnHandBefore: 0,
          quantityOnHandAfter: batch.quantityOnHand,
          quantityReservedBefore: 0,
          quantityReservedAfter: 0,
          reason: 'Initial batch receipt',
          performedBy: audit.userId,
        });
      }
      await tx.insert(auditLogs).values({ ...audit, entityId: audit.entityId ?? batch.id });
      return batch;
    });
  }

  async updateStockBatchWithAudit(id: string, branchId: string, batchData: Partial<InsertStockBatch>, audit: InsertAuditLog): Promise<StockBatch | undefined> {
    return db.transaction(async (tx) => {
      const { quantityOnHand: _quantityOnHand, quantityReserved: _quantityReserved, branchId: _branchId, ...allowedChanges } = batchData;
      const [batch] = await tx.update(stockBatches)
        .set({ ...allowedChanges, updatedAt: new Date() })
        .where(and(eq(stockBatches.id, id), eq(stockBatches.branchId, branchId)))
        .returning();
      if (!batch) return undefined;
      await tx.insert(auditLogs).values({ ...audit, entityId: audit.entityId ?? batch.id });
      return batch;
    });
  }

  async adjustStockBatchWithAudit(id: string, branchId: string, quantityDelta: number, reason: string, audit: InsertAuditLog): Promise<StockBatch | undefined> {
    if (!Number.isInteger(quantityDelta) || quantityDelta === 0) throw new InvalidStockAdjustmentError('Quantity delta must be a non-zero integer');
    return db.transaction(async (tx) => {
      const [current] = await tx.select().from(stockBatches).where(and(eq(stockBatches.id, id), eq(stockBatches.branchId, branchId)));
      if (!current) return undefined;
      if (current.quantityOnHand + quantityDelta < current.quantityReserved) throw new InvalidStockAdjustmentError();
      const balanceCondition = quantityDelta < 0 ? gte(sql`${stockBatches.quantityOnHand} - ${stockBatches.quantityReserved}`, Math.abs(quantityDelta)) : undefined;
      const [batch] = await tx.update(stockBatches)
        .set({ quantityOnHand: sql`${stockBatches.quantityOnHand} + ${quantityDelta}`, updatedAt: new Date() })
        .where(and(eq(stockBatches.id, id), eq(stockBatches.branchId, branchId), balanceCondition))
        .returning();
      if (!batch) throw new InvalidStockAdjustmentError('Concurrent stock change prevented this adjustment');
      await tx.insert(stockMovements).values({
        productId: batch.productId,
        batchId: batch.id,
        branchId: batch.branchId,
        movementType: 'adjustment',
        quantityDelta,
        balanceAfter: batch.quantityOnHand - batch.quantityReserved,
        quantityOnHandBefore: current.quantityOnHand,
        quantityOnHandAfter: batch.quantityOnHand,
        quantityReservedBefore: current.quantityReserved,
        quantityReservedAfter: batch.quantityReserved,
        reason,
        performedBy: audit.userId,
      });
      await tx.insert(auditLogs).values({ ...audit, entityId: audit.entityId ?? batch.id });
      return batch;
    });
  }

  async getStockMovements(filters: { batchId?: string; branchId?: string } = {}): Promise<StockMovement[]> {
    const conditions = [
      ...(filters.batchId ? [eq(stockMovements.batchId, filters.batchId)] : []),
      ...(filters.branchId ? [eq(stockMovements.branchId, filters.branchId)] : []),
    ];
    return conditions.length
      ? await db.select().from(stockMovements).where(and(...conditions)).orderBy(desc(stockMovements.createdAt))
      : await db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    if (!sku) return undefined;
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product;
  }

  async getOrderForOwner(id: string, ownerId: string): Promise<Order | undefined> {
    if (!id || !ownerId) return undefined;
    const [order] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.customerId, ownerId)));
    return order;
  }

  async getOrderWithinBranch(id: string, branchId: string): Promise<Order | undefined> {
    if (!id || !branchId) return undefined;
    const [order] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.branchId, branchId)));
    return order;
  }

  async createOrderWithItems(orderData: InsertOrder, itemData: Omit<InsertOrderItem, 'orderId'>[]): Promise<{ order: Order; items: OrderItem[] }> {
    return db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values(orderData).returning();
      const createdItems = itemData.length
        ? await tx.insert(orderItems).values(itemData.map((item) => ({ ...item, orderId: order.id }))).returning()
        : [];
      return { order, items: createdItems };
    });
  }

  async createOrderWithItemsAndAudit(orderData: InsertOrder, itemData: OrderLineInput[], audit: InsertAuditLog): Promise<{ order: Order; items: OrderItem[] }> {
    return db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values(orderData).returning();
      const createdItems: OrderItem[] = [];
      for (const item of itemData) {
        const { prescriptionLink, ...stockItem } = item;
        let remaining = item.quantity;
        const candidates = await tx.select().from(stockBatches).where(and(
          eq(stockBatches.productId, item.productId),
          eq(stockBatches.branchId, order.branchId),
          eq(stockBatches.status, 'active'),
          gt(stockBatches.expiryDate, new Date()),
          gt(sql`${stockBatches.quantityOnHand} - ${stockBatches.quantityReserved}`, 0),
          ...(item.batchId ? [eq(stockBatches.id, item.batchId)] : []),
        )).orderBy(stockBatches.expiryDate);

        for (const batch of candidates) {
          if (remaining === 0) break;
          const reserved = Math.min(batch.quantityOnHand - batch.quantityReserved, remaining);
          const [updatedBatch] = await tx.update(stockBatches)
            .set({ quantityReserved: sql`${stockBatches.quantityReserved} + ${reserved}`, updatedAt: new Date() })
            .where(and(
              eq(stockBatches.id, batch.id),
              eq(stockBatches.status, 'active'),
              gt(stockBatches.expiryDate, new Date()),
              gte(sql`${stockBatches.quantityOnHand} - ${stockBatches.quantityReserved}`, reserved),
            ))
            .returning();
          if (!updatedBatch) continue;

          const [createdItem] = await tx.insert(orderItems).values({
            ...stockItem,
            batchId: batch.id,
            orderId: order.id,
            quantity: reserved,
            subtotal: (Number(item.unitPrice) * reserved).toFixed(2),
          }).returning();
          createdItems.push(createdItem);
          if (prescriptionLink) {
            await tx.insert(prescriptionOrderItems).values({
              branchId: order.branchId, prescriptionId: prescriptionLink.prescriptionId,
              orderId: order.id, orderItemId: createdItem.id, productId: item.productId,
              prescribedQuantity: Math.min(prescriptionLink.prescribedQuantity, reserved),
            });
          }
          const [reservation] = await tx.insert(inventoryReservations).values({
            orderId: order.id,
            orderItemId: createdItem.id,
            productId: item.productId,
            batchId: batch.id,
            branchId: order.branchId,
            quantityReserved: reserved,
          }).returning();
          await tx.insert(stockMovements).values({
            productId: item.productId,
            batchId: batch.id,
            branchId: order.branchId,
            orderId: order.id,
            orderItemId: createdItem.id,
            reservationId: reservation.id,
            movementType: 'reservation',
            quantityDelta: -reserved,
            balanceAfter: updatedBatch.quantityOnHand - updatedBatch.quantityReserved,
            quantityOnHandBefore: batch.quantityOnHand,
            quantityOnHandAfter: updatedBatch.quantityOnHand,
            quantityReservedBefore: batch.quantityReserved,
            quantityReservedAfter: updatedBatch.quantityReserved,
            reason: 'Reserved for customer order',
            performedBy: audit.userId,
          });
          remaining -= reserved;
        }

        if (remaining > 0) throw new InsufficientStockError(item.productId);
      }
      await tx.insert(auditLogs).values({ ...audit, entityId: audit.entityId ?? order.id });
      return { order, items: createdItems };
    });
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ ...orderData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderWithAudit(id: string, orderData: Partial<InsertOrder>, audit: InsertAuditLog): Promise<Order> {
    return db.transaction(async (tx) => {
      const [order] = await tx.update(orders).set({ ...orderData, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
      if (!order) throw new Error('Order not found');
      await tx.insert(auditLogs).values(audit);
      return order;
    });
  }

  async getReservationsByOrder(orderId: string): Promise<InventoryReservation[]> {
    return db.select().from(inventoryReservations).where(eq(inventoryReservations.orderId, orderId));
  }

  async getPrescriptionOrderItem(prescriptionId: string, orderItemId: string): Promise<PrescriptionOrderItem | undefined> {
    const [link] = await db.select().from(prescriptionOrderItems).where(and(eq(prescriptionOrderItems.prescriptionId, prescriptionId), eq(prescriptionOrderItems.orderItemId, orderItemId)));
    return link;
  }

  async getPrescriptionOrderItems(prescriptionId: string): Promise<PrescriptionOrderItem[]> {
    return db.select().from(prescriptionOrderItems).where(eq(prescriptionOrderItems.prescriptionId, prescriptionId));
  }

  async reviewPrescriptionOrderItem(input: { prescriptionId: string; orderItemId: string; actorId: string; decision: 'approve' | 'partially_approve' | 'reject'; authorisedQuantity?: number; substitutionAllowed?: boolean; clinicalNote?: string; rejectionReason?: string }, audit: InsertAuditLog): Promise<PrescriptionOrderItem> {
    return db.transaction(async (tx) => {
      const [prescription] = await tx.select().from(prescriptions).where(eq(prescriptions.id, input.prescriptionId)).for('update');
      const [link] = await tx.select().from(prescriptionOrderItems).where(and(eq(prescriptionOrderItems.prescriptionId, input.prescriptionId), eq(prescriptionOrderItems.orderItemId, input.orderItemId))).for('update');
      if (!prescription || !link) throw new InvalidDispensingError('NOT_FOUND', 'Prescription linkage not found');
      if (prescription.revokedAt || prescription.status === 'revoked' || prescription.status === 'cancelled' || (prescription.expiresAt && prescription.expiresAt <= new Date())) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Prescription is expired, revoked, or cancelled');
      if (!['pending', 'under_review', 'approved', 'partially_approved'].includes(link.approvalStatus)) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Prescription item cannot be reviewed from its current state');
      const authorisedQuantity = input.decision === 'reject' ? 0 : input.authorisedQuantity ?? 0;
      if (authorisedQuantity <= 0 || authorisedQuantity > link.prescribedQuantity) {
        if (input.decision !== 'reject') throw new InvalidDispensingError('NOT_ELIGIBLE', 'Authorised quantity exceeds the prescribed quantity or is invalid');
      }
      const approvalStatus = input.decision === 'reject' ? 'rejected' : input.decision === 'partially_approve' ? 'partially_approved' : 'approved';
      const [updated] = await tx.update(prescriptionOrderItems).set({
        authorisedQuantity, approvalStatus, substitutionAllowed: input.substitutionAllowed ?? false,
        reviewedBy: input.actorId, reviewedAt: new Date(), clinicalNote: input.clinicalNote,
        rejectionReason: input.rejectionReason, version: link.version + 1, updatedAt: new Date(),
      }).where(and(eq(prescriptionOrderItems.id, link.id), eq(prescriptionOrderItems.version, link.version))).returning();
      if (!updated) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Concurrent prescription review prevented this decision');
      await tx.update(prescriptions).set({ status: approvalStatus === 'rejected' ? 'rejected' : 'approved', reviewedBy: input.actorId, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(prescriptions.id, prescription.id));
      await tx.insert(auditLogs).values({ ...audit, entityId: link.id });
      return updated;
    });
  }

  async revokePrescriptionWithAudit(input: { prescriptionId: string; actorId: string; reason: string; correlationId?: string }, audit: InsertAuditLog): Promise<PrescriptionRevocationResult> {
    return db.transaction(async (tx) => {
      const linkCandidates = await tx.select().from(prescriptionOrderItems).where(eq(prescriptionOrderItems.prescriptionId, input.prescriptionId));
      const orderIds = [...new Set(linkCandidates.map((link) => link.orderId))].sort();
      for (const orderId of orderIds) await tx.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).for('update');
      const itemIds = [...new Set(linkCandidates.map((link) => link.orderItemId))].sort();
      for (const itemId of itemIds) await tx.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.id, itemId)).for('update');
      const links = await tx.select().from(prescriptionOrderItems).where(eq(prescriptionOrderItems.prescriptionId, input.prescriptionId)).orderBy(prescriptionOrderItems.orderItemId).for('update');
      const [prescription] = await tx.select().from(prescriptions).where(eq(prescriptions.id, input.prescriptionId)).for('update');
      if (!prescription) throw new InvalidDispensingError('NOT_FOUND', 'Prescription not found');
      if (prescription.status === 'fully_dispensed' || prescription.status === 'dispensed') throw new InvalidDispensingError('NOT_ELIGIBLE', 'A fully dispensed prescription cannot be revoked');
      if (prescription.status === 'revoked') return { prescription, releasedReservations: [] };
      if (prescription.status === 'cancelled') throw new InvalidDispensingError('NOT_ELIGIBLE', 'A cancelled prescription cannot be revoked');

      const releasedReservations: ReleasedReservation[] = [];
      for (const link of links) {
        const [item] = await tx.select().from(orderItems).where(eq(orderItems.id, link.orderItemId));
        const [reservation] = await tx.select().from(inventoryReservations).where(eq(inventoryReservations.orderItemId, link.orderItemId)).for('update');
        if (!item || !reservation) continue;
        const releasable = Math.max(0, reservation.quantityReserved - reservation.quantityDispensed - reservation.quantityReleased);
        if (releasable > 0) {
          const [batch] = await tx.select().from(stockBatches).where(eq(stockBatches.id, reservation.batchId)).for('update');
          if (!batch || batch.quantityReserved < releasable) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Reservation and batch balances are inconsistent');
          const [updatedBatch] = await tx.update(stockBatches).set({ quantityReserved: sql`${stockBatches.quantityReserved} - ${releasable}`, updatedAt: new Date() }).where(and(eq(stockBatches.id, batch.id), gte(stockBatches.quantityReserved, releasable))).returning();
          if (!updatedBatch) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Concurrent stock mutation prevented prescription revocation');
          const [updatedReservation] = await tx.update(inventoryReservations).set({ quantityReleased: reservation.quantityReleased + releasable, status: reservation.quantityDispensed > 0 ? 'partially_released' : 'released', version: reservation.version + 1, updatedAt: new Date() }).where(and(eq(inventoryReservations.id, reservation.id), eq(inventoryReservations.version, reservation.version))).returning();
          if (!updatedReservation) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Concurrent reservation mutation prevented prescription revocation');
          await tx.insert(stockMovements).values({ productId: reservation.productId, batchId: reservation.batchId, branchId: reservation.branchId, orderId: reservation.orderId, orderItemId: reservation.orderItemId, reservationId: reservation.id, movementType: 'release', quantityDelta: releasable, balanceAfter: updatedBatch.quantityOnHand - updatedBatch.quantityReserved, quantityOnHandBefore: batch.quantityOnHand, quantityOnHandAfter: batch.quantityOnHand, quantityReservedBefore: batch.quantityReserved, quantityReservedAfter: updatedBatch.quantityReserved, reason: input.reason, performedBy: input.actorId, correlationId: input.correlationId });
          releasedReservations.push({ reservationId: reservation.id, productId: reservation.productId, batchId: reservation.batchId, quantityReleased: releasable });
        }
        await tx.update(orderItems).set({ status: 'cancelled' }).where(eq(orderItems.id, item.id));
        await tx.update(prescriptionOrderItems).set({ approvalStatus: 'revoked', version: link.version + 1, updatedAt: new Date() }).where(and(eq(prescriptionOrderItems.id, link.id), eq(prescriptionOrderItems.version, link.version)));
      }
      for (const orderId of orderIds) {
        const affectedItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        const allCancelled = affectedItems.length > 0 && affectedItems.every((item) => item.status === 'cancelled');
        const hasDispensed = affectedItems.some((item) => item.quantityDispensed > 0);
        if (allCancelled) {
          await tx.update(orders).set({ status: hasDispensed ? 'partially_cancelled' : 'cancelled', updatedAt: new Date() }).where(eq(orders.id, orderId));
        } else if (affectedItems.some((item) => item.status === 'cancelled')) {
          await tx.update(orders).set({ status: 'partially_cancelled', updatedAt: new Date() }).where(eq(orders.id, orderId));
        }
      }
      const [revoked] = await tx.update(prescriptions).set({ status: 'revoked', revokedAt: new Date(), revokedBy: input.actorId, revocationReason: input.reason, updatedAt: new Date() }).where(eq(prescriptions.id, prescription.id)).returning();
      await tx.insert(auditLogs).values({
        ...audit,
        entityId: prescription.id,
        changes: { ...(audit.changes as Record<string, unknown> | null ?? {}), releasedReservations },
      });
      return { prescription: revoked, releasedReservations };
    });
  }

  async substituteReservationBatch(input: { orderId: string; orderItemId: string; reservationId: string; substituteBatchId: string; actorId: string; reason: string; idempotencyKey: string; correlationId?: string }, audit: InsertAuditLog): Promise<BatchSubstitutionResult> {
    return db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId)).for('update');
      if (!order) throw new InvalidDispensingError('NOT_FOUND', 'Order not found');
      const [existing] = await tx.select().from(batchSubstitutions).where(eq(batchSubstitutions.idempotencyKey, input.idempotencyKey));
      if (existing) {
        if (existing.orderId !== input.orderId || existing.orderItemId !== input.orderItemId || existing.substituteBatchId !== input.substituteBatchId) throw new InvalidDispensingError('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for another batch substitution');
        const [originalReservation] = await tx.select().from(inventoryReservations).where(eq(inventoryReservations.id, existing.originalReservationId));
        const [substituteReservation] = await tx.select().from(inventoryReservations).where(eq(inventoryReservations.id, existing.substituteReservationId));
        return { substitution: existing, originalReservation, substituteReservation, idempotentReplay: true };
      }
      if (['cancelled', 'partially_cancelled', 'fully_dispensed', 'delivered'].includes(order.status)) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Order cannot change reservation batches from its current state');
      const [item] = await tx.select().from(orderItems).where(and(eq(orderItems.id, input.orderItemId), eq(orderItems.orderId, order.id))).for('update');
      await tx.select({ id: prescriptionOrderItems.id }).from(prescriptionOrderItems).where(eq(prescriptionOrderItems.orderItemId, input.orderItemId)).for('update');
      const [reservation] = await tx.select().from(inventoryReservations).where(and(eq(inventoryReservations.id, input.reservationId), eq(inventoryReservations.orderItemId, input.orderItemId))).for('update');
      if (!item || !reservation) throw new InvalidDispensingError('NOT_FOUND', 'Order item reservation not found');
      if (!['active', 'partially_dispensed'].includes(reservation.status)) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Reservation cannot be substituted from its current state');
      if (reservation.batchId === input.substituteBatchId) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Substitute batch must differ from the current batch');
      const remaining = reservation.quantityReserved - reservation.quantityDispensed - reservation.quantityReleased;
      if (remaining <= 0) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Reservation has no remaining quantity to substitute');
      const batchIds = [reservation.batchId, input.substituteBatchId].sort();
      const lockedBatches = [];
      for (const batchId of batchIds) {
        const [batch] = await tx.select().from(stockBatches).where(eq(stockBatches.id, batchId)).for('update');
        if (batch) lockedBatches.push(batch);
      }
      const originalBatch = lockedBatches.find((batch) => batch.id === reservation.batchId);
      const substituteBatch = lockedBatches.find((batch) => batch.id === input.substituteBatchId);
      if (!originalBatch || !substituteBatch) throw new InvalidDispensingError('NOT_FOUND', 'Stock batch not found');
      if (substituteBatch.productId !== item.productId || substituteBatch.branchId !== order.branchId) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Substitute batch must contain the same product in the same branch');
      if (substituteBatch.status !== 'active' || substituteBatch.expiryDate <= new Date()) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Substitute batch is expired or blocked');
      if (originalBatch.quantityReserved < remaining || substituteBatch.quantityOnHand - substituteBatch.quantityReserved < remaining) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Substitute batch does not have sufficient available stock');
      const [updatedOriginalBatch] = await tx.update(stockBatches).set({ quantityReserved: sql`${stockBatches.quantityReserved} - ${remaining}`, updatedAt: new Date() }).where(and(eq(stockBatches.id, originalBatch.id), gte(stockBatches.quantityReserved, remaining))).returning();
      const [updatedSubstituteBatch] = await tx.update(stockBatches).set({ quantityReserved: sql`${stockBatches.quantityReserved} + ${remaining}`, updatedAt: new Date() }).where(and(eq(stockBatches.id, substituteBatch.id), eq(stockBatches.status, 'active'), gt(stockBatches.expiryDate, new Date()), gte(sql`${stockBatches.quantityOnHand} - ${stockBatches.quantityReserved}`, remaining))).returning();
      if (!updatedOriginalBatch || !updatedSubstituteBatch) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Concurrent stock mutation prevented batch substitution');
      const [updatedOriginalReservation] = await tx.update(inventoryReservations).set({ quantityReleased: reservation.quantityReleased + remaining, status: reservation.quantityDispensed > 0 ? 'partially_released' : 'released', version: reservation.version + 1, updatedAt: new Date() }).where(and(eq(inventoryReservations.id, reservation.id), eq(inventoryReservations.version, reservation.version))).returning();
      if (!updatedOriginalReservation) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Concurrent reservation mutation prevented batch substitution');
      const [substituteReservation] = await tx.insert(inventoryReservations).values({ orderId: order.id, orderItemId: item.id, productId: item.productId, batchId: substituteBatch.id, branchId: order.branchId, quantityReserved: remaining }).returning();
      await tx.update(orderItems).set({ batchId: substituteBatch.id }).where(eq(orderItems.id, item.id));
      await tx.insert(stockMovements).values([
        { productId: item.productId, batchId: originalBatch.id, branchId: order.branchId, orderId: order.id, orderItemId: item.id, reservationId: reservation.id, movementType: 'release', quantityDelta: remaining, balanceAfter: updatedOriginalBatch.quantityOnHand - updatedOriginalBatch.quantityReserved, quantityOnHandBefore: originalBatch.quantityOnHand, quantityOnHandAfter: updatedOriginalBatch.quantityOnHand, quantityReservedBefore: originalBatch.quantityReserved, quantityReservedAfter: updatedOriginalBatch.quantityReserved, reason: input.reason, performedBy: input.actorId, correlationId: input.correlationId },
        { productId: item.productId, batchId: substituteBatch.id, branchId: order.branchId, orderId: order.id, orderItemId: item.id, reservationId: substituteReservation.id, movementType: 'reservation', quantityDelta: -remaining, balanceAfter: updatedSubstituteBatch.quantityOnHand - updatedSubstituteBatch.quantityReserved, quantityOnHandBefore: substituteBatch.quantityOnHand, quantityOnHandAfter: updatedSubstituteBatch.quantityOnHand, quantityReservedBefore: substituteBatch.quantityReserved, quantityReservedAfter: updatedSubstituteBatch.quantityReserved, reason: input.reason, performedBy: input.actorId, correlationId: input.correlationId },
      ]);
      const [substitution] = await tx.insert(batchSubstitutions).values({ branchId: order.branchId, orderId: order.id, orderItemId: item.id, originalReservationId: reservation.id, substituteReservationId: substituteReservation.id, originalBatchId: originalBatch.id, substituteBatchId: substituteBatch.id, quantity: remaining, reason: input.reason, performedBy: input.actorId, idempotencyKey: input.idempotencyKey, correlationId: input.correlationId }).returning();
      await tx.insert(auditLogs).values({ ...audit, entityId: substitution.id, changes: { ...(audit.changes as Record<string, unknown> | null ?? {}), quantity: remaining, originalBatchId: originalBatch.id, substituteBatchId: substituteBatch.id, originalReservationId: reservation.id, substituteReservationId: substituteReservation.id } });
      return { substitution, originalReservation: updatedOriginalReservation, substituteReservation, idempotentReplay: false };
    });
  }

  async dispenseOrderItem(input: { orderId: string; orderItemId: string; reservationId: string; quantity: number; actorId: string; idempotencyKey: string; counsellingCompleted: boolean; controlledMedicineAuthorized?: boolean; notes?: string; correlationId?: string }, audit: InsertAuditLog): Promise<DispensingResult> {
    return db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId)).for('update');
      if (!order) throw new InvalidDispensingError('NOT_FOUND', 'Order not found');
      const [existing] = await tx.select().from(dispensingRecords).where(eq(dispensingRecords.idempotencyKey, input.idempotencyKey));
      if (existing) {
        if (existing.orderId !== input.orderId || existing.orderItemId !== input.orderItemId || existing.quantity !== input.quantity) throw new InvalidDispensingError('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for another dispensing request');
        const [item] = await tx.select().from(orderItems).where(eq(orderItems.id, existing.orderItemId));
        const [reservation] = await tx.select().from(inventoryReservations).where(eq(inventoryReservations.id, existing.reservationId));
        return { record: existing, order, item, reservation, idempotentReplay: true };
      }
      if (['cancelled', 'partially_cancelled', 'fully_dispensed', 'delivered'].includes(order.status)) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Order cannot be dispensed from its current state');
      const [item] = await tx.select().from(orderItems).where(and(eq(orderItems.id, input.orderItemId), eq(orderItems.orderId, order.id))).for('update');
      const [link] = await tx.select().from(prescriptionOrderItems).where(eq(prescriptionOrderItems.orderItemId, input.orderItemId)).for('update');
      const [linkedPrescription] = link ? await tx.select().from(prescriptions).where(eq(prescriptions.id, link.prescriptionId)).for('update') : [];
      const [reservation] = await tx.select().from(inventoryReservations).where(and(eq(inventoryReservations.id, input.reservationId), eq(inventoryReservations.orderItemId, input.orderItemId))).for('update');
      if (!item || !reservation) throw new InvalidDispensingError('NOT_FOUND', 'Order item reservation not found');
      const [batch] = await tx.select().from(stockBatches).where(eq(stockBatches.id, reservation.batchId)).for('update');
      const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
      if (!batch || !product) throw new InvalidDispensingError('NOT_FOUND', 'Inventory data not found');
      if (product.controlledMedicine && !input.controlledMedicineAuthorized) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Controlled-medicine dispensing authorization is required');
      const remainingReserved = reservation.quantityReserved - reservation.quantityDispensed - reservation.quantityReleased;
      if (!['active', 'partially_dispensed'].includes(reservation.status) || input.quantity <= 0 || input.quantity > remainingReserved || input.quantity > batch.quantityOnHand || input.quantity > batch.quantityReserved) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Requested quantity exceeds eligible reserved stock');
      if (batch.status !== 'active' || batch.expiryDate <= new Date()) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Stock batch is expired or blocked');
      const requiresApproval = product.prescriptionRequirement !== 'none' || product.prescriptionRequired || product.requiresPharmacistApproval;
      if (requiresApproval) {
        if (!link || !['approved', 'partially_approved'].includes(link.approvalStatus)) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Approved prescription item linkage is required');
        if (!linkedPrescription || linkedPrescription.revokedAt || ['revoked', 'cancelled', 'expired', 'rejected'].includes(linkedPrescription.status) || (linkedPrescription.expiresAt && linkedPrescription.expiresAt <= new Date())) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Prescription is not valid for dispensing');
        if (input.quantity > link.authorisedQuantity - link.dispensedQuantity) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Requested quantity exceeds remaining prescription authorisation');
      }
      const [updatedBatch] = await tx.update(stockBatches).set({ quantityOnHand: sql`${stockBatches.quantityOnHand} - ${input.quantity}`, quantityReserved: sql`${stockBatches.quantityReserved} - ${input.quantity}`, updatedAt: new Date() }).where(and(eq(stockBatches.id, batch.id), gte(stockBatches.quantityOnHand, input.quantity), gte(stockBatches.quantityReserved, input.quantity))).returning();
      if (!updatedBatch) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Concurrent stock mutation prevented dispensing');
      const nextDispensed = reservation.quantityDispensed + input.quantity;
      const reservationStatus = nextDispensed + reservation.quantityReleased === reservation.quantityReserved ? 'fully_dispensed' : 'partially_dispensed';
      const [updatedReservation] = await tx.update(inventoryReservations).set({ quantityDispensed: nextDispensed, status: reservationStatus, version: reservation.version + 1, updatedAt: new Date() }).where(and(eq(inventoryReservations.id, reservation.id), eq(inventoryReservations.version, reservation.version))).returning();
      if (!updatedReservation) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Concurrent reservation mutation prevented dispensing');
      const itemDispensed = item.quantityDispensed + input.quantity;
      const [updatedItem] = await tx.update(orderItems).set({ quantityDispensed: itemDispensed, status: itemDispensed === item.quantity ? 'fulfilled' : 'partially_fulfilled' }).where(eq(orderItems.id, item.id)).returning();
      let updatedLink = link;
      if (link) {
        const linkDispensed = link.dispensedQuantity + input.quantity;
        [updatedLink] = await tx.update(prescriptionOrderItems).set({ dispensedQuantity: linkDispensed, approvalStatus: linkDispensed === link.authorisedQuantity ? 'fully_consumed' : link.approvalStatus, version: link.version + 1, updatedAt: new Date() }).where(and(eq(prescriptionOrderItems.id, link.id), eq(prescriptionOrderItems.version, link.version))).returning();
        await tx.update(prescriptions).set({ status: updatedLink.approvalStatus === 'fully_consumed' ? 'fully_dispensed' : 'partially_dispensed', updatedAt: new Date() }).where(eq(prescriptions.id, link.prescriptionId));
      }
      const unfinished = await tx.select({ id: orderItems.id }).from(orderItems).where(and(eq(orderItems.orderId, order.id), sql`${orderItems.status} <> 'fulfilled'`));
      const [updatedOrder] = unfinished.length === 0 ? await tx.update(orders).set({ status: 'fully_dispensed', updatedAt: new Date() }).where(eq(orders.id, order.id)).returning() : [order];
      const [record] = await tx.insert(dispensingRecords).values({ branchId: order.branchId, orderId: order.id, orderItemId: item.id, prescriptionId: link?.prescriptionId, prescriptionOrderItemId: link?.id, reservationId: reservation.id, productId: item.productId, batchId: batch.id, quantity: input.quantity, dispensedBy: input.actorId, counsellingCompleted: input.counsellingCompleted, dispensingNote: input.notes, idempotencyKey: input.idempotencyKey, correlationId: input.correlationId }).returning();
      await tx.insert(stockMovements).values({ productId: item.productId, batchId: batch.id, branchId: order.branchId, orderId: order.id, orderItemId: item.id, reservationId: reservation.id, movementType: 'dispense', quantityDelta: -input.quantity, balanceAfter: updatedBatch.quantityOnHand - updatedBatch.quantityReserved, quantityOnHandBefore: batch.quantityOnHand, quantityOnHandAfter: updatedBatch.quantityOnHand, quantityReservedBefore: batch.quantityReserved, quantityReservedAfter: updatedBatch.quantityReserved, reason: 'Dispensed against reserved customer order', performedBy: input.actorId, correlationId: input.correlationId });
      await tx.insert(auditLogs).values({ ...audit, entityId: record.id });
      return { record, order: updatedOrder, item: updatedItem, reservation: updatedReservation, idempotentReplay: false };
    });
  }

  async reverseDispensing(input: { dispensingRecordId: string; quantity: number; actorId: string; actorBranchId?: string; reason: string; idempotencyKey: string; correlationId?: string }, audit: InsertAuditLog): Promise<DispensingReversalResult> {
    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(dispensingReversals).where(eq(dispensingReversals.idempotencyKey, input.idempotencyKey));
      if (existing) {
        if (input.actorBranchId && existing.branchId !== input.actorBranchId) throw new InvalidDispensingError('NOT_FOUND', 'Dispensing record not found');
        if (existing.dispensingRecordId !== input.dispensingRecordId || existing.quantity !== input.quantity) throw new InvalidDispensingError('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for another reversal');
        const [order] = await tx.select().from(orders).where(eq(orders.id, existing.orderId));
        const [item] = await tx.select().from(orderItems).where(eq(orderItems.id, existing.orderItemId));
        const [reservation] = await tx.select().from(inventoryReservations).where(eq(inventoryReservations.id, existing.reservationId));
        const [quarantineBatch] = await tx.select().from(stockBatches).where(eq(stockBatches.id, existing.quarantineBatchId));
        return { reversal: existing, order, item, reservation, quarantineBatch, idempotentReplay: true };
      }
      const [record] = await tx.select().from(dispensingRecords).where(eq(dispensingRecords.id, input.dispensingRecordId)).for('update');
      if (!record) throw new InvalidDispensingError('NOT_FOUND', 'Dispensing record not found');
      if (input.actorBranchId && record.branchId !== input.actorBranchId) throw new InvalidDispensingError('NOT_FOUND', 'Dispensing record not found');
      const [order] = await tx.select().from(orders).where(eq(orders.id, record.orderId)).for('update');
      const [item] = await tx.select().from(orderItems).where(eq(orderItems.id, record.orderItemId)).for('update');
      const [reservation] = await tx.select().from(inventoryReservations).where(eq(inventoryReservations.id, record.reservationId)).for('update');
      const [batch] = await tx.select().from(stockBatches).where(eq(stockBatches.id, record.batchId)).for('update');
      if (!order || !item || !reservation || !batch) throw new InvalidDispensingError('NOT_FOUND', 'Dispensing evidence is incomplete');
      const [{ reversed }] = await tx.select({ reversed: sql<number>`coalesce(sum(${dispensingReversals.quantity}), 0)::int` }).from(dispensingReversals).where(eq(dispensingReversals.dispensingRecordId, record.id));
      if (input.quantity <= 0 || input.quantity > record.quantity - reversed || input.quantity > item.quantityDispensed || input.quantity > reservation.quantityDispensed) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Reversal quantity exceeds the remaining dispensed quantity');
      const [quarantineBatch] = await tx.insert(stockBatches).values({ productId: record.productId, branchId: record.branchId, batchNumber: `${batch.batchNumber}-RETURN-${input.idempotencyKey.slice(0, 12)}`, quantityOnHand: input.quantity, quantityReserved: 0, expiryDate: batch.expiryDate, costPrice: batch.costPrice, supplierName: batch.supplierName, status: 'quarantined' }).returning();
      const remainingReservationDispensed = reservation.quantityDispensed - input.quantity;
      const [updatedReservation] = await tx.update(inventoryReservations).set({ quantityDispensed: remainingReservationDispensed, quantityReleased: reservation.quantityReleased + input.quantity, status: remainingReservationDispensed > 0 ? 'partially_released' : 'released', version: reservation.version + 1, updatedAt: new Date() }).where(and(eq(inventoryReservations.id, reservation.id), eq(inventoryReservations.version, reservation.version))).returning();
      if (!updatedReservation) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Concurrent reservation mutation prevented reversal');
      const remainingItemDispensed = item.quantityDispensed - input.quantity;
      const [updatedItem] = await tx.update(orderItems).set({ quantityDispensed: remainingItemDispensed, status: remainingItemDispensed > 0 ? 'partially_fulfilled' : 'cancelled' }).where(eq(orderItems.id, item.id)).returning();
      const [link] = record.prescriptionOrderItemId ? await tx.select().from(prescriptionOrderItems).where(eq(prescriptionOrderItems.id, record.prescriptionOrderItemId)).for('update') : [];
      if (link) {
        const remainingLinkDispensed = link.dispensedQuantity - input.quantity;
        if (remainingLinkDispensed < 0) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Prescription dispensing evidence is inconsistent');
        await tx.update(prescriptionOrderItems).set({ dispensedQuantity: remainingLinkDispensed, approvalStatus: link.authorisedQuantity === remainingLinkDispensed ? 'fully_consumed' : (link.authorisedQuantity < link.prescribedQuantity ? 'partially_approved' : 'approved'), version: link.version + 1, updatedAt: new Date() }).where(and(eq(prescriptionOrderItems.id, link.id), eq(prescriptionOrderItems.version, link.version)));
        await tx.update(prescriptions).set({ status: remainingLinkDispensed > 0 ? 'partially_dispensed' : 'approved', updatedAt: new Date() }).where(eq(prescriptions.id, link.prescriptionId));
      }
      const [updatedOrder] = await tx.update(orders).set({ status: 'partially_cancelled', updatedAt: new Date() }).where(eq(orders.id, order.id)).returning();
      const [reversal] = await tx.insert(dispensingReversals).values({ dispensingRecordId: record.id, branchId: record.branchId, orderId: record.orderId, orderItemId: record.orderItemId, reservationId: record.reservationId, productId: record.productId, originalBatchId: record.batchId, quarantineBatchId: quarantineBatch.id, quantity: input.quantity, reason: input.reason, performedBy: input.actorId, idempotencyKey: input.idempotencyKey, correlationId: input.correlationId }).returning();
      await tx.insert(stockMovements).values({ productId: record.productId, batchId: quarantineBatch.id, branchId: record.branchId, orderId: record.orderId, orderItemId: record.orderItemId, reservationId: record.reservationId, movementType: 'quarantine', quantityDelta: input.quantity, balanceAfter: input.quantity, quantityOnHandBefore: 0, quantityOnHandAfter: input.quantity, quantityReservedBefore: 0, quantityReservedAfter: 0, reason: input.reason, performedBy: input.actorId, correlationId: input.correlationId });
      await tx.insert(auditLogs).values({ ...audit, entityId: reversal.id, changes: { ...(audit.changes as Record<string, unknown> | null ?? {}), quarantineBatchId: quarantineBatch.id } });
      return { reversal, order: updatedOrder, item: updatedItem, reservation: updatedReservation, quarantineBatch, idempotentReplay: false };
    });
  }

  async cancelOrderWithAudit(input: { orderId: string; actorId: string; reasonCode: string; reason: string; idempotencyKey: string; correlationId?: string }, audit: InsertAuditLog): Promise<OrderCancellationResult> {
    return db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId)).for('update');
      if (!order) throw new InvalidOrderCancellationError('NOT_FOUND', 'Order not found');
      const existingReservations = await tx.select().from(inventoryReservations)
        .where(eq(inventoryReservations.orderId, order.id)).for('update');
      if (order.status === 'cancelled' || order.status === 'partially_cancelled') {
        if (order.cancellationIdempotencyKey !== input.idempotencyKey) {
          throw new InvalidOrderCancellationError('IDEMPOTENCY_CONFLICT', 'Order has already been cancelled');
        }
        return {
          order,
          releasedReservations: existingReservations.filter((reservation) => reservation.quantityReleased > 0).map((reservation) => ({
            reservationId: reservation.id, productId: reservation.productId, batchId: reservation.batchId,
            quantityReleased: reservation.quantityReleased,
          })),
          idempotentReplay: true,
        };
      }
      if (!['pending', 'confirmed', 'processing', 'ready'].includes(order.status)) {
        throw new InvalidOrderCancellationError('NOT_ELIGIBLE', `Order in ${order.status} status cannot be cancelled`);
      }

      const activeReservations = existingReservations.filter((reservation) =>
        ['active', 'partially_dispensed', 'partially_released'].includes(reservation.status));
      const releasedReservations: ReleasedReservation[] = [];
      let hasDispensedQuantity = false;
      for (const reservation of activeReservations) {
        const releasable = Math.max(0, reservation.quantityReserved - reservation.quantityDispensed - reservation.quantityReleased);
        if (reservation.quantityDispensed > 0) hasDispensedQuantity = true;
        if (releasable === 0) continue;
        const [batch] = await tx.select().from(stockBatches).where(eq(stockBatches.id, reservation.batchId)).for('update');
        if (!batch || batch.quantityReserved < releasable) throw new InvalidOrderCancellationError('NOT_ELIGIBLE', 'Reservation and batch balances are inconsistent');
        const [updatedBatch] = await tx.update(stockBatches)
          .set({ quantityReserved: sql`${stockBatches.quantityReserved} - ${releasable}`, updatedAt: new Date() })
          .where(and(eq(stockBatches.id, batch.id), gte(stockBatches.quantityReserved, releasable)))
          .returning();
        if (!updatedBatch) throw new InvalidOrderCancellationError('NOT_ELIGIBLE', 'Concurrent stock change prevented cancellation');
        const nextStatus = reservation.quantityDispensed > 0 ? 'partially_released' : 'released';
        const [updatedReservation] = await tx.update(inventoryReservations).set({
          quantityReleased: reservation.quantityReleased + releasable,
          status: nextStatus,
          version: reservation.version + 1,
          updatedAt: new Date(),
        }).where(and(eq(inventoryReservations.id, reservation.id), eq(inventoryReservations.version, reservation.version))).returning();
        if (!updatedReservation) throw new InvalidOrderCancellationError('NOT_ELIGIBLE', 'Concurrent reservation change prevented cancellation');
        await tx.insert(stockMovements).values({
          productId: reservation.productId, batchId: reservation.batchId, branchId: reservation.branchId,
          orderId: order.id, orderItemId: reservation.orderItemId, reservationId: reservation.id,
          movementType: 'release', quantityDelta: releasable,
          balanceAfter: updatedBatch.quantityOnHand - updatedBatch.quantityReserved,
          quantityOnHandBefore: batch.quantityOnHand, quantityOnHandAfter: updatedBatch.quantityOnHand,
          quantityReservedBefore: batch.quantityReserved, quantityReservedAfter: updatedBatch.quantityReserved,
          reason: input.reason, performedBy: input.actorId, correlationId: input.correlationId,
        });
        releasedReservations.push({ reservationId: reservation.id, productId: reservation.productId, batchId: reservation.batchId, quantityReleased: releasable });
      }
      const nextStatus = hasDispensedQuantity ? 'partially_cancelled' : 'cancelled';
      const [cancelledOrder] = await tx.update(orders).set({
        status: nextStatus,
        cancellationReasonCode: input.reasonCode,
        cancellationReason: input.reason,
        cancelledBy: input.actorId,
        cancelledAt: new Date(),
        cancellationIdempotencyKey: input.idempotencyKey,
        updatedAt: new Date(),
      }).where(eq(orders.id, order.id)).returning();
      await tx.insert(auditLogs).values({ ...audit, entityId: order.id });
      return { order: cancelledOrder, releasedReservations, idempotentReplay: false };
    });
  }

  // Order Item operations
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(itemData: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(itemData).returning();
    return item;
  }

  // Prescription operations
  async getPrescriptions(): Promise<Prescription[]> {
    return await db.select().from(prescriptions).orderBy(desc(prescriptions.createdAt));
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return prescription;
  }

  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(eq(prescriptions.patientId, patientId)).orderBy(desc(prescriptions.createdAt));
  }

  async getPrescriptionForPatient(id: string, patientId: string): Promise<Prescription | undefined> {
    if (!id || !patientId) return undefined;
    const [prescription] = await db.select().from(prescriptions).where(and(eq(prescriptions.id, id), eq(prescriptions.patientId, patientId)));
    return prescription;
  }

  async getPendingPrescriptions(): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(eq(prescriptions.status, 'pending')).orderBy(prescriptions.createdAt);
  }

  async createPrescription(prescriptionData: InsertPrescription): Promise<Prescription> {
    const [prescription] = await db.insert(prescriptions).values(prescriptionData).returning();
    return prescription;
  }

  async updatePrescription(id: string, prescriptionData: Partial<InsertPrescription>): Promise<Prescription> {
    const [prescription] = await db
      .update(prescriptions)
      .set({ ...prescriptionData, updatedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();
    return prescription;
  }

  async reviewPrescriptionWithAudit(id: string, expectedStatus: Prescription['status'], prescriptionData: Partial<InsertPrescription>, audit: InsertAuditLog): Promise<Prescription | undefined> {
    return db.transaction(async (tx) => {
      const [prescription] = await tx.update(prescriptions)
        .set({ ...prescriptionData, updatedAt: new Date() })
        .where(and(eq(prescriptions.id, id), eq(prescriptions.status, expectedStatus)))
        .returning();
      if (!prescription) return undefined;
      await tx.insert(auditLogs).values(audit);
      return prescription;
    });
  }

  // Delivery operations
  async getAllDeliveriesForOperations(): Promise<Delivery[]> {
    return await db.select().from(deliveries).orderBy(desc(deliveries.createdAt));
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    return delivery;
  }

  async getAssignedDelivery(id: string, driverId: string): Promise<Delivery | undefined> {
    if (!id || !driverId) return undefined;
    const [delivery] = await db.select().from(deliveries).where(and(eq(deliveries.id, id), eq(deliveries.driverId, driverId)));
    return delivery;
  }

  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> {
    return await db.select().from(deliveries).where(eq(deliveries.driverId, driverId)).orderBy(desc(deliveries.createdAt));
  }

  async getActiveDeliveries(): Promise<Delivery[]> {
    return await db
      .select()
      .from(deliveries)
      .where(
        sql`${deliveries.status} IN ('pending', 'assigned', 'picked_up', 'in_transit')`
      )
      .orderBy(deliveries.createdAt);
  }

  async createDelivery(deliveryData: InsertDelivery): Promise<Delivery> {
    const [delivery] = await db.insert(deliveries).values(deliveryData).returning();
    return delivery;
  }

  async updateDelivery(id: string, deliveryData: Partial<InsertDelivery>): Promise<Delivery> {
    const [delivery] = await db
      .update(deliveries)
      .set({ ...deliveryData, updatedAt: new Date() })
      .where(eq(deliveries.id, id))
      .returning();
    return delivery;
  }

  // Appointment operations
  async getAllAppointmentsForOperations(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(appointments.scheduledAt);
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentForPatient(id: string, patientId: string): Promise<Appointment | undefined> {
    if (!id || !patientId) return undefined;
    const [appointment] = await db.select().from(appointments).where(and(eq(appointments.id, id), eq(appointments.patientId, patientId)));
    return appointment;
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.patientId, patientId)).orderBy(appointments.scheduledAt);
  }

  async getAppointmentsByPractitioner(practitionerId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.practitionerId, practitionerId)).orderBy(appointments.scheduledAt);
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values(appointmentData).returning();
    return appointment;
  }

  async updateAppointment(id: string, appointmentData: Partial<InsertAppointment>): Promise<Appointment> {
    const [appointment] = await db
      .update(appointments)
      .set({ ...appointmentData, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async updateAppointmentWithAudit(id: string, appointmentData: Partial<InsertAppointment>, audit: InsertAuditLog): Promise<Appointment> {
    return db.transaction(async (tx) => {
      const [appointment] = await tx.update(appointments)
        .set({ ...appointmentData, updatedAt: new Date() })
        .where(eq(appointments.id, id))
        .returning();
      if (!appointment) throw new Error('Appointment not found');
      await tx.insert(auditLogs).values(audit);
      return appointment;
    });
  }

  // Content operations
  async getContentItems(status?: string): Promise<ContentItem[]> {
    if (status) {
      return await db.select().from(contentItems).where(eq(contentItems.status, status as any)).orderBy(desc(contentItems.publishedAt));
    }
    return await db.select().from(contentItems).orderBy(desc(contentItems.publishedAt));
  }

  async getContentItem(id: string): Promise<ContentItem | undefined> {
    const [content] = await db.select().from(contentItems).where(eq(contentItems.id, id));
    return content;
  }

  async getContentItemBySlug(slug: string): Promise<ContentItem | undefined> {
    const [content] = await db.select().from(contentItems).where(eq(contentItems.slug, slug));
    return content;
  }

  async createContentItem(contentData: InsertContentItem): Promise<ContentItem> {
    const [content] = await db.insert(contentItems).values(contentData).returning();
    return content;
  }

  async updateContentItem(id: string, contentData: Partial<InsertContentItem>): Promise<ContentItem> {
    const [content] = await db
      .update(contentItems)
      .set({ ...contentData, updatedAt: new Date() })
      .where(eq(contentItems.id, id))
      .returning();
    return content;
  }

  // Audit Log operations
  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData).returning();
    return log;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
  }

  async createEmergencyAccessGrant(grant: InsertEmergencyAccessGrant): Promise<EmergencyAccessGrant> {
    const [created] = await db.insert(emergencyAccessGrants).values(grant).returning();
    return created;
  }

  async createEmergencyAccessGrantWithAudit(grant: InsertEmergencyAccessGrant, audit: InsertAuditLog): Promise<EmergencyAccessGrant> {
    return db.transaction(async (tx) => {
      const [created] = await tx.insert(emergencyAccessGrants).values(grant).returning();
      await tx.insert(auditLogs).values(audit);
      return created;
    });
  }

  async getEmergencyAccessGrant(id: string): Promise<EmergencyAccessGrant | undefined> {
    if (!id) return undefined;
    const [grant] = await db.select().from(emergencyAccessGrants).where(eq(emergencyAccessGrants.id, id));
    return grant;
  }

  async reviewEmergencyAccessGrant(id: string, changes: Partial<InsertEmergencyAccessGrant>): Promise<EmergencyAccessGrant | undefined> {
    const [updated] = await db.update(emergencyAccessGrants)
      .set(changes)
      .where(and(eq(emergencyAccessGrants.id, id), eq(emergencyAccessGrants.reviewState, 'pending')))
      .returning();
    return updated;
  }

  async reviewEmergencyAccessGrantWithAudit(id: string, changes: Partial<InsertEmergencyAccessGrant>, audit: InsertAuditLog): Promise<EmergencyAccessGrant | undefined> {
    return db.transaction(async (tx) => {
      const [updated] = await tx.update(emergencyAccessGrants)
        .set(changes)
        .where(and(eq(emergencyAccessGrants.id, id), eq(emergencyAccessGrants.reviewState, 'pending')))
        .returning();
      if (!updated) return undefined;
      await tx.insert(auditLogs).values(audit);
      return updated;
    });
  }

  // Analytics/Stats
  async getDashboardStats(): Promise<any> {
    // Get total orders
    const totalOrders = await db.select({ count: sql<number>`count(*)` }).from(orders);
    
    // Get total revenue
    const revenue = await db.select({ total: sql<number>`sum(${orders.total})` }).from(orders).where(eq(orders.paymentStatus, 'completed'));
    
    // Get total customers
    const customers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'patient'));
    
    // Get total products
    const productCount = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true));
    
    // Get low stock items
    const lowStock = await db.select({ count: sql<number>`count(*)` }).from(stockBatches).where(lte(sql`${stockBatches.quantityOnHand} - ${stockBatches.quantityReserved}`, 10));
    
    // Get expiring items
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const expiringItems = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockBatches)
      .where(and(lte(stockBatches.expiryDate, futureDate), gte(stockBatches.expiryDate, new Date())));
    
    // Get pending prescriptions
    const pendingPrescriptions = await db.select({ count: sql<number>`count(*)` }).from(prescriptions).where(eq(prescriptions.status, 'pending'));
    
    // Get active deliveries
    const activeDeliveries = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveries)
      .where(sql`${deliveries.status} IN ('assigned', 'picked_up', 'in_transit')`);

    return {
      totalOrders: totalOrders[0]?.count || 0,
      totalRevenue: revenue[0]?.total || 0,
      totalCustomers: customers[0]?.count || 0,
      totalProducts: productCount[0]?.count || 0,
      lowStockItems: lowStock[0]?.count || 0,
      expiringItems: expiringItems[0]?.count || 0,
      pendingPrescriptions: pendingPrescriptions[0]?.count || 0,
      activeDeliveries: activeDeliveries[0]?.count || 0,
      revenueGrowth: 0, // Would need historical data
      ordersGrowth: 0, // Would need historical data
    };
  }
}

export const storage = new DatabaseStorage();

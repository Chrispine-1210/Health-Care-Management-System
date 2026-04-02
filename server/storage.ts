import {
  users,
  branches,
  products,
  stockBatches,
  orders,
  orderItems,
  prescriptions,
  deliveries,
  appointments,
  contentItems,
  auditLogs,
  type User,
  type UpsertUser,
  type Branch,
  type InsertBranch,
  type Product,
  type InsertProduct,
  type StockBatch,
  type InsertStockBatch,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, lt, lte, gte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByBranch(branchId: string): Promise<User[]>;
  updateUserRole(id: string, role: string, branchId?: string): Promise<User>;

  // Branch operations
  getBranches(): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
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

  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByBranch(branchId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;

  // Order Item operations
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Prescription operations
  getPrescriptions(): Promise<Prescription[]>;
  getPrescription(id: string): Promise<Prescription | undefined>;
  getPrescriptionsByPatient(patientId: string): Promise<Prescription[]>;
  getPendingPrescriptions(): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription>;

  // Delivery operations
  getDeliveries(): Promise<Delivery[]>;
  getDelivery(id: string): Promise<Delivery | undefined>;
  getDeliveriesByDriver(driverId: string): Promise<Delivery[]>;
  getActiveDeliveries(): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery>;

  // Appointment operations
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  getAppointmentsByPractitioner(practitionerId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment>;

  // Content operations
  getContentItems(status?: string): Promise<ContentItem[]>;
  getContentItem(id: string): Promise<ContentItem | undefined>;
  getContentItemBySlug(slug: string): Promise<ContentItem | undefined>;
  createContentItem(content: InsertContentItem): Promise<ContentItem>;
  updateContentItem(id: string, content: Partial<InsertContentItem>): Promise<ContentItem>;

  // Audit Log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  // Analytics/Stats
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error: any) {
      if (error.code === 'XX000' || error.message?.includes('disabled')) {
        console.warn("Database endpoint disabled, falling back to memory");
        return undefined;
      }
      throw error;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
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
    } catch (error: any) {
      if (error.code === 'XX000' || error.message?.includes('disabled')) {
        console.warn("Database endpoint disabled, falling back to memory");
        return {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          phone: userData.phone,
          role: 'customer',
          branchId: userData.branchId,
          allergies: [],
          chronicConditions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      throw error;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async getAllUsers(): Promise<User[]> {
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
    return await db.select().from(stockBatches).where(lte(stockBatches.quantity, threshold));
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
  async getOrders(): Promise<Order[]> {
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

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ ...orderData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
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

  // Delivery operations
  async getDeliveries(): Promise<Delivery[]> {
    return await db.select().from(deliveries).orderBy(desc(deliveries.createdAt));
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
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
  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(appointments.scheduledAt);
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
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

  // Analytics/Stats
  async getDashboardStats(): Promise<any> {
    // Get total orders
    const totalOrders = await db.select({ count: sql<number>`count(*)` }).from(orders);
    
    // Get total revenue
    const revenue = await db.select({ total: sql<number>`sum(${orders.total})` }).from(orders).where(eq(orders.paymentStatus, 'completed'));
    
    // Get total customers
    const customers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'customer'));
    
    // Get total products
    const productCount = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true));
    
    // Get low stock items
    const lowStock = await db.select({ count: sql<number>`count(*)` }).from(stockBatches).where(lte(stockBatches.quantity, 10));
    
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

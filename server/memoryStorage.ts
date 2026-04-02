import { IStorage } from "./storage";
import type {
  User, UpsertUser, Branch, InsertBranch, Product, InsertProduct,
  StockBatch, InsertStockBatch, Order, InsertOrder, OrderItem, InsertOrderItem,
  Prescription, InsertPrescription, Delivery, InsertDelivery,
  Appointment, InsertAppointment, ContentItem, InsertContentItem,
  AuditLog, InsertAuditLog
} from "@shared/schema";

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private branches = new Map<string, Branch>();
  private products = new Map<string, Product>();
  private stockBatches = new Map<string, StockBatch>();
  private orders = new Map<string, Order>();
  private orderItems = new Map<string, OrderItem[]>();
  private prescriptions = new Map<string, Prescription>();
  private deliveries = new Map<string, Delivery>();
  private appointments = new Map<string, Appointment>();
  private contentItems = new Map<string, ContentItem>();
  private auditLogs: AuditLog[] = [];

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user exists to preserve their role
    const existing = this.users.get(userData.id);
    
    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      phone: userData.phone,
      // Preserve existing role if user already exists, otherwise use provided or default
      role: existing?.role || userData.role || 'customer',
      branchId: userData.branchId || existing?.branchId,
      allergies: userData.allergies || existing?.allergies || [],
      chronicConditions: userData.chronicConditions || existing?.chronicConditions || [],
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === role);
  }

  async getUsersByBranch(branchId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.branchId === branchId);
  }

  async updateUserRole(id: string, role: string, branchId?: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    user.role = role as any;
    if (branchId) user.branchId = branchId;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return user;
  }

  // Branches
  async getBranches(): Promise<Branch[]> {
    return Array.from(this.branches.values());
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    return this.branches.get(id);
  }

  async createBranch(branchData: InsertBranch): Promise<Branch> {
    const id = Math.random().toString(36).substring(7);
    const branch: Branch = { id, ...branchData, createdAt: new Date(), updatedAt: new Date() };
    this.branches.set(id, branch);
    return branch;
  }

  async updateBranch(id: string, branchData: Partial<InsertBranch>): Promise<Branch> {
    const branch = this.branches.get(id);
    if (!branch) throw new Error("Branch not found");
    const updated = { ...branch, ...branchData, updatedAt: new Date() };
    this.branches.set(id, updated);
    return updated;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).slice(0, 4);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = Math.random().toString(36).substring(7);
    const product: Product = { id, ...productData, createdAt: new Date(), updatedAt: new Date() };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) throw new Error("Product not found");
    const updated = { ...product, ...productData, updatedAt: new Date() };
    this.products.set(id, updated);
    return updated;
  }

  // Stock Batches
  async getStockBatches(): Promise<StockBatch[]> {
    return Array.from(this.stockBatches.values());
  }

  async getStockBatchesByBranch(branchId: string): Promise<StockBatch[]> {
    return Array.from(this.stockBatches.values()).filter(b => b.branchId === branchId);
  }

  async getStockBatchesByProduct(productId: string): Promise<StockBatch[]> {
    return Array.from(this.stockBatches.values()).filter(b => b.productId === productId);
  }

  async getLowStockBatches(threshold: number): Promise<StockBatch[]> {
    return Array.from(this.stockBatches.values()).filter(b => b.quantityOnHand <= threshold);
  }

  async getExpiringBatches(daysThreshold: number): Promise<StockBatch[]> {
    const now = new Date();
    return Array.from(this.stockBatches.values()).filter(b => {
      if (!b.expiryDate) return false;
      const daysUntilExpiry = (new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= daysThreshold;
    });
  }

  async createStockBatch(batchData: InsertStockBatch): Promise<StockBatch> {
    const id = Math.random().toString(36).substring(7);
    const batch: StockBatch = { id, ...batchData, createdAt: new Date(), updatedAt: new Date() };
    this.stockBatches.set(id, batch);
    return batch;
  }

  async updateStockBatch(id: string, batchData: Partial<InsertStockBatch>): Promise<StockBatch> {
    const batch = this.stockBatches.get(id);
    if (!batch) throw new Error("Batch not found");
    const updated = { ...batch, ...batchData, updatedAt: new Date() };
    this.stockBatches.set(id, updated);
    return updated;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.customerId === customerId);
  }

  async getOrdersByBranch(branchId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.branchId === branchId);
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = Math.random().toString(36).substring(7);
    const order: Order = { id, ...orderData, createdAt: new Date(), updatedAt: new Date() };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error("Order not found");
    const updated = { ...order, ...orderData, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.orderItems.get(orderId) || [];
  }

  async createOrderItem(itemData: InsertOrderItem): Promise<OrderItem> {
    const id = Math.random().toString(36).substring(7);
    const item: OrderItem = { id, ...itemData, createdAt: new Date(), updatedAt: new Date() };
    const items = this.orderItems.get(itemData.orderId) || [];
    items.push(item);
    this.orderItems.set(itemData.orderId, items);
    return item;
  }

  // Prescriptions
  async getPrescriptions(): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values());
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }

  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.patientId === patientId);
  }

  async getPendingPrescriptions(): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.status === 'pending' || p.status === 'under_review');
  }

  async createPrescription(prescriptionData: InsertPrescription): Promise<Prescription> {
    const id = Math.random().toString(36).substring(7);
    const prescription: Prescription = { id, ...prescriptionData, createdAt: new Date(), updatedAt: new Date() };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async updatePrescription(id: string, prescriptionData: Partial<InsertPrescription>): Promise<Prescription> {
    const prescription = this.prescriptions.get(id);
    if (!prescription) throw new Error("Prescription not found");
    const updated = { ...prescription, ...prescriptionData, updatedAt: new Date() };
    this.prescriptions.set(id, updated);
    return updated;
  }

  // Deliveries
  async getDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values());
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }

  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(d => d.assignedDriverId === driverId);
  }

  async getActiveDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(d => d.status !== 'delivered' && d.status !== 'cancelled');
  }

  async createDelivery(deliveryData: InsertDelivery): Promise<Delivery> {
    const id = Math.random().toString(36).substring(7);
    const delivery: Delivery = { id, ...deliveryData, createdAt: new Date(), updatedAt: new Date() };
    this.deliveries.set(id, delivery);
    return delivery;
  }

  async updateDelivery(id: string, deliveryData: Partial<InsertDelivery>): Promise<Delivery> {
    const delivery = this.deliveries.get(id);
    if (!delivery) throw new Error("Delivery not found");
    const updated = { ...delivery, ...deliveryData, updatedAt: new Date() };
    this.deliveries.set(id, updated);
    return updated;
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(a => a.patientId === patientId);
  }

  async getAppointmentsByPractitioner(practitionerId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(a => a.practitionerId === practitionerId);
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = Math.random().toString(36).substring(7);
    const appointment: Appointment = { id, ...appointmentData, createdAt: new Date(), updatedAt: new Date() };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: string, appointmentData: Partial<InsertAppointment>): Promise<Appointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) throw new Error("Appointment not found");
    const updated = { ...appointment, ...appointmentData, updatedAt: new Date() };
    this.appointments.set(id, updated);
    return updated;
  }

  // Content
  async getContentItems(status?: string): Promise<ContentItem[]> {
    const items = Array.from(this.contentItems.values());
    if (status) return items.filter(i => i.status === status);
    return items;
  }

  async getContentItem(id: string): Promise<ContentItem | undefined> {
    return this.contentItems.get(id);
  }

  async getContentItemBySlug(slug: string): Promise<ContentItem | undefined> {
    return Array.from(this.contentItems.values()).find(i => i.slug === slug);
  }

  async createContentItem(contentData: InsertContentItem): Promise<ContentItem> {
    const id = Math.random().toString(36).substring(7);
    const content: ContentItem = { id, ...contentData, createdAt: new Date(), updatedAt: new Date() };
    this.contentItems.set(id, content);
    return content;
  }

  async updateContentItem(id: string, contentData: Partial<InsertContentItem>): Promise<ContentItem> {
    const content = this.contentItems.get(id);
    if (!content) throw new Error("Content not found");
    const updated = { ...content, ...contentData, updatedAt: new Date() };
    this.contentItems.set(id, updated);
    return updated;
  }

  // Audit Logs
  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const id = Math.random().toString(36).substring(7);
    const log: AuditLog = { id, ...logData, createdAt: new Date() };
    this.auditLogs.push(log);
    return log;
  }

  async getAuditLogs(limit?: number): Promise<AuditLog[]> {
    const logs = this.auditLogs.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    return limit ? logs.slice(0, limit) : logs;
  }

  async getDashboardStats(): Promise<any> {
    return {
      totalOrders: this.orders.size,
      totalRevenue: Array.from(this.orders.values()).reduce((sum, o) => sum + parseFloat(o.total || '0'), 0),
      totalUsers: this.users.size,
      totalProducts: this.products.size,
    };
  }
}

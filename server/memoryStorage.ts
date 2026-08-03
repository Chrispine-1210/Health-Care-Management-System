import type { IStorage } from "./storage";
import type { DispensingResult, OrderCancellationResult, OrderLineInput, ReleasedReservation } from "./storage";
import { InsufficientStockError, InvalidDispensingError, InvalidOrderCancellationError, InvalidStockAdjustmentError } from "./storageErrors";
import type {
  User, UpsertUser, Branch, InsertBranch, Product, InsertProduct,
  StockBatch, InsertStockBatch, StockMovement, InventoryReservation, Order, InsertOrder, OrderItem, InsertOrderItem,
  Prescription, InsertPrescription, PrescriptionOrderItem, DispensingRecord, Delivery, InsertDelivery,
  Appointment, InsertAppointment, ContentItem, InsertContentItem,
  AuditLog, InsertAuditLog, EmergencyAccessGrant, InsertEmergencyAccessGrant
} from "@shared/schema";

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private branches = new Map<string, Branch>();
  private products = new Map<string, Product>();
  private stockBatches = new Map<string, StockBatch>();
  private stockMovements: StockMovement[] = [];
  private inventoryReservations = new Map<string, InventoryReservation>();
  private prescriptionOrderItems = new Map<string, PrescriptionOrderItem>();
  private dispensingRecords = new Map<string, DispensingRecord>();
  private orders = new Map<string, Order>();
  private orderItems = new Map<string, OrderItem[]>();
  private prescriptions = new Map<string, Prescription>();
  private deliveries = new Map<string, Delivery>();
  private appointments = new Map<string, Appointment>();
  private contentItems = new Map<string, ContentItem>();
  private auditLogs: AuditLog[] = [];
  private emergencyAccessGrants = new Map<string, EmergencyAccessGrant>();

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user exists to preserve their role
    const id = userData.id ?? crypto.randomUUID();
    const existing = this.users.get(id);
    
    const user: User = {
      id,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      phone: userData.phone ?? null,
      // Preserve existing role if user already exists, otherwise use provided or default
      role: existing?.role || userData.role || 'patient',
      accountStatus: userData.accountStatus || existing?.accountStatus || 'active',
      branchId: userData.branchId ?? existing?.branchId ?? null,
      allergies: userData.allergies || existing?.allergies || [],
      chronicConditions: userData.chronicConditions || existing?.chronicConditions || [],
      vehicleInfo: userData.vehicleInfo ?? existing?.vehicleInfo ?? null,
      licenseNumber: userData.licenseNumber ?? existing?.licenseNumber ?? null,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsersForAdministration(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updated: User = { ...user, ...data, id, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
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

  async assignUserRoleWithAudit(id: string, role: string, branchId: string | undefined, audit: InsertAuditLog): Promise<User> {
    const current = this.users.get(id);
    if (!current) throw new Error('User not found');
    const previous = { ...current };
    try {
      const user = await this.updateUserRole(id, role, branchId);
      await this.createAuditLog(audit);
      return user;
    } catch (error) {
      this.users.set(id, previous);
      throw error;
    }
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
    const branch = { id, ...branchData, createdAt: new Date(), updatedAt: new Date() } as Branch;
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

  async getProductBySku(sku: string): Promise<Product | undefined> {
    if (!sku) return undefined;
    return Array.from(this.products.values()).find((product) => product.sku === sku);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).slice(0, 4);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = Math.random().toString(36).substring(7);
    const product = { id, prescriptionRequired: false, prescriptionRequirement: 'none', requiresPharmacistApproval: false, onlineSaleAllowed: true, controlledMedicine: false, maximumDispensingQuantity: null, prescriptionValidityDays: 30, allowPartialDispensing: true, allowGenericSubstitution: false, isActive: true, ...productData, createdAt: new Date(), updatedAt: new Date() } as Product;
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
    return Array.from(this.stockBatches.values()).filter(b => b.quantityOnHand - b.quantityReserved <= threshold);
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
    const batch = { id, status: 'active', quantityReserved: 0, ...batchData, createdAt: new Date(), updatedAt: new Date() } as StockBatch;
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
  async getAllOrdersForOperations(): Promise<Order[]> {
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
    const order = { id, status: 'pending', paymentStatus: 'pending', deliveryCharge: '0', ...orderData, createdAt: new Date(), updatedAt: new Date() } as Order;
    this.orders.set(id, order);
    return order;
  }

  async createStockBatchWithAudit(batchData: InsertStockBatch, audit: InsertAuditLog): Promise<StockBatch> {
    const movementCount = this.stockMovements.length;
    const batch = await this.createStockBatch(batchData);
    try {
      if (batch.quantityOnHand > 0) {
        this.stockMovements.push({
          id: crypto.randomUUID(), productId: batch.productId, batchId: batch.id, branchId: batch.branchId,
          orderId: null, orderItemId: null, reservationId: null, movementType: 'receipt', quantityDelta: batch.quantityOnHand, balanceAfter: batch.quantityOnHand,
          quantityOnHandBefore: 0, quantityOnHandAfter: batch.quantityOnHand, quantityReservedBefore: 0, quantityReservedAfter: 0,
          reason: 'Initial batch receipt', performedBy: audit.userId ?? null, correlationId: null, createdAt: new Date(),
        });
      }
      await this.createAuditLog({ ...audit, entityId: audit.entityId ?? batch.id });
      return batch;
    } catch (error) {
      this.stockBatches.delete(batch.id);
      this.stockMovements.length = movementCount;
      throw error;
    }
  }

  async updateStockBatchWithAudit(id: string, branchId: string, batchData: Partial<InsertStockBatch>, audit: InsertAuditLog): Promise<StockBatch | undefined> {
    const previous = this.stockBatches.get(id);
    if (!previous || previous.branchId !== branchId) return undefined;
    const { quantityOnHand: _quantityOnHand, quantityReserved: _quantityReserved, branchId: _branchId, ...allowedChanges } = batchData;
    const updated = { ...previous, ...allowedChanges, updatedAt: new Date() } as StockBatch;
    this.stockBatches.set(id, updated);
    try {
      await this.createAuditLog({ ...audit, entityId: audit.entityId ?? id });
      return updated;
    } catch (error) {
      this.stockBatches.set(id, previous);
      throw error;
    }
  }

  async adjustStockBatchWithAudit(id: string, branchId: string, quantityDelta: number, reason: string, audit: InsertAuditLog): Promise<StockBatch | undefined> {
    if (!Number.isInteger(quantityDelta) || quantityDelta === 0) throw new InvalidStockAdjustmentError('Quantity delta must be a non-zero integer');
    const previous = this.stockBatches.get(id);
    if (!previous || previous.branchId !== branchId) return undefined;
    const onHandAfter = previous.quantityOnHand + quantityDelta;
    if (onHandAfter < previous.quantityReserved) throw new InvalidStockAdjustmentError();
    const movementCount = this.stockMovements.length;
    const updated = { ...previous, quantityOnHand: onHandAfter, updatedAt: new Date() };
    this.stockBatches.set(id, updated);
    this.stockMovements.push({
      id: crypto.randomUUID(), productId: previous.productId, batchId: id, branchId,
      orderId: null, orderItemId: null, reservationId: null, movementType: 'adjustment', quantityDelta, balanceAfter: onHandAfter - previous.quantityReserved, reason,
      quantityOnHandBefore: previous.quantityOnHand, quantityOnHandAfter: onHandAfter,
      quantityReservedBefore: previous.quantityReserved, quantityReservedAfter: previous.quantityReserved,
      performedBy: audit.userId ?? null, correlationId: null, createdAt: new Date(),
    });
    try {
      await this.createAuditLog({ ...audit, entityId: audit.entityId ?? id });
      return updated;
    } catch (error) {
      this.stockBatches.set(id, previous);
      this.stockMovements.length = movementCount;
      throw error;
    }
  }

  async getStockMovements(filters: { batchId?: string; branchId?: string } = {}): Promise<StockMovement[]> {
    const movements = this.stockMovements.filter((movement) =>
      (!filters.batchId || movement.batchId === filters.batchId)
      && (!filters.branchId || movement.branchId === filters.branchId));
    return [...movements].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getOrderForOwner(id: string, ownerId: string): Promise<Order | undefined> {
    if (!id || !ownerId) return undefined;
    const order = this.orders.get(id);
    return order?.customerId === ownerId ? order : undefined;
  }

  async getOrderWithinBranch(id: string, branchId: string): Promise<Order | undefined> {
    if (!id || !branchId) return undefined;
    const order = this.orders.get(id);
    return order?.branchId === branchId ? order : undefined;
  }

  async createOrderWithItems(orderData: InsertOrder, itemData: Omit<InsertOrderItem, 'orderId'>[]): Promise<{ order: Order; items: OrderItem[] }> {
    const orderId = Math.random().toString(36).substring(7);
    const now = new Date();
    const order = { id: orderId, status: 'pending', paymentStatus: 'pending', deliveryCharge: '0', ...orderData, createdAt: now, updatedAt: now } as Order;
    const items = itemData.map((item) => ({
      id: Math.random().toString(36).substring(7),
      quantityDispensed: 0,
      status: 'reserved',
      ...item,
      orderId,
      createdAt: now,
    } as OrderItem));
    this.orders.set(orderId, order);
    this.orderItems.set(orderId, items);
    return { order, items };
  }

  async createOrderWithItemsAndAudit(orderData: InsertOrder, itemData: OrderLineInput[], audit: InsertAuditLog): Promise<{ order: Order; items: OrderItem[] }> {
    const batchSnapshot = new Map(Array.from(this.stockBatches.entries(), ([id, batch]) => [id, { ...batch }]));
    const reservationSnapshot = new Map(this.inventoryReservations);
    const movementCount = this.stockMovements.length;
    const order = await this.createOrder(orderData);
    try {
      const createdItems: OrderItem[] = [];
      for (const item of itemData) {
        const { prescriptionLink, ...stockItem } = item;
        let remaining = item.quantity;
        const candidates = Array.from(this.stockBatches.values())
          .filter((batch) => batch.productId === item.productId
            && batch.branchId === order.branchId
            && batch.status === 'active'
            && batch.quantityOnHand - batch.quantityReserved > 0
            && new Date(batch.expiryDate) > new Date()
            && (!item.batchId || batch.id === item.batchId))
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        for (const batch of candidates) {
          if (remaining === 0) break;
          const reserved = Math.min(batch.quantityOnHand - batch.quantityReserved, remaining);
          const reservedAfter = batch.quantityReserved + reserved;
          this.stockBatches.set(batch.id, { ...batch, quantityReserved: reservedAfter, updatedAt: new Date() });
          const createdItem = {
            id: crypto.randomUUID(),
            quantityDispensed: 0,
            status: 'reserved',
            ...stockItem,
            batchId: batch.id,
            orderId: order.id,
            quantity: reserved,
            subtotal: (Number(item.unitPrice) * reserved).toFixed(2),
            createdAt: new Date(),
          } as OrderItem;
          createdItems.push(createdItem);
          if (prescriptionLink) {
            const link = { id: crypto.randomUUID(), branchId: order.branchId, prescriptionId: prescriptionLink.prescriptionId, orderId: order.id, orderItemId: createdItem.id, productId: item.productId, prescribedQuantity: Math.min(prescriptionLink.prescribedQuantity, reserved), authorisedQuantity: 0, dispensedQuantity: 0, approvalStatus: 'pending', substitutionAllowed: false, reviewedBy: null, reviewedAt: null, rejectionReason: null, clinicalNote: null, version: 1, createdAt: new Date(), updatedAt: new Date() } as PrescriptionOrderItem;
            this.prescriptionOrderItems.set(link.id, link);
          }
          const reservation: InventoryReservation = {
            id: crypto.randomUUID(), orderId: order.id, orderItemId: createdItem.id, productId: item.productId,
            batchId: batch.id, branchId: order.branchId, quantityReserved: reserved, quantityDispensed: 0,
            quantityReleased: 0, status: 'active', version: 1, createdAt: new Date(), updatedAt: new Date(),
          };
          this.inventoryReservations.set(reservation.id, reservation);
          this.stockMovements.push({
            id: crypto.randomUUID(),
            productId: item.productId,
            batchId: batch.id,
            branchId: order.branchId,
            orderId: order.id, orderItemId: createdItem.id, reservationId: reservation.id,
            movementType: 'reservation',
            quantityDelta: -reserved,
            balanceAfter: batch.quantityOnHand - reservedAfter,
            quantityOnHandBefore: batch.quantityOnHand, quantityOnHandAfter: batch.quantityOnHand,
            quantityReservedBefore: batch.quantityReserved, quantityReservedAfter: reservedAfter,
            reason: 'Reserved for customer order',
            performedBy: audit.userId ?? null,
            correlationId: null,
            createdAt: new Date(),
          });
          remaining -= reserved;
        }
        if (remaining > 0) throw new InsufficientStockError(item.productId);
      }
      this.orderItems.set(order.id, createdItems);
      await this.createAuditLog({ ...audit, entityId: audit.entityId ?? order.id });
      return { order, items: createdItems };
    } catch (error) {
      this.orders.delete(order.id);
      this.orderItems.delete(order.id);
      this.stockBatches = batchSnapshot;
      this.inventoryReservations = reservationSnapshot;
      this.stockMovements.length = movementCount;
      throw error;
    }
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
    const item = { id, ...itemData, createdAt: new Date() } as OrderItem;
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

  async getPrescriptionForPatient(id: string, patientId: string): Promise<Prescription | undefined> {
    if (!id || !patientId) return undefined;
    const prescription = this.prescriptions.get(id);
    return prescription?.patientId === patientId ? prescription : undefined;
  }

  async getPendingPrescriptions(): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.status === 'pending' || p.status === 'under_review');
  }

  async createPrescription(prescriptionData: InsertPrescription): Promise<Prescription> {
    const id = Math.random().toString(36).substring(7);
    const prescription = { id, ...prescriptionData, createdAt: new Date(), updatedAt: new Date() } as Prescription;
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

  async updateOrderWithAudit(id: string, orderData: Partial<InsertOrder>, audit: InsertAuditLog): Promise<Order> {
    const previous = this.orders.get(id);
    if (!previous) throw new Error('Order not found');
    try {
      const order = await this.updateOrder(id, orderData);
      await this.createAuditLog(audit);
      return order;
    } catch (error) {
      this.orders.set(id, previous);
      throw error;
    }
  }

  async getReservationsByOrder(orderId: string): Promise<InventoryReservation[]> {
    return Array.from(this.inventoryReservations.values()).filter((reservation) => reservation.orderId === orderId);
  }

  async getPrescriptionOrderItem(prescriptionId: string, orderItemId: string): Promise<PrescriptionOrderItem | undefined> {
    return Array.from(this.prescriptionOrderItems.values()).find((link) => link.prescriptionId === prescriptionId && link.orderItemId === orderItemId);
  }

  async reviewPrescriptionOrderItem(input: { prescriptionId: string; orderItemId: string; actorId: string; decision: 'approve' | 'partially_approve' | 'reject'; authorisedQuantity?: number; substitutionAllowed?: boolean; clinicalNote?: string; rejectionReason?: string }, audit: InsertAuditLog): Promise<PrescriptionOrderItem> {
    const prescription = this.prescriptions.get(input.prescriptionId);
    const link = await this.getPrescriptionOrderItem(input.prescriptionId, input.orderItemId);
    if (!prescription || !link) throw new InvalidDispensingError('NOT_FOUND', 'Prescription linkage not found');
    if (prescription.revokedAt || ['revoked', 'cancelled', 'expired'].includes(prescription.status) || (prescription.expiresAt && prescription.expiresAt <= new Date())) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Prescription is expired, revoked, or cancelled');
    const quantity = input.decision === 'reject' ? 0 : input.authorisedQuantity ?? 0;
    if (input.decision !== 'reject' && (quantity <= 0 || quantity > link.prescribedQuantity)) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Authorised quantity exceeds the prescribed quantity or is invalid');
    const updated = { ...link, authorisedQuantity: quantity, approvalStatus: input.decision === 'reject' ? 'rejected' : input.decision === 'partially_approve' ? 'partially_approved' : 'approved', substitutionAllowed: input.substitutionAllowed ?? false, reviewedBy: input.actorId, reviewedAt: new Date(), clinicalNote: input.clinicalNote ?? null, rejectionReason: input.rejectionReason ?? null, version: link.version + 1, updatedAt: new Date() } as PrescriptionOrderItem;
    this.prescriptionOrderItems.set(link.id, updated);
    await this.createAuditLog({ ...audit, entityId: link.id });
    return updated;
  }

  async dispenseOrderItem(input: { orderId: string; orderItemId: string; reservationId: string; quantity: number; actorId: string; idempotencyKey: string; counsellingCompleted: boolean; notes?: string; correlationId?: string }, audit: InsertAuditLog): Promise<DispensingResult> {
    const replay = this.dispensingRecords.get(input.idempotencyKey);
    const order = this.orders.get(input.orderId);
    const item = this.orderItems.get(input.orderId)?.find((value) => value.id === input.orderItemId);
    const reservation = this.inventoryReservations.get(input.reservationId);
    if (replay && order && item && reservation) return { record: replay, order, item, reservation, idempotentReplay: true };
    if (!order || !item || !reservation) throw new InvalidDispensingError('NOT_FOUND', 'Order item reservation not found');
    if (['cancelled', 'partially_cancelled', 'fully_dispensed', 'delivered'].includes(order.status)) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Order cannot be dispensed from its current state');
    const batch = this.stockBatches.get(reservation.batchId);
    const product = this.products.get(item.productId);
    if (!batch || !product || batch.status !== 'active' || batch.expiryDate <= new Date()) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Stock batch is expired or blocked');
    const remaining = reservation.quantityReserved - reservation.quantityDispensed - reservation.quantityReleased;
    if (input.quantity <= 0 || input.quantity > remaining || input.quantity > batch.quantityReserved || input.quantity > batch.quantityOnHand) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Requested quantity exceeds eligible reserved stock');
    const link = Array.from(this.prescriptionOrderItems.values()).find((value) => value.orderItemId === item.id);
    if (product.prescriptionRequired || product.prescriptionRequirement !== 'none' || product.requiresPharmacistApproval) {
      if (!link || !['approved', 'partially_approved'].includes(link.approvalStatus) || input.quantity > link.authorisedQuantity - link.dispensedQuantity) throw new InvalidDispensingError('NOT_ELIGIBLE', 'Approved prescription quantity is required');
    }
    const orderSnapshot = { ...order };
    const itemSnapshot = this.orderItems.get(order.id)!.map((value) => ({ ...value }));
    const batchSnapshot = { ...batch };
    const reservationSnapshot = { ...reservation };
    const linkSnapshot = link ? { ...link } : undefined;
    const movementCount = this.stockMovements.length;
    try {
    const updatedBatch = { ...batch, quantityOnHand: batch.quantityOnHand - input.quantity, quantityReserved: batch.quantityReserved - input.quantity, updatedAt: new Date() };
    this.stockBatches.set(batch.id, updatedBatch);
    const dispensed = reservation.quantityDispensed + input.quantity;
    const updatedReservation = { ...reservation, quantityDispensed: dispensed, status: dispensed + reservation.quantityReleased === reservation.quantityReserved ? 'fully_dispensed' : 'partially_dispensed', version: reservation.version + 1, updatedAt: new Date() } as InventoryReservation;
    this.inventoryReservations.set(reservation.id, updatedReservation);
    const updatedItem = { ...item, quantityDispensed: item.quantityDispensed + input.quantity, status: item.quantityDispensed + input.quantity === item.quantity ? 'fulfilled' : 'partially_fulfilled' } as OrderItem;
    this.orderItems.set(order.id, this.orderItems.get(order.id)!.map((value) => value.id === item.id ? updatedItem : value));
    if (link) this.prescriptionOrderItems.set(link.id, { ...link, dispensedQuantity: link.dispensedQuantity + input.quantity, approvalStatus: link.dispensedQuantity + input.quantity === link.authorisedQuantity ? 'fully_consumed' : link.approvalStatus, version: link.version + 1, updatedAt: new Date() });
    const updatedOrder = this.orderItems.get(order.id)!.every((value) => value.status === 'fulfilled') ? { ...order, status: 'fully_dispensed', updatedAt: new Date() } as Order : order;
    this.orders.set(order.id, updatedOrder);
    const record = { id: crypto.randomUUID(), branchId: order.branchId, orderId: order.id, orderItemId: item.id, prescriptionId: link?.prescriptionId ?? null, prescriptionOrderItemId: link?.id ?? null, reservationId: reservation.id, productId: item.productId, batchId: batch.id, quantity: input.quantity, dispensedBy: input.actorId, counsellingCompleted: input.counsellingCompleted, dispensingNote: input.notes ?? null, idempotencyKey: input.idempotencyKey, correlationId: input.correlationId ?? null, dispensedAt: new Date() } as DispensingRecord;
    this.dispensingRecords.set(input.idempotencyKey, record);
    this.stockMovements.push({ id: crypto.randomUUID(), productId: item.productId, batchId: batch.id, branchId: order.branchId, orderId: order.id, orderItemId: item.id, reservationId: reservation.id, movementType: 'dispense', quantityDelta: -input.quantity, balanceAfter: updatedBatch.quantityOnHand - updatedBatch.quantityReserved, quantityOnHandBefore: batch.quantityOnHand, quantityOnHandAfter: updatedBatch.quantityOnHand, quantityReservedBefore: batch.quantityReserved, quantityReservedAfter: updatedBatch.quantityReserved, reason: 'Dispensed against reserved customer order', performedBy: input.actorId, correlationId: input.correlationId ?? null, createdAt: new Date() });
    await this.createAuditLog({ ...audit, entityId: record.id });
    return { record, order: updatedOrder, item: updatedItem, reservation: updatedReservation, idempotentReplay: false };
    } catch (error) {
      this.orders.set(order.id, orderSnapshot);
      this.orderItems.set(order.id, itemSnapshot);
      this.stockBatches.set(batch.id, batchSnapshot);
      this.inventoryReservations.set(reservation.id, reservationSnapshot);
      if (linkSnapshot) this.prescriptionOrderItems.set(linkSnapshot.id, linkSnapshot);
      this.dispensingRecords.delete(input.idempotencyKey);
      this.stockMovements.length = movementCount;
      throw error;
    }
  }

  async cancelOrderWithAudit(input: { orderId: string; actorId: string; reasonCode: string; reason: string; idempotencyKey: string; correlationId?: string }, audit: InsertAuditLog): Promise<OrderCancellationResult> {
    const order = this.orders.get(input.orderId);
    if (!order) throw new InvalidOrderCancellationError('NOT_FOUND', 'Order not found');
    const reservations = await this.getReservationsByOrder(order.id);
    if (order.status === 'cancelled' || order.status === 'partially_cancelled') {
      if (order.cancellationIdempotencyKey !== input.idempotencyKey) {
        throw new InvalidOrderCancellationError('IDEMPOTENCY_CONFLICT', 'Order has already been cancelled');
      }
      return {
        order,
        releasedReservations: reservations.filter((reservation) => reservation.quantityReleased > 0).map((reservation) => ({
          reservationId: reservation.id, productId: reservation.productId, batchId: reservation.batchId,
          quantityReleased: reservation.quantityReleased,
        })),
        idempotentReplay: true,
      };
    }
    if (!['pending', 'confirmed', 'processing', 'ready'].includes(order.status)) {
      throw new InvalidOrderCancellationError('NOT_ELIGIBLE', `Order in ${order.status} status cannot be cancelled`);
    }

    const orderSnapshot = { ...order };
    const batchSnapshot = new Map(Array.from(this.stockBatches.entries(), ([id, batch]) => [id, { ...batch }]));
    const reservationSnapshot = new Map(Array.from(this.inventoryReservations.entries(), ([id, reservation]) => [id, { ...reservation }]));
    const movementCount = this.stockMovements.length;
    const releasedReservations: ReleasedReservation[] = [];
    let hasDispensedQuantity = false;
    try {
      for (const reservation of reservations.filter((item) => ['active', 'partially_dispensed', 'partially_released'].includes(item.status))) {
        const releasable = Math.max(0, reservation.quantityReserved - reservation.quantityDispensed - reservation.quantityReleased);
        if (reservation.quantityDispensed > 0) hasDispensedQuantity = true;
        if (releasable === 0) continue;
        const batch = this.stockBatches.get(reservation.batchId);
        if (!batch || batch.quantityReserved < releasable) throw new InvalidOrderCancellationError('NOT_ELIGIBLE', 'Reservation and batch balances are inconsistent');
        const reservedAfter = batch.quantityReserved - releasable;
        this.stockBatches.set(batch.id, { ...batch, quantityReserved: reservedAfter, updatedAt: new Date() });
        this.inventoryReservations.set(reservation.id, {
          ...reservation,
          quantityReleased: reservation.quantityReleased + releasable,
          status: reservation.quantityDispensed > 0 ? 'partially_released' : 'released',
          version: reservation.version + 1,
          updatedAt: new Date(),
        });
        this.stockMovements.push({
          id: crypto.randomUUID(), productId: reservation.productId, batchId: reservation.batchId,
          branchId: reservation.branchId, orderId: order.id, orderItemId: reservation.orderItemId,
          reservationId: reservation.id, movementType: 'release', quantityDelta: releasable,
          balanceAfter: batch.quantityOnHand - reservedAfter,
          quantityOnHandBefore: batch.quantityOnHand, quantityOnHandAfter: batch.quantityOnHand,
          quantityReservedBefore: batch.quantityReserved, quantityReservedAfter: reservedAfter,
          reason: input.reason, performedBy: input.actorId, correlationId: input.correlationId ?? null, createdAt: new Date(),
        });
        releasedReservations.push({ reservationId: reservation.id, productId: reservation.productId, batchId: reservation.batchId, quantityReleased: releasable });
      }
      const cancelledOrder = {
        ...order,
        status: hasDispensedQuantity ? 'partially_cancelled' : 'cancelled',
        cancellationReasonCode: input.reasonCode,
        cancellationReason: input.reason,
        cancelledBy: input.actorId,
        cancelledAt: new Date(),
        cancellationIdempotencyKey: input.idempotencyKey,
        updatedAt: new Date(),
      } as Order;
      this.orders.set(order.id, cancelledOrder);
      await this.createAuditLog({ ...audit, entityId: order.id });
      return { order: cancelledOrder, releasedReservations, idempotentReplay: false };
    } catch (error) {
      this.orders.set(order.id, orderSnapshot);
      this.stockBatches = batchSnapshot;
      this.inventoryReservations = reservationSnapshot;
      this.stockMovements.length = movementCount;
      throw error;
    }
  }

  async reviewPrescriptionWithAudit(id: string, expectedStatus: Prescription['status'], prescriptionData: Partial<InsertPrescription>, audit: InsertAuditLog): Promise<Prescription | undefined> {
    const previous = this.prescriptions.get(id);
    if (!previous || previous.status !== expectedStatus) return undefined;
    try {
      const prescription = await this.updatePrescription(id, prescriptionData);
      await this.createAuditLog(audit);
      return prescription;
    } catch (error) {
      this.prescriptions.set(id, previous);
      throw error;
    }
  }

  // Deliveries
  async getAllDeliveriesForOperations(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values());
  }

  async getDelivery(id: string): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }

  async getAssignedDelivery(id: string, driverId: string): Promise<Delivery | undefined> {
    if (!id || !driverId) return undefined;
    const delivery = this.deliveries.get(id);
    return delivery?.driverId === driverId ? delivery : undefined;
  }

  async getDeliveriesByDriver(driverId: string): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(d => d.driverId === driverId);
  }

  async getActiveDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(d => d.status !== 'delivered');
  }

  async createDelivery(deliveryData: InsertDelivery): Promise<Delivery> {
    const id = Math.random().toString(36).substring(7);
    const delivery = { id, ...deliveryData, createdAt: new Date(), updatedAt: new Date() } as Delivery;
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
  async getAllAppointmentsForOperations(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentForPatient(id: string, patientId: string): Promise<Appointment | undefined> {
    if (!id || !patientId) return undefined;
    const appointment = this.appointments.get(id);
    return appointment?.patientId === patientId ? appointment : undefined;
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(a => a.patientId === patientId);
  }

  async getAppointmentsByPractitioner(practitionerId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(a => a.practitionerId === practitionerId);
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = Math.random().toString(36).substring(7);
    const appointment = { id, ...appointmentData, createdAt: new Date(), updatedAt: new Date() } as Appointment;
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
    const content = { id, ...contentData, createdAt: new Date(), updatedAt: new Date() } as ContentItem;
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
    const log: AuditLog = {
      id, userId: logData.userId ?? null, action: logData.action,
      entityType: logData.entityType ?? null, entityId: logData.entityId ?? null,
      changes: logData.changes ?? null, ipAddress: logData.ipAddress ?? null,
      userAgent: logData.userAgent ?? null, timestamp: new Date(),
    };
    this.auditLogs.push(log);
    return log;
  }

  async getAuditLogs(limit?: number): Promise<AuditLog[]> {
    const logs = this.auditLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? logs.slice(0, limit) : logs;
  }

  async createEmergencyAccessGrant(grant: InsertEmergencyAccessGrant): Promise<EmergencyAccessGrant> {
    const created = { id: crypto.randomUUID(), reviewState: 'pending', ...grant } as EmergencyAccessGrant;
    this.emergencyAccessGrants.set(created.id, created);
    return created;
  }

  async createEmergencyAccessGrantWithAudit(grant: InsertEmergencyAccessGrant, audit: InsertAuditLog): Promise<EmergencyAccessGrant> {
    const created = await this.createEmergencyAccessGrant(grant);
    try {
      await this.createAuditLog(audit);
      return created;
    } catch (error) {
      this.emergencyAccessGrants.delete(created.id);
      throw error;
    }
  }

  async getEmergencyAccessGrant(id: string): Promise<EmergencyAccessGrant | undefined> {
    if (!id) return undefined;
    return this.emergencyAccessGrants.get(id);
  }

  async reviewEmergencyAccessGrant(id: string, changes: Partial<InsertEmergencyAccessGrant>): Promise<EmergencyAccessGrant | undefined> {
    const grant = this.emergencyAccessGrants.get(id);
    if (!grant || grant.reviewState !== 'pending') return undefined;
    const updated = { ...grant, ...changes } as EmergencyAccessGrant;
    this.emergencyAccessGrants.set(id, updated);
    return updated;
  }

  async updateAppointmentWithAudit(id: string, appointmentData: Partial<InsertAppointment>, audit: InsertAuditLog): Promise<Appointment> {
    const previous = this.appointments.get(id);
    const updated = await this.updateAppointment(id, appointmentData);
    try {
      await this.createAuditLog(audit);
      return updated;
    } catch (error) {
      if (previous) this.appointments.set(id, previous);
      throw error;
    }
  }

  async reviewEmergencyAccessGrantWithAudit(id: string, changes: Partial<InsertEmergencyAccessGrant>, audit: InsertAuditLog): Promise<EmergencyAccessGrant | undefined> {
    const previous = this.emergencyAccessGrants.get(id);
    const updated = await this.reviewEmergencyAccessGrant(id, changes);
    if (!updated) return undefined;
    try {
      await this.createAuditLog(audit);
      return updated;
    } catch (error) {
      if (previous) this.emergencyAccessGrants.set(id, previous);
      throw error;
    }
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

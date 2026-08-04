import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storageManager";
import { InsufficientStockError, InvalidDispensingError, InvalidOrderCancellationError, InvalidStockAdjustmentError } from "./storageErrors";
import { authenticateToken, requirePermission } from "./authMiddleware";
import { canRoleAssign, hasPermission, HEALTHCARE_ROLES, normalizeHealthcareRole, PERMISSIONS } from "@shared/healthcareAccess";
import { registerAuthRoutes } from "./auth-routes";
import { logger } from "./logger";
import { validateInput, loginSchema, signupSchema } from "./validation";
import { userService } from "./userService";
import { setupAPIDocsRoute } from "./apiDocs";
import { registerEmailRoutes } from "./email-routes";
import { notificationService } from "./notificationService";
import { clinicalDecisionSupportService } from "./clinicalDecisionSupport";
import { inventoryIntelligenceService } from "./inventoryIntelligence";
import { buildAuditEvent, recordAuditEvent } from "./auditService";
import { z } from "zod";
import { insertBranchSchema, insertContentItemSchema, insertDeliverySchema, insertProductSchema, insertStockBatchSchema } from "@shared/schema";
import { healthCheck, readinessCheck } from "./healthCheck";
import { authService } from "./authSystem";
import { breakGlassService } from "./breakGlassService";
import {
  canCreateAppointmentFor,
  canInitiatePayment,
  canManageDelivery,
  canReadOrder,
  canReadPatientData,
  canReadPatientRecord,
  canUpdateAppointment,
  canUpdateOrder,
} from "./authorization";

async function canReadPatientFromRequest(req: { user?: { id: string; role: string }; headers: Record<string, unknown> }, patientId: string): Promise<boolean> {
  if (!req.user) return false;
  if (canReadPatientData(req.user, patientId)) return true;
  const grantId = typeof req.headers['x-emergency-access-id'] === 'string' ? req.headers['x-emergency-access-id'] : '';
  const grant = await breakGlassService.getValidGrant(grantId, req.user.id, patientId);
  return Boolean(grant && canReadPatientRecord(req.user, {
    patientId,
    emergencyAccess: { active: true, expiresAt: grant.expiresAt, reason: grant.justification, elevatedAuth: true },
  }));
}

const orderUpdateSchema = z.object({
  status: z.enum(['confirmed', 'processing', 'ready', 'in_transit', 'delivered']).optional(),
  notes: z.string().max(2000).nullable().optional(),
  deliveryAddress: z.string().max(500).nullable().optional(),
  deliveryCity: z.string().max(100).nullable().optional(),
}).strict();
const orderStatusTransitions: Record<string, readonly string[]> = {
  pending: ['confirmed', 'processing'],
  confirmed: ['processing'],
  processing: ['ready'],
  ready: ['in_transit', 'delivered'],
  in_transit: ['delivered'],
  delivered: [],
  partially_cancelled: [],
  fully_dispensed: [],
  cancelled: [],
};

const orderCreateSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    batchId: z.string().optional(),
    quantity: z.number().int().positive().max(1000),
  }).strict()).min(1).max(100),
  branchId: z.string(),
  prescriptionId: z.string().optional(),
  deliveryAddress: z.string().max(500).optional(),
  deliveryCity: z.string().max(100).optional(),
  deliveryLatitude: z.coerce.number().min(-90).max(90).optional(),
  deliveryLongitude: z.coerce.number().min(-180).max(180).optional(),
  paymentMethod: z.enum(['cash', 'airtel_money', 'tnm_mpamba', 'card', 'bank_transfer']).optional(),
}).strict();
const paymentInitiationSchema = z.object({
  orderId: z.string(),
  method: z.enum(['airtel_money', 'tnm_mpamba', 'card', 'cash']),
  phoneNumber: z.string().min(9).max(20),
}).strict();
const orderCancellationSchema = z.object({
  reasonCode: z.enum(['CUSTOMER_REQUEST', 'PRESCRIPTION_REJECTED', 'PAYMENT_FAILED', 'OPERATIONAL']),
  reason: z.string().trim().min(10).max(1000),
}).strict();
const prescriptionItemReviewSchema = z.object({
  orderItemId: z.string(),
  decision: z.enum(['approve', 'partially_approve', 'reject']),
  authorisedQuantity: z.number().int().positive().max(10000).optional(),
  substitutionAllowed: z.boolean().optional(),
  clinicalNote: z.string().trim().min(10).max(2000).optional(),
  rejectionReason: z.string().trim().min(10).max(1000).optional(),
}).strict().superRefine((value, context) => {
  if (value.decision !== 'reject' && value.authorisedQuantity === undefined) context.addIssue({ code: 'custom', path: ['authorisedQuantity'], message: 'Authorised quantity is required' });
  if (value.decision === 'reject' && !value.rejectionReason) context.addIssue({ code: 'custom', path: ['rejectionReason'], message: 'Rejection reason is required' });
});
const prescriptionRevocationSchema = z.object({
  reason: z.string().trim().min(20).max(2000),
}).strict();
const dispenseItemSchema = z.object({
  reservationId: z.string(), quantity: z.number().int().positive().max(10000),
  idempotencyKey: z.string().min(8).max(128), counsellingCompleted: z.boolean(),
  notes: z.string().trim().max(2000).optional(),
}).strict();
const batchSubstitutionSchema = z.object({
  reservationId: z.string(), substituteBatchId: z.string(),
  idempotencyKey: z.string().min(8).max(128), reason: z.string().trim().min(20).max(2000),
}).strict();

const appointmentUpdateSchema = z.object({
  practitionerId: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
  scheduledAt: z.coerce.date().optional(),
  duration: z.number().int().min(5).max(480).optional(),
  type: z.enum(['video', 'phone', 'in-person']).optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  consultationNotes: z.string().max(10000).nullable().optional(),
  prescriptionGenerated: z.string().nullable().optional(),
  videoRoomId: z.string().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
}).strict();

const patientAppointmentUpdateSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  duration: z.number().int().min(5).max(120).optional(),
  type: z.enum(['video', 'phone', 'in-person']).optional(),
  status: z.literal('cancelled').optional(),
}).strict();

const appointmentStatusTransitions: Record<string, readonly string[]> = {
  scheduled: ['confirmed', 'cancelled', 'no_show'],
  confirmed: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
};

const customerAppointmentCreateSchema = z.object({
  branchId: z.string().nullable().optional(),
  scheduledAt: z.coerce.date(),
  duration: z.number().int().min(5).max(120).optional(),
  type: z.enum(['video', 'phone', 'in-person']),
  chiefComplaint: z.string().max(2000).nullable().optional(),
}).strict();

const selfProfileUpdateSchema = z.object({
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  profileImageUrl: z.string().url().max(2000).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  allergies: z.array(z.string().max(200)).max(100).nullable().optional(),
  chronicConditions: z.array(z.string().max(200)).max(100).nullable().optional(),
  vehicleInfo: z.string().max(1000).nullable().optional(),
  licenseNumber: z.string().max(100).nullable().optional(),
}).strict();

const stockBatchCreateSchema = insertStockBatchSchema.omit({ quantityReserved: true }).extend({
  expiryDate: z.coerce.date(),
  receivedAt: z.coerce.date().nullable().optional(),
}).strict();
const stockBatchUpdateSchema = stockBatchCreateSchema.omit({ quantityOnHand: true, branchId: true }).partial().strict();
const stockAdjustmentSchema = z.object({
  quantityDelta: z.number().int().min(-1000000).max(1000000).refine((value) => value !== 0, 'Quantity delta must not be zero'),
  reason: z.string().trim().min(10).max(1000),
}).strict();
const productCreateSchema = insertProductSchema.strict();
const productUpdateSchema = productCreateSchema.partial().strict();
const prescriptionCreateSchema = z.object({
  fileUrl: z.string().url().max(2000).nullable().optional(),
  prescriberName: z.string().trim().min(2).max(255),
  facilityName: z.string().trim().min(2).max(255),
  expiresAt: z.coerce.date(),
  patientAllergies: z.array(z.string().max(200)).max(100).nullable().optional(),
  patientConditions: z.array(z.string().max(200)).max(100).nullable().optional(),
  prescribedMedications: z.array(z.object({
    productId: z.string(),
    dosage: z.string().max(200),
    frequency: z.string().max(200),
    duration: z.string().max(200),
    quantity: z.number().int().positive().max(10000),
  }).strict()).max(100).optional(),
}).strict();
const prescriptionReviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'dispensed']),
  reviewNotes: z.string().max(5000).nullable().optional(),
}).strict();

const prescriptionStatusTransitions: Record<string, readonly string[]> = {
  pending: ['approved', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: [],
  rejected: [],
  dispensed: [],
};
const deliveryCreateSchema = insertDeliverySchema.pick({ orderId: true, driverId: true, estimatedDeliveryTime: true }).strict();
const deliveryStatusSchema = z.object({
  status: z.enum(['assigned', 'picked_up', 'in_transit', 'delivered', 'failed']),
  proofOfDeliveryUrl: z.string().url().max(2000).optional(),
  deliveryNotes: z.string().max(5000).optional(),
}).strict();
const branchCreateSchema = insertBranchSchema.strict();
const branchUpdateSchema = branchCreateSchema.partial().strict();
const contentCreateSchema = insertContentItemSchema.omit({ authorId: true, viewCount: true, publishedAt: true }).strict();
const contentUpdateSchema = contentCreateSchema.partial().strict();
const staffAppointmentCreateSchema = customerAppointmentCreateSchema.extend({
  patientId: z.string(),
  practitionerId: z.string().nullable().optional(),
}).strict();
const breakGlassActivationSchema = z.object({
  patientId: z.string(),
  reasonCode: z.enum(['immediate_threat', 'continuity_of_care', 'system_outage']),
  justification: z.string().min(20).max(2000),
  durationMinutes: z.number().int().min(1).max(15).default(15),
  password: z.string().min(1).max(500),
}).strict();
const breakGlassReviewSchema = z.object({
  state: z.enum(['approved', 'rejected', 'closed']),
  notes: z.string().min(10).max(2000),
}).strict();

// Helper function to calculate distance-based delivery cost
function calculateDeliveryCost(distanceKm: number): number {
  // Base fee: 500 MK, then 50 MK per km
  const baseFee = 500;
  const costPerKm = 50;
  return baseFee + Math.ceil(distanceKm * costPerKm);
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get('/health', healthCheck);
  app.get('/ready', readinessCheck);
  app.get('/api/health', healthCheck);
  app.get('/api/ready', readinessCheck);

  // Register new production auth routes
  registerAuthRoutes(app);

  // Register email routes
  registerEmailRoutes(app);

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================
  
  app.get('/api/auth/user', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const email = req.user.email || '';
      
      // Ensure user exists in storage by upserting
      const user = await getStorage().upsertUser({
        id: userId,
        email,
        firstName: req.user.firstName || 'User',
        lastName: req.user.lastName || '',
        role: normalizeHealthcareRole(req.user.role) || 'patient',
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  app.patch('/api/orders/:id/approve', authenticateToken, requirePermission(PERMISSIONS.ORDER_MANAGE), async (req, res) => {
    try {
      const order = await getStorage().updateOrder(req.params.id, { status: 'confirmed' });
      await recordAuditEvent(req, { action: 'order.approve', entityType: 'order', entityId: req.params.id, changes: { status: 'confirmed' } });
      res.json(order);
    } catch (error) {
      console.error("Error approving order:", error);
      res.status(500).json({ message: "Failed to approve order" });
    }
  });

  app.patch('/api/orders/:id/reject', authenticateToken, requirePermission(PERMISSIONS.ORDER_MANAGE), async (req, res) => {
    try {
      const order = await getStorage().updateOrder(req.params.id, { status: 'cancelled' });
      await recordAuditEvent(req, { action: 'order.reject', entityType: 'order', entityId: req.params.id, changes: { status: 'cancelled' } });
      res.json(order);
    } catch (error) {
      console.error("Error rejecting order:", error);
      res.status(500).json({ message: "Failed to reject order" });
    }
  });

  app.get('/api/staff/approvals', authenticateToken, requirePermission(PERMISSIONS.ORDER_MANAGE), async (req, res) => {
    try {
      const orders = await getStorage().getAllOrdersForOperations();
      const pendingOrders = orders.filter(o => o.status === 'pending');
      const ordersWithDetails = await Promise.all(
        pendingOrders.map(async (order) => {
          const customer = await getStorage().getUser(order.customerId);
          return { ...order, customer, requiresApproval: true };
        })
      );
      res.json(ordersWithDetails);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      res.status(500).json({ message: "Failed to fetch approvals" });
    }
  });

  app.get('/api/staff/members', authenticateToken, requirePermission(PERMISSIONS.STAFF_MANAGE_BRANCH), async (req, res) => {
    try {
      const staff = await getStorage().getUsersByRole('receptionist');
      res.json(staff.map(s => ({ ...s, status: 'active', lastActive: 'Just now' })));
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.get('/api/staff/support-tickets', authenticateToken, requirePermission(PERMISSIONS.NOTIFICATION_SEND), async (req, res) => {
    try {
      // Get support tickets - placeholder returns empty for now
      // In production, this would query a support_tickets table
      res.json([]);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.get('/api/admin/stats', authenticateToken, requirePermission(PERMISSIONS.REPORT_VIEW), async (req, res) => {
    try {
      const stats = await getStorage().getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/inventory', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_READ), async (req, res) => {
    try {
      const batches = await getStorage().getStockBatches();
      // Fetch related product and branch data
      const batchesWithDetails = await Promise.all(
        batches.map(async (batch) => {
          const product = await getStorage().getProduct(batch.productId);
          const branch = await getStorage().getBranch(batch.branchId);
          return { ...batch, product, branch };
        })
      );
      res.json(batchesWithDetails);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get('/api/admin/branches', authenticateToken, requirePermission(PERMISSIONS.BRANCH_MANAGE), async (req, res) => {
    try {
      const branches = await getStorage().getBranches();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  app.get('/api/admin/users', authenticateToken, requirePermission(PERMISSIONS.STAFF_MANAGE_SYSTEM), async (req, res) => {
    try {
      const { role, branchId } = req.query;
      let users;
      
      if (role) {
        users = await getStorage().getUsersByRole(role as string);
      } else if (branchId) {
        users = await getStorage().getUsersByBranch(branchId as string);
      } else {
        users = await getStorage().getAllUsersForAdministration();
      }
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/role', authenticateToken, requirePermission(PERMISSIONS.STAFF_MANAGE_SYSTEM), async (req, res) => {
    try {
      const { role, branchId } = z.object({ role: z.enum(HEALTHCARE_ROLES), branchId: z.string().optional() }).strict().parse(req.body);
      if (req.params.id === req.user!.id || !canRoleAssign(req.user!.role, role)) {
        await recordAuditEvent(req, { action: 'user.role.change.denied', entityType: 'user', entityId: req.params.id, changes: { requestedRole: role } });
        return res.status(403).json({ message: 'Forbidden' });
      }
      const audit = buildAuditEvent(req, { action: 'user.role.change', entityType: 'user', entityId: req.params.id, changes: { role, branchId: branchId ?? null } });
      const user = await getStorage().assignUserRoleWithAudit(req.params.id, role, branchId, audit);
      authService.logout(req.params.id);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // ============================================================================
  // INVENTORY/STOCK ROUTES
  // ============================================================================

  app.post('/api/admin/inventory/batch', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req, res) => {
    try {
      const input = stockBatchCreateSchema.parse(req.body);
      if (!req.user!.branchId || input.branchId !== req.user!.branchId) return res.status(403).json({ message: 'Cannot receive stock for another branch' });
      const audit = buildAuditEvent(req, {
        action: 'stock.received', entityType: 'stock_batch',
        changes: { productId: input.productId, branchId: input.branchId, batchNumber: input.batchNumber, quantityOnHand: input.quantityOnHand },
      });
      const batch = await getStorage().createStockBatchWithAudit(input, audit);
      res.status(201).json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid stock batch', errors: error.issues });
      console.error("Error creating stock batch:", error);
      res.status(500).json({ message: "Failed to create stock batch" });
    }
  });

  app.patch('/api/admin/inventory/batch/:id', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req, res) => {
    try {
      if (!req.user!.branchId) return res.status(403).json({ message: 'Branch assignment required' });
      const changes = stockBatchUpdateSchema.parse(req.body);
      const audit = buildAuditEvent(req, { action: 'stock.batch.update', entityType: 'stock_batch', entityId: req.params.id, changes });
      const batch = await getStorage().updateStockBatchWithAudit(req.params.id, req.user!.branchId, changes, audit);
      if (!batch) return res.status(404).json({ message: 'Stock batch not found' });
      res.json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid stock batch update', errors: error.issues });
      console.error("Error updating stock batch:", error);
      res.status(500).json({ message: "Failed to update stock batch" });
    }
  });

  app.post('/api/admin/inventory/batch/:id/adjust', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req, res) => {
    try {
      if (!req.user!.branchId) return res.status(403).json({ message: 'Branch assignment required' });
      const { quantityDelta, reason } = stockAdjustmentSchema.parse(req.body);
      const audit = buildAuditEvent(req, {
        action: 'stock.adjusted', entityType: 'stock_batch', entityId: req.params.id,
        changes: { quantityDelta, reason },
      });
      const batch = await getStorage().adjustStockBatchWithAudit(req.params.id, req.user!.branchId, quantityDelta, reason, audit);
      if (!batch) return res.status(404).json({ message: 'Stock batch not found' });
      res.json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid stock adjustment', errors: error.issues });
      if (error instanceof InvalidStockAdjustmentError) return res.status(409).json({ message: error.message });
      console.error("Error adjusting stock batch:", error);
      res.status(500).json({ message: "Failed to adjust stock batch" });
    }
  });

  app.get('/api/inventory/low-stock', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_READ), async (req, res) => {
    try {
      const { threshold } = req.query;
      const batches = await getStorage().getLowStockBatches(threshold ? parseInt(threshold as string) : 10);
      res.json(batches);
    } catch (error) {
      console.error("Error fetching low stock batches:", error);
      res.status(500).json({ message: "Failed to fetch low stock batches" });
    }
  });

  app.get('/api/inventory/expiring', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_READ), async (req, res) => {
    try {
      const { days } = req.query;
      const batches = await getStorage().getExpiringBatches(days ? parseInt(days as string) : 30);
      res.json(batches);
    } catch (error) {
      console.error("Error fetching expiring batches:", error);
      res.status(500).json({ message: "Failed to fetch expiring batches" });
    }
  });

  // ============================================================================
  // PRODUCT ROUTES
  // ============================================================================

  app.get('/api/products/categories', async (req, res) => {
    try {
      const products = await getStorage().getProducts();
      const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const products = await getStorage().getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/featured', async (req, res) => {
    try {
      const products = await getStorage().getFeaturedProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await getStorage().getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/admin/products', authenticateToken, requirePermission(PERMISSIONS.PRODUCT_MANAGE), async (req, res) => {
    try {
      const product = await getStorage().createProduct(productCreateSchema.parse(req.body));
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch('/api/admin/products/:id', authenticateToken, requirePermission(PERMISSIONS.PRODUCT_MANAGE), async (req, res) => {
    try {
      const product = await getStorage().updateProduct(req.params.id, productUpdateSchema.parse(req.body));
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // ============================================================================
  // PRESCRIPTION ROUTES
  // ============================================================================

  app.get('/api/prescriptions/pending', authenticateToken, requirePermission(PERMISSIONS.PRESCRIPTION_DISPENSE), async (req, res) => {
    try {
      const prescriptions = await getStorage().getPendingPrescriptions();
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching pending prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get('/api/prescriptions/patient/:patientId', authenticateToken, async (req, res) => {
    try {
      if (!await canReadPatientFromRequest(req, req.params.patientId)) {
        return res.status(403).json({ message: 'Cannot access another patient prescription history' });
      }
      const prescriptions = await getStorage().getPrescriptionsByPatient(req.params.patientId);
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching patient prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get('/api/prescriptions/:id', authenticateToken, async (req, res) => {
    try {
      const prescription = normalizeHealthcareRole(req.user!.role) === 'patient'
        ? await getStorage().getPrescriptionForPatient(req.params.id, req.user!.id)
        : await getStorage().getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      if (!await canReadPatientFromRequest(req, prescription.patientId)) {
        return res.status(403).json({ message: 'Cannot access another patient prescription' });
      }
      res.json(prescription);
    } catch (error) {
      console.error("Error fetching prescription:", error);
      res.status(500).json({ message: "Failed to fetch prescription" });
    }
  });

  app.post('/api/prescriptions', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const prescriptionData = {
        ...prescriptionCreateSchema.parse(req.body),
        patientId: userId,
        status: 'pending' as const,
      };
      
      const prescription = await getStorage().createPrescription(prescriptionData);
      await recordAuditEvent(req, { action: 'prescription.create', entityType: 'prescription', entityId: prescription.id, changes: { patientId: userId, status: 'pending' } });
      res.status(201).json(prescription);
    } catch (error) {
      console.error("Error creating prescription:", error);
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  app.patch('/api/prescriptions/:id/review', authenticateToken, requirePermission(PERMISSIONS.PRESCRIPTION_DISPENSE), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { status, reviewNotes } = prescriptionReviewSchema.parse(req.body);
      
      const existingPrescription = await getStorage().getPrescription(req.params.id);
      if (!existingPrescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      if (!prescriptionStatusTransitions[existingPrescription.status]?.includes(status)) {
        return res.status(409).json({ message: 'Prescription state transition is not permitted' });
      }
      const alerts = clinicalDecisionSupportService.evaluatePrescription(
        Array.isArray(existingPrescription.prescribedMedications) ? existingPrescription.prescribedMedications as any : [],
        { allergies: existingPrescription.patientAllergies || [], conditions: existingPrescription.patientConditions || [] },
      );
      if (status === 'approved' && alerts.some((alert) => alert.requiresOverride) && !reviewNotes?.includes('OVERRIDE:')) {
        return res.status(409).json({ message: 'Clinical safety override justification required before approval', alerts });
      }

      const audit = buildAuditEvent(req, { action: 'prescription.review', entityType: 'prescription', entityId: req.params.id, changes: { status, reviewedBy: userId, alertCount: alerts.length } });
      const prescription = await getStorage().reviewPrescriptionWithAudit(req.params.id, existingPrescription.status, {
        status,
        reviewNotes,
        reviewedBy: userId,
        reviewedAt: new Date(),
      }, audit);
      if (!prescription) return res.status(409).json({ message: 'Prescription state changed; reload and retry' });
      
      res.json(prescription);
    } catch (error) {
      console.error("Error reviewing prescription:", error);
      res.status(500).json({ message: "Failed to review prescription" });
    }
  });

  // ============================================================================
  // ORDER ROUTES
  // ============================================================================

  app.get('/api/orders', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let orders;
      if (normalizeHealthcareRole(req.user.role) === 'patient') {
        orders = await getStorage().getOrdersByCustomer(userId);
      } else if (canUpdateOrder(req.user)) {
        orders = await getStorage().getAllOrdersForOperations();
      } else {
        return res.status(403).json({ message: "Cannot list orders" });
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
      const order = normalizeHealthcareRole(req.user!.role) === 'patient'
        ? await getStorage().getOrderForOwner(req.params.id, req.user!.id)
        : await getStorage().getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (!canReadOrder(req.user!, order)) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const items = await getStorage().getOrderItems(order.id);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { items, branchId, prescriptionId, deliveryAddress, deliveryCity, deliveryLatitude, deliveryLongitude, paymentMethod } = orderCreateSchema.parse(req.body);
      
      // Calculate totals
      let subtotal = 0;
      const orderLineItems: Array<{ productId: string; batchId?: string; quantity: number; unitPrice: string; subtotal: string; prescriptionLink?: { prescriptionId: string; prescribedQuantity: number } }> = [];
      const linkedPrescription = prescriptionId ? await getStorage().getPrescriptionForPatient(prescriptionId, userId) : undefined;
      for (const item of items) {
        const product = await getStorage().getProduct(item.productId);
        if (!product) return res.status(400).json({ message: "Unknown product" });
        if (!product.onlineSaleAllowed || product.prescriptionRequirement === 'restricted_online') return res.status(409).json({ message: 'Product is restricted from online ordering', productId: product.id });
        const requiresPrescription = product.prescriptionRequired || product.prescriptionRequirement !== 'none' || product.requiresPharmacistApproval;
        let prescriptionLink: { prescriptionId: string; prescribedQuantity: number } | undefined;
        if (requiresPrescription) {
          if (!linkedPrescription) return res.status(409).json({ message: 'A patient-owned prescription is required for this product', productId: product.id });
          if (linkedPrescription.revokedAt || ['revoked', 'cancelled', 'expired', 'rejected'].includes(linkedPrescription.status) || (linkedPrescription.expiresAt && linkedPrescription.expiresAt <= new Date())) return res.status(409).json({ message: 'Prescription is not valid', productId: product.id });
          const medication = Array.isArray(linkedPrescription.prescribedMedications) ? (linkedPrescription.prescribedMedications as Array<{ productId?: string; quantity?: number }>).find((entry) => entry.productId === product.id) : undefined;
          if (!medication?.quantity || item.quantity > medication.quantity) return res.status(409).json({ message: 'Product or quantity is not covered by the prescription', productId: product.id });
          prescriptionLink = { prescriptionId: linkedPrescription.id, prescribedQuantity: medication.quantity };
        }
        const lineSubtotal = parseFloat(product.price) * item.quantity;
        subtotal += lineSubtotal;
        orderLineItems.push({ ...item, unitPrice: product.price, subtotal: lineSubtotal.toString(), prescriptionLink });
      }
      
      // Calculate delivery cost if delivery info provided
      let deliveryCharge = 500; // Base fee
      let distance = 0;
      if (deliveryLatitude && deliveryLongitude) {
        // Simple distance calculation (rough approximation)
        distance = Math.sqrt(
          Math.pow(deliveryLatitude - (-15.4167), 2) +
          Math.pow(deliveryLongitude - 28.2833, 2)
        ) * 111; // Rough km conversion
        deliveryCharge = calculateDeliveryCost(distance);
      }
      
      const total = subtotal + deliveryCharge;
      
      // Create order
      const audit = buildAuditEvent(req, {
        action: 'order.created',
        entityType: 'order',
        changes: {
          branchId: branchId || 'default-branch-id',
          itemCount: orderLineItems.length,
          subtotal: subtotal.toString(),
          deliveryCharge: deliveryCharge.toString(),
          total: total.toString(),
          deliveryRequired: Boolean(deliveryAddress),
          paymentMethod: paymentMethod || 'cash',
        },
      });
      const { order, items: createdItems } = await getStorage().createOrderWithItemsAndAudit({
        customerId: userId,
        branchId: branchId || 'default-branch-id',
        prescriptionId,
        subtotal: subtotal.toString(),
        deliveryCharge: deliveryCharge.toString(),
        total: total.toString(),
        deliveryAddress,
        deliveryCity,
        deliveryLatitude: deliveryLatitude?.toString(),
        deliveryLongitude: deliveryLongitude?.toString(),
        deliveryDistance: distance.toString(),
        paymentMethod: paymentMethod || 'cash',
        status: 'pending',
        paymentStatus: 'pending',
      }, orderLineItems, audit);
      
      res.status(201).json({ ...order, items: createdItems });
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        return res.status(409).json({ message: "Insufficient eligible stock", productId: error.productId });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.post('/api/orders/:orderId/items/:orderItemId/dispense', authenticateToken, requirePermission(PERMISSIONS.DISPENSING_COMPLETE), async (req, res) => {
    try {
      const payload = dispenseItemSchema.parse(req.body);
      const order = await getStorage().getOrder(req.params.orderId);
      if (!order || (req.user!.branchId && order.branchId !== req.user!.branchId)) return res.status(404).json({ message: 'Order not found' });
      const orderItem = (await getStorage().getOrderItems(order.id)).find((item) => item.id === req.params.orderItemId);
      if (!orderItem) return res.status(404).json({ message: 'Order item not found' });
      const product = await getStorage().getProduct(orderItem.productId);
      if (product?.controlledMedicine && !hasPermission(req.user!.role, PERMISSIONS.CONTROLLED_MEDICINE_DISPENSE)) return res.status(403).json({ message: 'Controlled-medicine dispensing permission is required' });
      const result = await getStorage().dispenseOrderItem({ ...payload, orderId: order.id, orderItemId: req.params.orderItemId, actorId: req.user!.id, controlledMedicineAuthorized: hasPermission(req.user!.role, PERMISSIONS.CONTROLLED_MEDICINE_DISPENSE), correlationId: res.locals.requestId }, buildAuditEvent(req, {
        action: 'dispensing.completed', entityType: 'dispensing_record',
        changes: { orderId: order.id, orderItemId: req.params.orderItemId, reservationId: payload.reservationId, quantity: payload.quantity, counsellingCompleted: payload.counsellingCompleted, actorRole: req.user!.role },
      }));
      res.json({ success: true, idempotentReplay: result.idempotentReplay, dispensingRecordId: result.record.id, orderStatus: result.order.status, itemStatus: result.item.status, reservationStatus: result.reservation.status });
    } catch (error) {
      if (error instanceof InvalidDispensingError) return res.status(error.code === 'NOT_FOUND' ? 404 : 409).json({ message: error.message });
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid dispensing request', issues: error.issues });
      logger.error('Order item dispensing failed', { error });
      res.status(500).json({ message: 'Failed to dispense order item' });
    }
  });

  app.post('/api/orders/:orderId/items/:orderItemId/substitute-batch', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_BATCH_SUBSTITUTE), async (req, res) => {
    try {
      const payload = batchSubstitutionSchema.parse(req.body);
      const order = await getStorage().getOrder(req.params.orderId);
      if (!order || (req.user!.branchId && order.branchId !== req.user!.branchId)) return res.status(404).json({ message: 'Order not found' });
      const result = await getStorage().substituteReservationBatch({ ...payload, orderId: order.id, orderItemId: req.params.orderItemId, actorId: req.user!.id, correlationId: res.locals.requestId }, buildAuditEvent(req, {
        action: 'inventory.batch_substituted', entityType: 'batch_substitution',
        changes: { orderId: order.id, orderItemId: req.params.orderItemId, originalReservationId: payload.reservationId, substituteBatchId: payload.substituteBatchId, reason: payload.reason, actorRole: req.user!.role },
      }));
      res.json({ success: true, idempotentReplay: result.idempotentReplay, substitutionId: result.substitution.id, originalReservationId: result.originalReservation.id, substituteReservationId: result.substituteReservation.id, quantity: result.substitution.quantity });
    } catch (error) {
      if (error instanceof InvalidDispensingError) return res.status(error.code === 'NOT_FOUND' ? 404 : 409).json({ message: error.message });
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid batch substitution request', issues: error.issues });
      logger.error('Batch substitution failed', { error });
      res.status(500).json({ message: 'Failed to substitute reservation batch' });
    }
  });

  app.post('/api/orders/:orderId/cancel', authenticateToken, requirePermission(PERMISSIONS.ORDER_CANCEL), async (req, res) => {
    try {
      const payload = orderCancellationSchema.parse(req.body);
      const idempotencyKey = z.string().min(8).max(128).parse(req.headers['idempotency-key']);
      const existingOrder = normalizeHealthcareRole(req.user!.role) === 'patient'
        ? await getStorage().getOrderForOwner(req.params.orderId, req.user!.id)
        : await getStorage().getOrder(req.params.orderId);
      if (!existingOrder || !canReadOrder(req.user!, existingOrder)) return res.status(404).json({ message: 'Order not found' });
      if (existingOrder.paymentStatus === 'completed' && !hasPermission(req.user!.role, PERMISSIONS.ORDER_CANCEL_AFTER_PAYMENT)) {
        return res.status(403).json({ message: 'Elevated approval is required to cancel a paid order' });
      }
      const result = await getStorage().cancelOrderWithAudit({
        orderId: existingOrder.id,
        actorId: req.user!.id,
        reasonCode: payload.reasonCode,
        reason: payload.reason,
        idempotencyKey,
        correlationId: res.locals.requestId,
      }, buildAuditEvent(req, {
        action: 'order.cancelled', entityType: 'order', entityId: existingOrder.id,
        changes: { previousStatus: existingOrder.status, reasonCode: payload.reasonCode, reason: payload.reason, actorRole: req.user!.role },
      }));

      if (!result.idempotentReplay) {
        const customer = await getStorage().getUser(result.order.customerId);
        try {
          await notificationService.enqueue({
            eventType: 'order.cancelled',
            channels: customer?.email ? ['email'] : [],
            recipient: { userId: result.order.customerId, email: customer?.email ?? undefined, firstName: customer?.firstName ?? undefined },
            template: 'custom',
            variables: { subject: 'Order cancelled', message: `Order ${result.order.id} was cancelled.` },
          });
        } catch (error) {
          logger.error('Order cancellation notification failed', { error, orderId: result.order.id });
        }
      }
      res.json({
        success: true,
        orderId: result.order.id,
        status: result.order.status,
        releasedReservations: result.releasedReservations,
        idempotentReplay: result.idempotentReplay,
      });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid cancellation request', errors: error.issues });
      if (error instanceof InvalidOrderCancellationError) {
        const status = error.code === 'NOT_FOUND' ? 404 : 409;
        return res.status(status).json({ message: error.message, code: error.code });
      }
      logger.error('Order cancellation failed', { error, orderId: req.params.orderId });
      res.status(500).json({ message: 'Failed to cancel order' });
    }
  });

  app.post('/api/prescriptions/:prescriptionId/review', authenticateToken, requirePermission(PERMISSIONS.PRESCRIPTION_REVIEW), async (req, res) => {
    try {
      const payload = prescriptionItemReviewSchema.parse(req.body);
      const permission = payload.decision === 'reject' ? PERMISSIONS.PRESCRIPTION_REJECT : PERMISSIONS.PRESCRIPTION_APPROVE;
      if (!hasPermission(req.user!.role, permission)) return res.status(403).json({ message: 'Prescription decision is not permitted' });
      const link = await getStorage().getPrescriptionOrderItem(req.params.prescriptionId, payload.orderItemId);
      if (!link) return res.status(404).json({ message: 'Prescription order-item linkage not found' });
      const order = await getStorage().getOrder(link.orderId);
      if (!order || (req.user!.branchId && order.branchId !== req.user!.branchId)) return res.status(404).json({ message: 'Prescription order-item linkage not found' });
      const reviewed = await getStorage().reviewPrescriptionOrderItem({ ...payload, prescriptionId: req.params.prescriptionId, actorId: req.user!.id }, buildAuditEvent(req, {
        action: `prescription.item.${payload.decision}`, entityType: 'prescription_order_item', entityId: link.id,
        changes: { prescriptionId: req.params.prescriptionId, orderId: link.orderId, orderItemId: link.orderItemId, productId: link.productId, previousStatus: link.approvalStatus, authorisedQuantity: payload.authorisedQuantity, actorRole: req.user!.role },
      }));
      res.json(reviewed);
    } catch (error) {
      if (error instanceof InvalidDispensingError) return res.status(error.code === 'NOT_FOUND' ? 404 : 409).json({ message: error.message });
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid prescription review request', issues: error.issues });
      logger.error('Prescription item review failed', { error });
      res.status(500).json({ message: 'Failed to review prescription item' });
    }
  });

  app.post('/api/prescriptions/:prescriptionId/revoke', authenticateToken, requirePermission(PERMISSIONS.PRESCRIPTION_REVOKE), async (req, res) => {
    try {
      const payload = prescriptionRevocationSchema.parse(req.body);
      const prescription = await getStorage().getPrescription(req.params.prescriptionId);
      if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
      const prescriptionLinks = await getStorage().getPrescriptionOrderItems(prescription.id);
      if (req.user!.branchId && prescriptionLinks.some((link) => link.branchId !== req.user!.branchId)) return res.status(404).json({ message: 'Prescription not found' });
      const result = await getStorage().revokePrescriptionWithAudit({ prescriptionId: prescription.id, actorId: req.user!.id, reason: payload.reason, correlationId: res.locals.requestId }, buildAuditEvent(req, {
        action: 'prescription.revoked', entityType: 'prescription', entityId: prescription.id,
        changes: { previousStatus: prescription.status, reason: payload.reason, actorRole: req.user!.role },
      }));
      if (prescription.status !== 'revoked') {
        const patient = await getStorage().getUser(prescription.patientId);
        try {
          await notificationService.enqueue({ eventType: 'prescription.revoked', channels: patient?.email ? ['email'] : [], recipient: { userId: prescription.patientId, email: patient?.email ?? undefined, firstName: patient?.firstName ?? undefined }, template: 'custom', variables: { subject: 'Prescription approval revoked', message: 'Your prescription approval was revoked. Contact the pharmacy for assistance.' } });
        } catch (error) {
          logger.error('Prescription revocation notification failed', { error, prescriptionId: prescription.id });
        }
      }
      res.json({ success: true, prescriptionId: result.prescription.id, status: result.prescription.status, releasedReservations: result.releasedReservations });
    } catch (error) {
      if (error instanceof InvalidDispensingError) return res.status(error.code === 'NOT_FOUND' ? 404 : 409).json({ message: error.message });
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid prescription revocation request', issues: error.issues });
      logger.error('Prescription revocation failed', { error });
      res.status(500).json({ message: 'Failed to revoke prescription' });
    }
  });

  app.patch('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
      if (!canUpdateOrder(req.user!)) {
        return res.status(403).json({ message: "Cannot update orders" });
      }
      const changes = orderUpdateSchema.parse(req.body);
      const existingOrder = await getStorage().getOrder(req.params.id);
      if (!existingOrder || !canReadOrder(req.user!, existingOrder)) return res.status(404).json({ message: 'Order not found' });
      if (changes.status && !orderStatusTransitions[existingOrder.status]?.includes(changes.status)) {
        return res.status(409).json({ message: `Order cannot transition from ${existingOrder.status} to ${changes.status}` });
      }
      const order = await getStorage().updateOrderWithAudit(req.params.id, changes, buildAuditEvent(req, {
        action: 'order.updated', entityType: 'order', entityId: req.params.id,
        changes: { previousStatus: existingOrder.status, ...changes },
      }));
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid order update', errors: error.issues });
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // ============================================================================
  // DELIVERY ROUTES
  // ============================================================================

  // Get active drivers (for customers and pharmacists to see)
  app.get('/api/drivers/active', authenticateToken, async (req, res) => {
    try {
      const drivers = await getStorage().getUsersByRole('delivery_driver');
      const activeDrivers = drivers.filter(d => (d as any).isActive !== false);
      
      // Get active deliveries for each driver
      const driversWithDeliveries = await Promise.all(
        activeDrivers.map(async (driver) => {
          const deliveries = await getStorage().getDeliveriesByDriver(driver.id);
          const activeCount = deliveries.filter(d => ['assigned', 'picked_up', 'in_transit'].includes(d.status)).length;
          return { ...driver, activeDeliveries: activeCount };
        })
      );
      
      res.json(driversWithDeliveries);
    } catch (error) {
      console.error("Error fetching active drivers:", error);
      res.status(500).json({ message: "Failed to fetch active drivers" });
    }
  });

  app.get('/api/driver/deliveries/active', authenticateToken, requirePermission(PERMISSIONS.DELIVERY_READ), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deliveries = await getStorage().getDeliveriesByDriver(userId);
      
      // Fetch order details for each delivery
      const deliveriesWithOrders = await Promise.all(
        deliveries.map(async (delivery) => {
          const order = await getStorage().getOrder(delivery.orderId);
          if (!order) return { ...delivery, order: null, customer: null };
          const customer = await getStorage().getUser(order.customerId);
          return { ...delivery, order, customer };
        })
      );
      
      res.json(deliveriesWithOrders);
    } catch (error) {
      console.error("Error fetching driver deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.get('/api/deliveries', authenticateToken, requirePermission(PERMISSIONS.DELIVERY_READ), async (req, res) => {
    try {
      const deliveries = await getStorage().getActiveDeliveries();
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.patch('/api/deliveries/:id/status', authenticateToken, requirePermission(PERMISSIONS.DELIVERY_MANAGE), async (req, res) => {
    try {
      const existingDelivery = await getStorage().getAssignedDelivery(req.params.id, req.user!.id);
      if (!existingDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      if (!canManageDelivery(req.user!, { assignedDriverId: existingDelivery.driverId })) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      const { status, proofOfDeliveryUrl, deliveryNotes } = deliveryStatusSchema.parse(req.body);
      const updateData: any = { status };
      
      if (status === 'picked_up') {
        updateData.pickedUpAt = new Date();
      } else if (status === 'delivered') {
        updateData.deliveredAt = new Date();
        if (proofOfDeliveryUrl) updateData.proofOfDeliveryUrl = proofOfDeliveryUrl;
        if (deliveryNotes) updateData.deliveryNotes = deliveryNotes;
      }
      
      const delivery = await getStorage().updateDelivery(req.params.id, updateData);
      
      // Update order status if delivery is complete
      if (status === 'delivered') {
        await getStorage().updateOrder(delivery.orderId, { status: 'delivered' });
      } else if (status === 'in_transit') {
        await getStorage().updateOrder(delivery.orderId, { status: 'in_transit' });
      }
      
      res.json(delivery);
    } catch (error) {
      console.error("Error updating delivery status:", error);
      res.status(500).json({ message: "Failed to update delivery status" });
    }
  });

  app.post('/api/deliveries', authenticateToken, requirePermission(PERMISSIONS.ORDER_MANAGE), async (req, res) => {
    try {
      const delivery = await getStorage().createDelivery(deliveryCreateSchema.parse(req.body));
      res.status(201).json(delivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({ message: "Failed to create delivery" });
    }
  });

  app.post('/api/payments/process', authenticateToken, async (req: any, res) => {
    try {
      const { orderId, method, phoneNumber } = paymentInitiationSchema.parse(req.body);
      const order = await getStorage().getOrderForOwner(orderId, req.user.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (!canInitiatePayment(req.user, { ownerId: order.customerId, recordStatus: order.paymentStatus })) {
        return res.status(409).json({ message: "Payment cannot be initiated" });
      }

      // Import payment gateway
      const { default: paymentGateway } = await import('./payment-gateway');
      
      // Process payment with gateway
      const paymentResult = await paymentGateway.processPayment({
        orderId,
        amount: parseFloat(order.total),
        phoneNumber,
        method,
      });
      
      if (paymentResult.success) {
        const audit = buildAuditEvent(req, { action: 'payment.initiated', entityType: 'order', entityId: orderId, changes: { method, status: paymentResult.status, outcome: 'success' } });
        await getStorage().updateOrderWithAudit(orderId, {
          paymentStatus: paymentResult.status === 'completed' ? 'completed' : 'processing',
          paymentMethod: method,
        }, audit);
      }

      res.json(paymentResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: 'Invalid request body', status: 'failed' });
      }
      console.error("Payment error:", error);
      res.status(500).json({ success: false, message: "Payment failed", status: 'failed' });
    }
  });

  app.post('/api/payments/check/:transactionId', authenticateToken, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { default: paymentGateway } = await import('./payment-gateway');
      const orderId = paymentGateway.getTransactionOrderId(transactionId);
      if (!orderId || !await getStorage().getOrderForOwner(orderId, req.user!.id)) {
        return res.status(404).json({ message: 'Payment transaction not found' });
      }
      const status = await paymentGateway.checkPaymentStatus(transactionId);
      res.json(status);
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  app.get('/api/payments/operators/:phoneNumber', async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      const { default: paymentGateway } = await import('./payment-gateway');
      const operator = paymentGateway.getSupportedOperator(phoneNumber);
      res.json({ operator, supported: !!operator });
    } catch (error) {
      console.error("Operator check error:", error);
      res.status(500).json({ supported: false });
    }
  });

  // ============================================================================
  // APPOINTMENT ROUTES
  // ============================================================================

  app.get('/api/appointments/patient/:patientId', authenticateToken, async (req, res) => {
    try {
      if (!await canReadPatientFromRequest(req, req.params.patientId)) {
        return res.status(403).json({ message: "Cannot access another patient's appointments" });
      }
      const appointments = await getStorage().getAppointmentsByPatient(req.params.patientId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', authenticateToken, async (req: any, res) => {
    try {
      const patientId = req.body.patientId || req.user.id;
      if (!canCreateAppointmentFor(req.user, patientId)) {
        return res.status(403).json({ message: "Cannot create an appointment for another patient" });
      }
      const appointmentData = normalizeHealthcareRole(req.user.role) === 'patient'
        ? customerAppointmentCreateSchema.parse(req.body)
        : staffAppointmentCreateSchema.parse(req.body);
      const appointment = await getStorage().createAppointment({
        ...appointmentData,
        patientId,
      });
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // ============================================================================
  // USER UPDATE ROUTES
  // ============================================================================

  app.patch('/api/users/:id', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.params.id;
      if (userId !== req.user.id) return res.status(404).json({ message: "User not found" });

      const user = await getStorage().getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const changes = selfProfileUpdateSchema.parse(req.body);
      const updated = await getStorage().updateUser(userId, changes);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Invalid request body', status: 'failed' });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body" });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // ============================================================================
  // BRANCH ROUTES
  // ============================================================================

  app.get('/api/branches', async (req, res) => {
    try {
      const branches = await getStorage().getBranches();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  app.get('/api/branches/:id', async (req, res) => {
    try {
      const branch = await getStorage().getBranch(req.params.id);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json(branch);
    } catch (error) {
      console.error("Error fetching branch:", error);
      res.status(500).json({ message: "Failed to fetch branch" });
    }
  });

  app.get('/api/admin/audit-logs', authenticateToken, requirePermission(PERMISSIONS.AUDIT_LOG_VIEW), async (req, res) => {
    try {
      const logs = await getStorage().getAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.post('/api/admin/branches', authenticateToken, requirePermission(PERMISSIONS.BRANCH_MANAGE), async (req, res) => {
    try {
      const branch = await getStorage().createBranch(branchCreateSchema.parse(req.body));
      res.status(201).json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      res.status(500).json({ message: "Failed to create branch" });
    }
  });

  app.patch('/api/admin/branches/:id', authenticateToken, requirePermission(PERMISSIONS.BRANCH_MANAGE), async (req, res) => {
    try {
      const branch = await getStorage().updateBranch(req.params.id, branchUpdateSchema.parse(req.body));
      res.json(branch);
    } catch (error) {
      console.error("Error updating branch:", error);
      res.status(500).json({ message: "Failed to update branch" });
    }
  });

  // ============================================================================
  // CONTENT ROUTES
  // ============================================================================

  app.get('/api/content', async (req, res) => {
    try {
      const { status } = req.query;
      const content = await getStorage().getContentItems(status as string);
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.get('/api/content/:slug', async (req, res) => {
    try {
      const content = await getStorage().getContentItemBySlug(req.params.slug);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post('/api/admin/content', authenticateToken, requirePermission(PERMISSIONS.CONTENT_MANAGE), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const content = await getStorage().createContentItem({ ...contentCreateSchema.parse(req.body), authorId: userId });
      res.status(201).json(content);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  app.patch('/api/admin/content/:id', authenticateToken, requirePermission(PERMISSIONS.CONTENT_MANAGE), async (req, res) => {
    try {
      const content = await getStorage().updateContentItem(req.params.id, contentUpdateSchema.parse(req.body));
      res.json(content);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // ============================================================================
  // AUDIT LOG ROUTES
  // ============================================================================

  app.get('/api/audit-logs', authenticateToken, requirePermission(PERMISSIONS.AUDIT_LOG_VIEW), async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await getStorage().getAuditLogs(limit ? parseInt(limit as string) : undefined);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get('/api/inventory/movements', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_READ), async (req, res) => {
    try {
      const batchId = z.string().max(255).optional().parse(req.query.batchId);
      const role = normalizeHealthcareRole(req.user!.role);
      const branchScoped = role === 'pharmacist' || role === 'receptionist' || role === 'branch_administrator';
      if (branchScoped && !req.user!.branchId) return res.status(403).json({ message: 'Branch assignment required' });
      const movements = await getStorage().getStockMovements({
        batchId,
        branchId: branchScoped ? req.user!.branchId! : undefined,
      });
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  app.post('/api/emergency-access', authenticateToken, requirePermission(PERMISSIONS.PATIENT_PROFILE_READ), async (req, res) => {
    try {
      const payload = breakGlassActivationSchema.parse(req.body);
      if (!authService.confirmPassword(req.user!.email, payload.password)) {
        await recordAuditEvent(req, { action: 'emergency_access.denied', entityType: 'patient', entityId: payload.patientId, changes: { reasonCode: payload.reasonCode, outcome: 'denied' } });
        return res.status(403).json({ message: 'Forbidden' });
      }
      const grant = await breakGlassService.activateWithAudit({
        actorId: req.user!.id,
        patientId: payload.patientId,
        reasonCode: payload.reasonCode,
        justification: payload.justification,
        durationMinutes: payload.durationMinutes,
      }, buildAuditEvent(req, {
        action: 'emergency_access.activated',
        entityType: 'patient',
        entityId: payload.patientId,
        changes: { reasonCode: payload.reasonCode, durationMinutes: payload.durationMinutes, outcome: 'success' },
      }));
      await notificationService.enqueue({
        eventType: 'security.emergency_access',
        channels: [],
        recipient: { userId: 'security-operations' },
        template: 'system-alert',
        variables: { title: 'Emergency access activated', message: `Grant ${grant.id} requires review.` },
      });
      res.status(201).json({ id: grant.id, patientId: grant.patientId, expiresAt: grant.expiresAt, reviewState: grant.reviewState });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid request body' });
      res.status(500).json({ message: 'Emergency access activation failed' });
    }
  });

  app.patch('/api/emergency-access/:id/review', authenticateToken, requirePermission(PERMISSIONS.AUDIT_LOG_VIEW), async (req, res) => {
    try {
      const payload = breakGlassReviewSchema.parse(req.body);
      const grant = await breakGlassService.reviewWithAudit(
        req.params.id,
        req.user!.id,
        payload.state,
        payload.notes,
        buildAuditEvent(req, { action: `emergency_access.${payload.state}`, entityType: 'emergency_access', entityId: req.params.id, changes: { outcome: 'success' } }),
      );
      if (!grant) return res.status(404).json({ message: 'Emergency access grant not found' });
      res.json({ id: grant.id, reviewState: grant.reviewState, reviewedAt: grant.reviewedAt });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid request body' });
      res.status(500).json({ message: 'Emergency access review failed' });
    }
  });

  // ============================================================================
  // APPOINTMENT ROUTES
  // ============================================================================

  app.get('/api/appointments', authenticateToken, requirePermission(PERMISSIONS.APPOINTMENT_READ), async (req: any, res) => {
    try {
      const appointments = await getStorage().getAllAppointmentsForOperations();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
      const appointment = normalizeHealthcareRole(req.user!.role) === 'patient'
        ? await getStorage().getAppointmentForPatient(req.params.id, req.user!.id)
        : await getStorage().getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      if (!await canReadPatientFromRequest(req, appointment.patientId)) {
        return res.status(403).json({ message: "Cannot access this appointment" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.patch('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
      const existing = await getStorage().getAppointment(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      if (!canUpdateAppointment(req.user!, existing)) {
        return res.status(403).json({ message: "Cannot update this appointment" });
      }
      const isPatient = normalizeHealthcareRole(req.user!.role) === 'patient';
      const changes = (isPatient ? patientAppointmentUpdateSchema : appointmentUpdateSchema).parse(req.body);
      if (changes.status && !appointmentStatusTransitions[existing.status]?.includes(changes.status)) {
        return res.status(409).json({ message: 'Appointment state transition is not permitted' });
      }
      const appointment = await getStorage().updateAppointmentWithAudit(
        req.params.id,
        changes,
        buildAuditEvent(req, {
          action: changes.status === 'cancelled' ? 'appointment.cancelled' : 'appointment.updated',
          entityType: 'appointment',
          entityId: req.params.id,
          changes: { fields: Object.keys(changes), outcome: 'success' },
        }),
      );
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid request body' });
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // ============================================================================
  // DRIVER HISTORY & STAFF STATS ROUTES
  // ============================================================================

  app.get('/api/driver/deliveries/history', authenticateToken, requirePermission(PERMISSIONS.DELIVERY_READ), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deliveries = await getStorage().getDeliveriesByDriver(userId);
      
      // Fetch order details for each delivery
      const deliveriesWithOrders = await Promise.all(
        deliveries.map(async (delivery) => {
          const order = await getStorage().getOrder(delivery.orderId);
          if (!order) return { ...delivery, order: null, customer: null };
          const customer = await getStorage().getUser(order.customerId);
          return { ...delivery, order, customer };
        })
      );
      
      res.json(deliveriesWithOrders);
    } catch (error) {
      console.error("Error fetching delivery history:", error);
      res.status(500).json({ message: "Failed to fetch delivery history" });
    }
  });

  app.get('/api/staff/stats', authenticateToken, requirePermission(PERMISSIONS.REPORT_VIEW), async (req, res) => {
    try {
      const orders = await getStorage().getAllOrdersForOperations();
      const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt || '').toDateString();
        return orderDate === new Date().toDateString();
      });
      
      const stats = {
        todaysSales: todayOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0),
        transactionsCount: todayOrders.length,
        lowStockCount: 0,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching staff stats:", error);
      res.status(500).json({ message: "Failed to fetch staff stats" });
    }
  });


  // ============================================================================
  // HEALTHCARE-GRADE STABILIZATION ROUTES: SECURITY, NOTIFICATIONS, CLINICAL CDS,
  // INVENTORY INTELLIGENCE, PERFORMANCE TRACKING
  // ============================================================================

  const notificationEventSchema = z.object({
    eventType: z.string().min(1),
    channels: z.array(z.enum(['email', 'sms'])).min(1),
    recipient: z.object({
      userId: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      firstName: z.string().optional(),
    }),
    template: z.string().min(1),
    variables: z.record(z.unknown()).default({}),
    maxAttempts: z.number().int().min(1).max(5).optional(),
  });

  app.post('/api/notifications/events', authenticateToken, requirePermission(PERMISSIONS.NOTIFICATION_SEND), async (req, res) => {
    try {
      const payload = notificationEventSchema.parse(req.body);
      const job = await notificationService.enqueue(payload);
      await recordAuditEvent(req, { action: 'notification.enqueue', entityType: 'notification_job', entityId: job.id, changes: { eventType: job.eventType, channels: job.channels } });
      res.status(202).json({ success: true, data: job });
    } catch (error) {
      logger.error('Notification event enqueue failed', { error });
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  app.get('/api/notifications/delivery-logs', authenticateToken, requirePermission(PERMISSIONS.AUDIT_LOG_VIEW), (_req, res) => {
    res.json({ success: true, data: notificationService.getDeliveryLogs() });
  });

  app.patch('/api/notifications/preferences/:userId', authenticateToken, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.userId) return res.status(404).json({ success: false, message: 'User not found' });
      const payload = z.object({ channel: z.enum(['email', 'sms']), optedOut: z.boolean() }).parse(req.body);
      notificationService.setOptOut(req.params.userId, payload.channel, payload.optedOut);
      await recordAuditEvent(req, { action: 'notification.preference.update', entityType: 'user', entityId: req.params.userId, changes: payload });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  const clinicalCheckSchema = z.object({
    medications: z.array(z.object({
      productId: z.string().optional(),
      name: z.string().min(1),
      genericName: z.string().optional(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
    })).min(1),
    patient: z.object({
      allergies: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
      currentMedications: z.array(z.object({ name: z.string(), genericName: z.string().optional() })).optional(),
    }).default({}),
  });

  app.post('/api/clinical/interaction-check', authenticateToken, requirePermission(PERMISSIONS.PRESCRIPTION_READ), async (req, res) => {
    try {
      const payload = clinicalCheckSchema.parse(req.body);
      const alerts = clinicalDecisionSupportService.evaluatePrescription(payload.medications, payload.patient);
      await recordAuditEvent(req, { action: 'clinical.interaction_check', entityType: 'clinical_decision_support', changes: { alertCount: alerts.length, severities: alerts.map((alert) => alert.severity) } });
      res.json({ success: true, data: { alerts, requiresOverride: alerts.some((alert) => alert.requiresOverride) } });
    } catch (error) {
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  app.post('/api/clinical/overrides', authenticateToken, requirePermission(PERMISSIONS.PRESCRIPTION_DISPENSE), async (req, res) => {
    try {
      const payload = z.object({
        prescriptionId: z.string(),
        alertIds: z.array(z.string()).optional(),
        justification: z.string().min(20),
      }).parse(req.body);
      await recordAuditEvent(req, { action: 'clinical.override', entityType: 'prescription', entityId: payload.prescriptionId, changes: payload });
      res.status(201).json({ success: true, message: 'Clinical override justification recorded' });
    } catch (error) {
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  app.post('/api/inventory/scan', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_MANAGE), async (req, res) => {
    try {
      const alerts = await inventoryIntelligenceService.scanInventory();
      await inventoryIntelligenceService.notifyCriticalAlerts(alerts);
      await recordAuditEvent(req, { action: 'inventory.scan', entityType: 'inventory', changes: { alertCount: alerts.length } });
      res.json({ success: true, data: { alerts } });
    } catch (error) {
      logger.error('Inventory scan failed', { error });
      res.status(500).json({ success: false, message: 'Inventory scan failed' });
    }
  });

  app.get('/api/inventory/alerts', authenticateToken, requirePermission(PERMISSIONS.INVENTORY_READ), (_req, res) => {
    res.json({ success: true, data: inventoryIntelligenceService.getDashboardAlerts() });
  });

  app.get('/api/engineering/control-center', authenticateToken, requirePermission(PERMISSIONS.SYSTEM_CONFIGURE), async (_req, res) => {
    const auditLogs = await getStorage().getAuditLogs(50);
    const notificationJobs = notificationService.getQueueStatus();
    const inventoryAlerts = inventoryIntelligenceService.getDashboardAlerts();
    const modules = {
      security: { completed: 8, pending: 1, blocked: 0 },
      inventory: { completed: inventoryAlerts.length > 0 ? 4 : 3, pending: inventoryAlerts.length > 0 ? 0 : 1, blocked: 0 },
      notifications: { completed: 7, pending: 0, blocked: 0 },
      performance: { completed: 4, pending: 2, blocked: 0 },
      clinicalTools: { completed: 5, pending: 1, blocked: 0 },
    };
    const completed = Object.values(modules).reduce((sum, module) => sum + module.completed, 0);
    const pending = Object.values(modules).reduce((sum, module) => sum + module.pending, 0);
    const blocked = Object.values(modules).reduce((sum, module) => sum + module.blocked, 0);
    const readinessScore = Math.round((completed / Math.max(completed + pending + blocked, 1)) * 100);

    res.json({
      success: true,
      data: {
        priorityProgress: { P0: 75, P1: 60, P2: 35, P3: 15 },
        modules,
        metrics: { completed, pending, inProgress: notificationJobs.filter((job) => job.status === 'processing').length, blocked, readinessScore },
        riskHeatmap: {
          critical: auditLogs.filter((log) => log.action.includes('clinical.override')).length,
          high: inventoryAlerts.filter((alert) => alert.severity === 'high').length,
          moderate: inventoryAlerts.filter((alert) => alert.severity === 'moderate').length,
        },
        burndown: [{ week: 'current', completed, pending }],
        weeklyReport: `Deployment readiness ${readinessScore}%. ${inventoryAlerts.length} inventory alerts and ${notificationJobs.length} notification jobs tracked.`,
      },
    });
  });

  // API Documentation
  setupAPIDocsRoute(app);

  const httpServer = createServer(app);
  return httpServer;
}

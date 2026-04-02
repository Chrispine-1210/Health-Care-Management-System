import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storageManager";
import { authenticateToken, requireRole } from "./authMiddleware";
import { registerAuthRoutes } from "./auth-routes";
import { logger } from "./logger";
import { globalErrorHandler, notFoundHandler, asyncHandler, AppError } from "./errorHandler";
import { validateInput, loginSchema, signupSchema } from "./validation";
import { userService } from "./userService";
import { setupAPIDocsRoute } from "./apiDocs";
import { registerEmailRoutes } from "./email-routes";
import { notificationService } from "./notificationService";

// Helper function to calculate distance-based delivery cost
function calculateDeliveryCost(distanceKm: number): number {
  // Base fee: 500 MK, then 50 MK per km
  const baseFee = 500;
  const costPerKm = 50;
  return baseFee + Math.ceil(distanceKm * costPerKm);
}

export async function registerRoutes(app: Express): Promise<Server> {
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
      const name = req.user.claims.name || '';
      
      // Ensure user exists in storage by upserting
      const user = await getStorage().upsertUser({
        id: userId,
        email,
        firstName: name.split(' ')[0] || 'User',
        lastName: name.split(' ')[1] || '',
        role: 'customer', // Default role for new users
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/logout', async (req, res) => {
    try {
      // Clear session if using express-session
      if (req.session?.destroy) {
        req.session.destroy((err) => {
          if (err) {
            return res.status(500).json({ message: "Logout failed" });
          }
          res.json({ message: "Logged out successfully" });
        });
      } else {
        res.json({ message: "Logged out successfully" });
      }
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  app.patch('/api/orders/:id/approve', authenticateToken, requireRole('staff', 'admin'), async (req, res) => {
    try {
      const order = await getStorage().updateOrder(req.params.id, { status: 'confirmed' });
      res.json(order);
    } catch (error) {
      console.error("Error approving order:", error);
      res.status(500).json({ message: "Failed to approve order" });
    }
  });

  app.patch('/api/orders/:id/reject', authenticateToken, requireRole('staff', 'admin'), async (req, res) => {
    try {
      const order = await getStorage().updateOrder(req.params.id, { status: 'cancelled' });
      res.json(order);
    } catch (error) {
      console.error("Error rejecting order:", error);
      res.status(500).json({ message: "Failed to reject order" });
    }
  });

  app.get('/api/staff/approvals', authenticateToken, requireRole('staff', 'admin'), async (req, res) => {
    try {
      const orders = await getStorage().getOrders();
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

  app.get('/api/staff/members', authenticateToken, requireRole('staff', 'admin'), async (req, res) => {
    try {
      const staff = await getStorage().getUsersByRole('staff');
      res.json(staff.map(s => ({ ...s, status: 'active', lastActive: 'Just now' })));
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.get('/api/staff/support-tickets', authenticateToken, requireRole('staff', 'admin'), async (req, res) => {
    try {
      // Get support tickets - placeholder returns empty for now
      // In production, this would query a support_tickets table
      res.json([]);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.patch('/api/prescriptions/:id/review', authenticateToken, requireRole('pharmacist', 'admin'), async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const prescription = await getStorage().updatePrescription(req.params.id, { 
        status, 
        reviewNotes,
        reviewedAt: new Date() 
      });
      res.json(prescription);
    } catch (error) {
      console.error("Error reviewing prescription:", error);
      res.status(500).json({ message: "Failed to review prescription" });
    }
  });

  app.get('/api/admin/stats', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const stats = await getStorage().getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/driver/deliveries/history', authenticateToken, requireRole('driver', 'admin'), async (req, res) => {
    try {
      const deliveries = await getStorage().getDeliveries();
      const driverDeliveries = deliveries.filter(d => d.driverId === req.user!.id && d.status === 'delivered');
      const deliveriesWithDetails = await Promise.all(
        driverDeliveries.map(async (delivery) => {
          const order = await getStorage().getOrder(delivery.orderId);
          const customer = await getStorage().getUser(order!.customerId);
          return { ...delivery, order, customer };
        })
      );
      res.json(deliveriesWithDetails);
    } catch (error) {
      console.error("Error fetching delivery history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  app.get('/api/admin/inventory', authenticateToken, requireRole('admin', 'pharmacist'), async (req, res) => {
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

  app.get('/api/admin/branches', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const branches = await getStorage().getBranches();
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  app.get('/api/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { role, branchId } = req.query;
      let users;
      
      if (role) {
        users = await getStorage().getUsersByRole(role as string);
      } else if (branchId) {
        users = await getStorage().getUsersByBranch(branchId as string);
      } else {
        users = await getStorage().getAllUsers();
      }
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/role', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { role, branchId } = req.body;
      const user = await getStorage().updateUserRole(req.params.id, role, branchId);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // ============================================================================
  // INVENTORY/STOCK ROUTES
  // ============================================================================

  app.post('/api/admin/inventory/batch', authenticateToken, requireRole('admin', 'pharmacist', 'staff'), async (req, res) => {
    try {
      const batch = await getStorage().createStockBatch(req.body);
      res.status(201).json(batch);
    } catch (error) {
      console.error("Error creating stock batch:", error);
      res.status(500).json({ message: "Failed to create stock batch" });
    }
  });

  app.patch('/api/admin/inventory/batch/:id', authenticateToken, requireRole('admin', 'pharmacist', 'staff'), async (req, res) => {
    try {
      const batch = await getStorage().updateStockBatch(req.params.id, req.body);
      res.json(batch);
    } catch (error) {
      console.error("Error updating stock batch:", error);
      res.status(500).json({ message: "Failed to update stock batch" });
    }
  });

  app.get('/api/inventory/low-stock', authenticateToken, requireRole('admin', 'pharmacist', 'staff'), async (req, res) => {
    try {
      const { threshold } = req.query;
      const batches = await getStorage().getLowStockBatches(threshold ? parseInt(threshold as string) : 10);
      res.json(batches);
    } catch (error) {
      console.error("Error fetching low stock batches:", error);
      res.status(500).json({ message: "Failed to fetch low stock batches" });
    }
  });

  app.get('/api/inventory/expiring', authenticateToken, requireRole('admin', 'pharmacist', 'staff'), async (req, res) => {
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

  app.post('/api/admin/products', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const product = await getStorage().createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch('/api/admin/products/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const product = await getStorage().updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // ============================================================================
  // PRESCRIPTION ROUTES
  // ============================================================================

  app.get('/api/prescriptions/pending', authenticateToken, requireRole('pharmacist', 'admin'), async (req, res) => {
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
      const prescriptions = await getStorage().getPrescriptionsByPatient(req.params.patientId);
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching patient prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get('/api/prescriptions/:id', authenticateToken, async (req, res) => {
    try {
      const prescription = await getStorage().getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
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
        ...req.body,
        patientId: userId,
        status: 'pending' as const,
      };
      
      const prescription = await getStorage().createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (error) {
      console.error("Error creating prescription:", error);
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  app.patch('/api/prescriptions/:id/review', authenticateToken, requireRole('pharmacist', 'admin'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { status, reviewNotes } = req.body;
      
      const prescription = await getStorage().updatePrescription(req.params.id, {
        status,
        reviewNotes,
        reviewedBy: userId,
        reviewedAt: new Date(),
      });
      
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
      const user = await getStorage().getUser(userId);
      
      let orders;
      if (user?.role === 'customer') {
        orders = await getStorage().getOrdersByCustomer(userId);
      } else {
        orders = await getStorage().getOrders();
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
      const order = await getStorage().getOrder(req.params.id);
      if (!order) {
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
      const { items, branchId, deliveryAddress, deliveryCity, deliveryLatitude, deliveryLongitude, paymentMethod } = req.body;
      
      // Calculate totals
      let subtotal = 0;
      for (const item of items) {
        const product = await getStorage().getProduct(item.productId);
        if (product) {
          subtotal += parseFloat(product.price) * item.quantity;
        }
      }
      
      // Calculate delivery cost if delivery info provided
      let deliveryCharge = 500; // Base fee
      let distance = 0;
      if (deliveryLatitude && deliveryLongitude) {
        // Simple distance calculation (rough approximation)
        distance = Math.sqrt(
          Math.pow(parseFloat(deliveryLatitude) - (-15.4167), 2) +
          Math.pow(parseFloat(deliveryLongitude) - (28.2833), 2)
        ) * 111; // Rough km conversion
        deliveryCharge = calculateDeliveryCost(distance);
      }
      
      const total = subtotal + deliveryCharge;
      
      // Create order
      const order = await getStorage().createOrder({
        customerId: userId,
        branchId: branchId || 'default-branch-id',
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
      });
      
      // Create order items
      for (const item of items) {
        const product = await getStorage().getProduct(item.productId);
        if (product) {
          await getStorage().createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            subtotal: (parseFloat(product.price) * item.quantity).toString(),
          });
        }
      }
      
      res.status(201).json({ ...order, items });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
      const order = await getStorage().updateOrder(req.params.id, req.body);
      res.json(order);
    } catch (error) {
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
      const drivers = await getStorage().getUsersByRole('driver');
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

  app.get('/api/driver/deliveries/active', authenticateToken, requireRole('driver'), async (req: any, res) => {
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

  app.get('/api/deliveries', authenticateToken, requireRole('admin', 'staff'), async (req, res) => {
    try {
      const deliveries = await getStorage().getActiveDeliveries();
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.patch('/api/deliveries/:id/status', authenticateToken, requireRole('driver', 'admin'), async (req, res) => {
    try {
      const { status, proofOfDeliveryUrl, deliveryNotes } = req.body;
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

  app.post('/api/deliveries', authenticateToken, requireRole('admin', 'staff'), async (req, res) => {
    try {
      const delivery = await getStorage().createDelivery(req.body);
      res.status(201).json(delivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({ message: "Failed to create delivery" });
    }
  });

  app.post('/api/payments/process', authenticateToken, async (req: any, res) => {
    try {
      const { orderId, method, phoneNumber } = req.body;
      const order = await getStorage().getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
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
        await getStorage().updateOrder(orderId, { 
          paymentStatus: paymentResult.status === 'completed' ? 'completed' : 'processing',
          paymentMethod: method 
        });
      }

      res.json(paymentResult);
    } catch (error) {
      console.error("Payment error:", error);
      res.status(500).json({ success: false, message: "Payment failed", status: 'failed' });
    }
  });

  app.post('/api/payments/check/:transactionId', authenticateToken, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { default: paymentGateway } = await import('./payment-gateway');
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
      const appointments = await getStorage().getAppointmentsByPatient(req.params.patientId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', authenticateToken, async (req: any, res) => {
    try {
      const appointment = await getStorage().createAppointment({
        ...req.body,
        patientId: req.body.patientId || req.user.id,
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
      const currentUser = await getStorage().getUser(req.user.id);
      
      // Users can only update their own profile (unless admin)
      if (currentUser?.role !== 'admin' && userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const user = await getStorage().getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updated = await getStorage().updateUser(userId, req.body);
      res.json(updated);
    } catch (error) {
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

  app.get('/api/admin/audit-logs', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const logs = await getStorage().getAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.post('/api/admin/branches', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const branch = await getStorage().createBranch(req.body);
      res.status(201).json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      res.status(500).json({ message: "Failed to create branch" });
    }
  });

  app.patch('/api/admin/branches/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const branch = await getStorage().updateBranch(req.params.id, req.body);
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

  app.post('/api/admin/content', authenticateToken, requireRole('admin'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const content = await getStorage().createContentItem({ ...req.body, authorId: userId });
      res.status(201).json(content);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  app.patch('/api/admin/content/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const content = await getStorage().updateContentItem(req.params.id, req.body);
      res.json(content);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // ============================================================================
  // AUDIT LOG ROUTES
  // ============================================================================

  app.get('/api/audit-logs', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await getStorage().getAuditLogs(limit ? parseInt(limit as string) : undefined);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ============================================================================
  // APPOINTMENT ROUTES
  // ============================================================================

  app.get('/api/appointments', authenticateToken, async (req: any, res) => {
    try {
      const appointments = await getStorage().getAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get('/api/appointments/patient/:patientId', authenticateToken, async (req, res) => {
    try {
      const appointments = await getStorage().getAppointmentsByPatient(req.params.patientId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching patient appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const appointment = await getStorage().createAppointment({
        ...req.body,
        patientId: userId,
      });
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.get('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
      const appointment = await getStorage().getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.patch('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
      const appointment = await getStorage().updateAppointment(req.params.id, req.body);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // ============================================================================
  // DRIVER HISTORY & STAFF STATS ROUTES
  // ============================================================================

  app.get('/api/driver/deliveries/history', authenticateToken, requireRole('driver'), async (req: any, res) => {
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

  app.get('/api/staff/stats', authenticateToken, requireRole('staff', 'admin'), async (req, res) => {
    try {
      const orders = await getStorage().getOrders();
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

  // API Documentation
  setupAPIDocsRoute(app);

  // 404 handler MUST come before error handler
  app.use(notFoundHandler);
  
  // Error handling middleware (must be last)
  app.use(globalErrorHandler);

  const httpServer = createServer(app);
  return httpServer;
}

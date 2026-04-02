import { z } from 'zod';

/**
 * Comprehensive validation schemas for all API endpoints
 */

// Products
export const productSchema = z.object({
  name: z.string().min(1, 'Product name required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  requiresPrescription: z.boolean().default(false),
  category: z.string().optional(),
});

// Orders
export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })),
  branchId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  paymentMethod: z.enum(['cash', 'airtel_money', 'tnm_mpamba', 'card', 'bank_transfer']),
  notes: z.string().optional(),
});

// Prescriptions
export const prescriptionSchema = z.object({
  patientId: z.string().min(1),
  prescriberId: z.string().min(1),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
  })),
  notes: z.string().optional(),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
});

// Deliveries
export const deliverySchema = z.object({
  orderId: z.string().min(1),
  driverId: z.string().min(1),
  pickupAddress: z.string(),
  deliveryAddress: z.string(),
  distance: z.number().min(0),
  estimatedTime: z.number().min(0),
});

// Appointments
export const appointmentSchema = z.object({
  patientId: z.string().min(1),
  pharmacistId: z.string().optional(),
  type: z.enum(['teleconsultation', 'in_person']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
});

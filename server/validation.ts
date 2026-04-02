import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().optional(),
  role: z.enum(['customer', 'staff', 'driver']).default('customer'),
});

export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })).min(1),
  paymentMethod: z.enum(['card', 'cash', 'airtel', 'tnm']),
  deliveryAddress: z.string().optional(),
});

export const prescriptionSchema = z.object({
  patientName: z.string().min(2),
  prescriptionFile: z.string().optional(),
  chiefComplaint: z.string().min(5),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { valid: true; data: T } | { valid: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  result.error.errors.forEach(err => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return { valid: false, errors };
}

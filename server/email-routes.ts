import type { Express } from 'express';
import { authenticateToken, requireRole } from './authMiddleware';
import { notificationService } from './notificationService';
import { letterheadService } from './letterheadService';
import { getStorage } from './storageManager';
import { logger } from './logger';
import { z } from 'zod';

/**
 * Email Routes - RESTful API for sending emails and generating documents
 */

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
});

const sendNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(['welcome', 'order-confirmation', 'prescription-approved', 'delivery-notification', 'custom']),
  data: z.record(z.any()),
});

const generatePrescriptionLetterSchema = z.object({
  recipientName: z.string(),
  recipientEmail: z.string().email(),
  prescriptionId: z.string(),
  medicines: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string(),
    }),
  ),
  pharmacistName: z.string(),
  instructions: z.string(),
});

export function registerEmailRoutes(app: Express) {
  /**
   * POST /api/email/send
   * Send direct email
   */
  app.post('/api/email/send', authenticateToken, requireRole('admin', 'pharmacist'), async (req, res) => {
    try {
      const payload = sendEmailSchema.parse(req.body);
      const { emailService } = await import('./emailService');

      const success = await emailService.send(payload);

      if (success) {
        res.json({ success: true, message: 'Email sent successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send email' });
      }
    } catch (error) {
      logger.error('Email send error', { error });
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  /**
   * POST /api/notifications/send
   * Send notification (email with template)
   */
  app.post('/api/notifications/send', authenticateToken, async (req, res) => {
    try {
      const payload = sendNotificationSchema.parse(req.body);
      const user = await getStorage().getUser(payload.userId);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const success = await notificationService.send({
        userId: payload.userId,
        userEmail: user.email,
        firstName: user.firstName,
        type: payload.type,
        data: payload.data,
      });

      if (success) {
        res.json({ success: true, message: 'Notification sent' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send notification' });
      }
    } catch (error) {
      logger.error('Notification send error', { error });
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  /**
   * POST /api/documents/prescription-letter
   * Generate prescription letter (returns HTML)
   */
  app.post('/api/documents/prescription-letter', authenticateToken, requireRole('pharmacist', 'admin'), async (req, res) => {
    try {
      const payload = generatePrescriptionLetterSchema.parse(req.body);
      const html = letterheadService.generatePrescriptionLetter(payload);

      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      logger.error('Letter generation error', { error });
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  /**
   * POST /api/documents/invoice
   * Generate invoice letterhead
   */
  app.post('/api/documents/invoice', authenticateToken, requireRole('staff', 'admin'), async (req, res) => {
    try {
      const payload = z
        .object({
          recipientName: z.string(),
          recipientEmail: z.string().email(),
          invoiceNumber: z.string(),
          items: z.array(z.object({ description: z.string(), quantity: z.number(), unitPrice: z.number() })),
          total: z.number(),
          paymentMethod: z.string(),
        })
        .parse(req.body);

      const html = letterheadService.generateInvoiceLetter(payload);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      logger.error('Invoice generation error', { error });
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  /**
   * POST /api/documents/delivery-note
   * Generate delivery note
   */
  app.post('/api/documents/delivery-note', authenticateToken, requireRole('driver', 'admin'), async (req, res) => {
    try {
      const payload = z
        .object({
          recipientName: z.string(),
          recipientEmail: z.string().email(),
          orderId: z.string(),
          items: z.array(z.object({ name: z.string(), quantity: z.number() })),
          driverName: z.string(),
          deliveryAddress: z.string(),
        })
        .parse(req.body);

      const html = letterheadService.generateDeliveryNote(payload);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      logger.error('Delivery note generation error', { error });
      res.status(400).json({ success: false, message: String(error) });
    }
  });

  logger.info('Email routes registered');
}

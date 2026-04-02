import type { Express } from 'express';
import { authenticateToken, requireRole } from './authMiddleware';
import { PrescriptionWorkflow } from './prescriptionWorkflow';
import { logger } from './logger';

/**
 * Enhanced Prescriptions API with workflow
 */

export function registerPrescriptionsApi(app: Express) {
  /**
   * GET /api/prescriptions/pending - Get pending prescriptions (Pharmacist)
   */
  app.get('/api/prescriptions/pending', authenticateToken, requireRole('pharmacist'), async (req, res) => {
    try {
      const prescriptions = [
        {
          id: 'RX-001',
          patientName: 'John Doe',
          status: 'pending',
          medications: [
            { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours' },
          ],
          uploadedAt: new Date(),
        },
      ];

      res.json({
        success: true,
        data: prescriptions,
      });
    } catch (error) {
      logger.error('Pending prescriptions fetch failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch' });
    }
  });

  /**
   * PATCH /api/prescriptions/:id/status - Update prescription status with validation
   */
  app.patch('/api/prescriptions/:id/status', authenticateToken, requireRole('pharmacist'), async (req, res) => {
    try {
      const { id } = req.params;
      const { newStatus } = req.body;
      const currentStatus = 'pending'; // Get from DB

      // Validate state transition
      if (!PrescriptionWorkflow.canTransitionTo(currentStatus, newStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${currentStatus} to ${newStatus}`,
          validNextStates: PrescriptionWorkflow.getNextStates(currentStatus),
        });
      }

      res.json({
        success: true,
        data: {
          id,
          status: newStatus,
          updatedBy: req.user!.email,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Status update failed', { error });
      res.status(500).json({ success: false, message: 'Failed to update' });
    }
  });

  /**
   * GET /api/prescriptions/stats - Prescription statistics
   */
  app.get('/api/prescriptions/stats', authenticateToken, requireRole('pharmacist', 'admin'), async (req, res) => {
    try {
      const stats = {
        total: 245,
        pending: 12,
        under_review: 5,
        approved: 180,
        rejected: 8,
        dispensed: 40,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Stats fetch failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
  });

  logger.info('Prescriptions API endpoints registered');
}

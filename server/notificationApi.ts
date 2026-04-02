import type { Express } from 'express';
import { authenticateToken, requireRole } from './authMiddleware';
import { logger } from './logger';

/**
 * Notification & Communication API
 */

export function registerNotificationApi(app: Express) {
  /**
   * Get user notifications
   */
  app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = [
        { id: '1', type: 'order', message: 'Your order has been confirmed', read: false, createdAt: new Date() },
        { id: '2', type: 'delivery', message: 'Driver is on the way', read: false, createdAt: new Date() },
        { id: '3', type: 'prescription', message: 'Your prescription has been approved', read: true, createdAt: new Date() },
      ];

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      logger.error('Notification fetch failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  });

  /**
   * Mark notifications as read
   */
  app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        data: { id, read: true },
      });
    } catch (error) {
      logger.error('Mark notification failed', { error });
      res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
  });

  /**
   * Send message (customer to pharmacist)
   */
  app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
      const { recipientId, content } = req.body;
      const message = {
        id: `msg-${Date.now()}`,
        senderId: req.user!.id,
        recipientId,
        content,
        createdAt: new Date(),
        read: false,
      };

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      logger.error('Message send failed', { error });
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  });

  /**
   * Get conversations
   */
  app.get('/api/conversations', authenticateToken, async (req, res) => {
    try {
      const conversations = [
        {
          id: '1',
          participantId: 'pharmacist-1',
          participantName: 'Dr. Banda',
          lastMessage: 'Thanks for your prescription',
          unread: 2,
          updatedAt: new Date(),
        },
      ];

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      logger.error('Conversations fetch failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
    }
  });

  logger.info('Notification API endpoints registered');
}

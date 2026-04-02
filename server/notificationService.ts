import { emailService, EmailPayload } from './emailService';
import { logger } from './logger';

/**
 * Notification Service - Orchestrates all notification channels
 * Pattern: Facade pattern for clean separation
 */

export interface NotificationPayload {
  userId: string;
  userEmail: string;
  firstName: string;
  type: 'welcome' | 'order-confirmation' | 'prescription-approved' | 'delivery-notification' | 'custom';
  data: Record<string, any>;
}

class NotificationService {
  /**
   * Send notification through appropriate channel(s)
   */
  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      const { type, userEmail, firstName, data } = payload;

      let emailPayload: EmailPayload | null = null;

      switch (type) {
        case 'welcome':
          const welcomeTemplate = emailService.createWelcomeTemplate(
            firstName,
            userEmail,
            data.role,
          );
          emailPayload = {
            to: userEmail,
            subject: welcomeTemplate.subject,
            html: welcomeTemplate.html,
          };
          break;

        case 'order-confirmation':
          const orderTemplate = emailService.createOrderConfirmationTemplate(
            firstName,
            userEmail,
            data.orderId,
            data.items,
            data.total,
          );
          emailPayload = {
            to: userEmail,
            subject: orderTemplate.subject,
            html: orderTemplate.html,
          };
          break;

        case 'prescription-approved':
          const prescriptionTemplate = emailService.createPrescriptionApprovedTemplate(
            firstName,
            userEmail,
            data.prescriptionId,
            data.medicineName,
          );
          emailPayload = {
            to: userEmail,
            subject: prescriptionTemplate.subject,
            html: prescriptionTemplate.html,
          };
          break;

        case 'delivery-notification':
          const deliveryTemplate = emailService.createDeliveryNotificationTemplate(
            firstName,
            userEmail,
            data.orderId,
            data.driverName,
            data.driverPhone,
            data.estimatedTime,
          );
          emailPayload = {
            to: userEmail,
            subject: deliveryTemplate.subject,
            html: deliveryTemplate.html,
          };
          break;

        case 'custom':
          emailPayload = {
            to: userEmail,
            subject: data.subject,
            html: data.html,
          };
          break;
      }

      if (emailPayload) {
        return await emailService.send(emailPayload);
      }

      return false;
    } catch (error) {
      logger.error('Notification send failed', { error, payload });
      return false;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(payloads: NotificationPayload[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const payload of payloads) {
      const result = await this.send(payload);
      if (result) sent++;
      else failed++;
    }

    return { sent, failed };
  }
}

export const notificationService = new NotificationService();

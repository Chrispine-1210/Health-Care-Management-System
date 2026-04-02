import { logger } from './logger';
import { z } from 'zod';

/**
 * Email Service - Handles all email communication
 * Strategy: Template-based, role-specific, with professional letterheads
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailPayload {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

class EmailService {
  private smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
  } | null = null;

  constructor() {
    // Initialize with environment config
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      this.smtpConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      };
      logger.info('Email service configured with SMTP');
    } else {
      logger.warn('Email service: SMTP not configured. Using development mode.');
    }
  }

  /**
   * Professional letterhead template wrapper
   */
  private wrapWithLetterhead(
    content: string,
    recipientName: string,
    recipientEmail: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; margin: 0; padding: 20px; }
          .letterhead { border-top: 4px solid #228B22; padding-bottom: 20px; margin-bottom: 30px; }
          .letterhead h1 { color: #228B22; margin: 10px 0; font-size: 24px; }
          .letterhead p { color: #666; font-size: 12px; margin: 2px 0; }
          .content { line-height: 1.6; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; color: #666; font-size: 11px; }
          .signature { margin-top: 30px; }
          a { color: #228B22; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="letterhead">
          <h1>Thandizo Pharmacy</h1>
          <p>Healthcare Excellence in Malawi</p>
          <p>Phone: +265 1 234 567 | Email: info@thandizo.com</p>
          <p>📍 Multiple Locations | www.thandizo.com</p>
        </div>

        <p>Dear ${recipientName},</p>

        <div class="content">
          ${content}
        </div>

        <div class="signature">
          <p>Best regards,</p>
          <p><strong>Thandizo Pharmacy Management System</strong></p>
          <p style="font-size: 11px; color: #999;">
            This is an automated communication. Do not reply to this email.
            For support, contact: support@thandizo.com
          </p>
        </div>

        <div class="footer">
          <p><strong>Important Notice:</strong> Thandizo Pharmacy respects your privacy. Your email address is used only for account communications.</p>
          <p>© 2026 Thandizo Pharmacy. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Welcome email template
   */
  createWelcomeTemplate(firstName: string, email: string, role: string): EmailTemplate {
    const roleMessage = {
      admin: 'You now have full system access to manage pharmacy operations.',
      pharmacist: 'You can now review prescriptions and manage clinical workflows.',
      staff: 'You can now process orders and manage point-of-sale operations.',
      customer: 'You can now browse products and place orders online.',
      driver: 'You can now view delivery assignments and track routes.',
    }[role as keyof typeof roleMessage] || 'Welcome to Thandizo Pharmacy.';

    const html = this.wrapWithLetterhead(
      `
        <p>Welcome to <strong>Thandizo Pharmacy Management System</strong>!</p>
        <p>Your account has been successfully created with the role: <strong>${role}</strong></p>
        <p>${roleMessage}</p>
        <p>You can log in at: <a href="https://thandizo.com/login">https://thandizo.com/login</a></p>
        <p>If you did not create this account, please contact our support team immediately.</p>
      `,
      firstName,
      email,
    );

    return {
      subject: `Welcome to Thandizo Pharmacy - ${role} Account Created`,
      html,
      text: `Welcome to Thandizo Pharmacy! Your ${role} account has been created. Log in at https://thandizo.com/login`,
    };
  }

  /**
   * Order confirmation email template
   */
  createOrderConfirmationTemplate(
    firstName: string,
    email: string,
    orderId: string,
    items: Array<{ name: string; quantity: number; price: number }>,
    total: number,
  ): EmailTemplate {
    const itemsHtml = items
      .map(item => `<tr><td>${item.name}</td><td style="text-align:right">${item.quantity}</td><td style="text-align:right">MK ${item.price.toLocaleString()}</td></tr>`)
      .join('');

    const html = this.wrapWithLetterhead(
      `
        <p>Your order has been confirmed!</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>

        <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
          <thead style="background: #f5f5f5;">
            <tr><th style="text-align:left; padding:8px">Product</th><th style="text-align:right; padding:8px">Qty</th><th style="text-align:right; padding:8px">Price</th></tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot style="border-top: 2px solid #228B22;">
            <tr><td colspan="2" style="text-align:right; padding:8px"><strong>Total:</strong></td><td style="text-align:right; padding:8px"><strong>MK ${total.toLocaleString()}</strong></td></tr>
          </tfoot>
        </table>

        <p>Track your order: <a href="https://thandizo.com/orders/${orderId}">View Order Status</a></p>
        <p>We will update you when your order is ready for delivery or pickup.</p>
      `,
      firstName,
      email,
    );

    return {
      subject: `Order Confirmation #${orderId.slice(0, 8)}`,
      html,
      text: `Your order ${orderId} has been confirmed. Total: MK ${total}. Track at https://thandizo.com/orders/${orderId}`,
    };
  }

  /**
   * Prescription approved email template
   */
  createPrescriptionApprovedTemplate(
    firstName: string,
    email: string,
    prescriptionId: string,
    medicineName: string,
  ): EmailTemplate {
    const html = this.wrapWithLetterhead(
      `
        <p>Your prescription has been approved by our pharmacist!</p>
        <p><strong>Medicine:</strong> ${medicineName}</p>
        <p><strong>Prescription ID:</strong> ${prescriptionId}</p>
        <p>You can now:</p>
        <ul>
          <li>Pick up your medicine at our pharmacy</li>
          <li>Request home delivery</li>
          <li>Order online for convenience</li>
        </ul>
        <p><a href="https://thandizo.com/prescriptions/${prescriptionId}">View Prescription Details</a></p>
      `,
      firstName,
      email,
    );

    return {
      subject: `Your Prescription is Ready`,
      html,
      text: `Your prescription for ${medicineName} has been approved. View details at https://thandizo.com/prescriptions/${prescriptionId}`,
    };
  }

  /**
   * Delivery notification email template
   */
  createDeliveryNotificationTemplate(
    firstName: string,
    email: string,
    orderId: string,
    driverName: string,
    driverPhone: string,
    estimatedTime: string,
  ): EmailTemplate {
    const html = this.wrapWithLetterhead(
      `
        <p>Your order is on the way!</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Driver:</strong> ${driverName}</p>
        <p><strong>Driver Phone:</strong> <a href="tel:${driverPhone}">${driverPhone}</a></p>
        <p><strong>Estimated Delivery:</strong> ${estimatedTime}</p>
        <p><a href="https://thandizo.com/tracking/${orderId}">Track Your Delivery</a></p>
        <p>Please ensure someone is available to receive the delivery.</p>
      `,
      firstName,
      email,
    );

    return {
      subject: `Your Order is On The Way`,
      html,
      text: `Your order ${orderId} is being delivered. Driver: ${driverName} (${driverPhone}). Estimated: ${estimatedTime}`,
    };
  }

  /**
   * Send email (mock implementation - would use nodemailer in production)
   */
  async send(payload: EmailPayload): Promise<boolean> {
    try {
      // Validate email
      const emailSchema = z.string().email();
      emailSchema.parse(payload.to);

      if (process.env.NODE_ENV === 'production' && this.smtpConfig) {
        // In production: use actual SMTP (nodemailer)
        logger.info(`Email would be sent via SMTP: ${payload.to}`, { subject: payload.subject });
        // const transporter = nodemailer.createTransport(this.smtpConfig);
        // await transporter.sendMail({ from: 'noreply@thandizo.com', ...payload });
      } else {
        // In development: log to console
        logger.info(`Email (DEV): ${payload.to}`, {
          subject: payload.subject,
          preview: payload.html.slice(0, 100),
        });
      }

      return true;
    } catch (error) {
      logger.error('Email send failed', { error, to: payload.to });
      return false;
    }
  }

  /**
   * Batch send emails
   */
  async sendBatch(payloads: EmailPayload[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const payload of payloads) {
      const result = await this.send(payload);
      if (result) sent++;
      else failed++;
    }

    logger.info('Batch email send complete', { sent, failed });
    return { sent, failed };
  }
}

export const emailService = new EmailService();

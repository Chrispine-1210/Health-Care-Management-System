import { logger } from './logger';

/**
 * Letterhead Service - Generates professional document designs
 * Supports: HTML letterheads, invoice templates, prescription letters
 */

export interface LetterheadConfig {
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  letterDate?: string;
  subject?: string;
}

class LetterheadService {
  /**
   * Professional pharmacy letterhead (base template)
   */
  private getPharmacyLetterhead(config: LetterheadConfig): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #fff;
            color: #333;
            line-height: 1.6;
            padding: 40px;
          }
          .page {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 40px;
          }
          .header {
            border-top: 5px solid #228B22;
            border-bottom: 2px solid #228B22;
            padding: 20px 0 15px 0;
            margin-bottom: 30px;
            text-align: center;
          }
          .logo { font-size: 28px; font-weight: bold; color: #228B22; margin-bottom: 5px; }
          .tagline { font-size: 12px; color: #666; }
          .contact-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 10px;
            font-size: 11px;
            color: #999;
          }
          .recipient {
            margin-bottom: 30px;
          }
          .recipient-name { font-weight: bold; margin-bottom: 3px; }
          .recipient-details { font-size: 13px; color: #666; }
          .date { font-size: 12px; color: #999; margin-bottom: 30px; }
          .subject {
            font-weight: bold;
            margin-bottom: 20px;
            font-size: 14px;
            color: #228B22;
          }
          .content { font-size: 14px; line-height: 1.8; margin-bottom: 30px; }
          .content p { margin-bottom: 12px; }
          .signature { margin-top: 40px; }
          .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; width: 200px; }
          .footer {
            margin-top: 50px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #999;
            text-align: center;
          }
          .disclaimer { margin-top: 20px; font-style: italic; color: #c00; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          table th {
            background: #f5f5f5;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #228B22;
          }
          table td { padding: 10px; border-bottom: 1px solid #ddd; }
          table tr:last-child td { border-bottom: none; }
          .highlight { background: #f0fff0; padding: 15px; border-left: 4px solid #228B22; margin: 15px 0; }
          @media print {
            body { padding: 0; }
            .page { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="logo">🏥 Thandizo Pharmacy</div>
            <div class="tagline">Healthcare Excellence in Malawi</div>
            <div class="contact-info">
              <span>📞 +265 1 234 567</span>
              <span>📧 info@thandizo.com</span>
              <span>🌐 www.thandizo.com</span>
            </div>
          </div>

          <div class="recipient">
            <div class="recipient-name">${config.recipientName}</div>
            <div class="recipient-details">
              ${config.recipientEmail ? `Email: ${config.recipientEmail}<br>` : ''}
              ${config.recipientPhone ? `Phone: ${config.recipientPhone}` : ''}
            </div>
          </div>

          <div class="date">${config.letterDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>

          ${config.subject ? `<div class="subject">${config.subject}</div>` : ''}
    `;
  }

  /**
   * Close letterhead HTML
   */
  private closeLetterhead(): string {
    return `
          <div class="footer">
            <p><strong>Thandizo Pharmacy Management System</strong></p>
            <p>© 2026 All Rights Reserved. | Confidential Medical Information</p>
            <p style="margin-top: 10px;">This document is intended for the named recipient only.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate prescription letter
   */
  generatePrescriptionLetter(config: LetterheadConfig & {
    prescriptionId: string;
    medicines: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
    pharmacistName: string;
    instructions: string;
  }): string {
    const medicinesTable = config.medicines
      .map(
        med =>
          `<tr>
        <td>${med.name}</td>
        <td>${med.dosage}</td>
        <td>${med.frequency}</td>
        <td>${med.duration}</td>
      </tr>`,
      )
      .join('');

    return (
      this.getPharmacyLetterhead({
        ...config,
        subject: `Prescription Letter - ID: ${config.prescriptionId}`,
      }) +
      `
          <div class="content">
            <p>Dear ${config.recipientName},</p>
            <p>We are pleased to confirm that your prescription has been reviewed and approved by our licensed pharmacist.</p>

            <h3 style="margin-top: 20px; color: #228B22;">Prescribed Medicines:</h3>
            <table>
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${medicinesTable}
              </tbody>
            </table>

            <h3 style="margin-top: 20px; color: #228B22;">Important Instructions:</h3>
            <div class="highlight">
              <p>${config.instructions}</p>
            </div>

            <p><strong>Pharmacist:</strong> ${config.pharmacistName}</p>
            <p><strong>Prescription ID:</strong> ${config.prescriptionId}</p>
            <p><strong>Date Approved:</strong> ${new Date().toLocaleDateString()}</p>

            <p style="margin-top: 20px;">Please visit our pharmacy to collect your medicines or request home delivery.</p>
          </div>

          <div class="signature">
            <p>Sincerely,</p>
            <div class="signature-line"></div>
            <p><strong>${config.pharmacistName}</strong><br>Licensed Pharmacist<br>Thandizo Pharmacy</p>
          </div>

          <div class="disclaimer">
            ⚠️ Disclaimer: This prescription is valid for 30 days from the date issued. Keep medicines away from children. Consult your pharmacist before use.
          </div>
      ` +
      this.closeLetterhead()
    );
  }

  /**
   * Generate invoice/receipt letterhead
   */
  generateInvoiceLetter(config: LetterheadConfig & {
    invoiceNumber: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    total: number;
    paymentMethod: string;
  }): string {
    const itemsTable = config.items
      .map(
        item =>
          `<tr>
        <td>${item.description}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">MK ${item.unitPrice.toLocaleString()}</td>
        <td style="text-align:right">MK ${(item.quantity * item.unitPrice).toLocaleString()}</td>
      </tr>`,
      )
      .join('');

    return (
      this.getPharmacyLetterhead({
        ...config,
        subject: `Invoice #${config.invoiceNumber}`,
      }) +
      `
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTable}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align:right; font-weight:bold">TOTAL:</td>
                <td style="text-align:right; font-weight:bold; border-top: 2px solid #228B22;">MK ${config.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <p><strong>Payment Method:</strong> ${config.paymentMethod}</p>
          <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p style="margin-top: 20px;">Thank you for choosing Thandizo Pharmacy!</p>

          <div class="disclaimer">
            Thank you for your business. For invoice inquiries, contact us within 14 days.
          </div>
      ` +
      this.closeLetterhead()
    );
  }

  /**
   * Generate delivery note
   */
  generateDeliveryNote(config: LetterheadConfig & {
    orderId: string;
    items: Array<{ name: string; quantity: number }>;
    driverName: string;
    deliveryAddress: string;
  }): string {
    const itemsList = config.items.map(item => `<li>${item.name} (Qty: ${item.quantity})</li>`).join('');

    return (
      this.getPharmacyLetterhead({
        ...config,
        subject: `Delivery Note - Order #${config.orderId}`,
      }) +
      `
          <div class="content">
            <p>Dear ${config.recipientName},</p>
            <p>The items listed below have been dispatched from our pharmacy for delivery to you.</p>

            <h3 style="margin-top: 20px; color: #228B22;">Order Items:</h3>
            <ul style="margin-left: 20px;">
              ${itemsList}
            </ul>

            <h3 style="margin-top: 20px; color: #228B22;">Delivery Details:</h3>
            <div class="highlight">
              <p><strong>Delivery Address:</strong> ${config.deliveryAddress}</p>
              <p><strong>Driver:</strong> ${config.driverName}</p>
              <p><strong>Expected Delivery:</strong> ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>

            <p>Please ensure someone is available to receive the delivery. If you have any questions, please contact us immediately.</p>
          </div>

          <div class="signature">
            <p>Thandizo Pharmacy Delivery Team</p>
          </div>
      ` +
      this.closeLetterhead()
    );
  }
}

export const letterheadService = new LetterheadService();

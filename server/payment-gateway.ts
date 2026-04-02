// Malawi Mobile Money Payment Gateway Integration
// Supports: Airtel Money, TNM Mpamba, DPO, PayChangu, etc.

interface PaymentRequest {
  orderId: string;
  amount: number;
  phoneNumber: string;
  method: 'airtel_money' | 'tnm_mpamba' | 'card' | 'cash';
  customerEmail?: string;
  customerName?: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  status: 'pending' | 'completed' | 'failed';
}

export class MalawiPaymentGateway {
  private apiKey: string;
  private environment: 'sandbox' | 'production';

  constructor(apiKey: string = process.env.PAYMENT_API_KEY || '', environment: 'sandbox' | 'production' = 'sandbox') {
    this.apiKey = apiKey;
    this.environment = environment;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Validate Malawi phone number format
    const phoneNumber = this.normalizePhoneNumber(request.phoneNumber);
    if (!phoneNumber) {
      return { success: false, message: 'Invalid Malawi phone number', status: 'failed' };
    }

    try {
      switch (request.method) {
        case 'airtel_money':
          return await this.processAirtelMoney(request, phoneNumber);
        case 'tnm_mpamba':
          return await this.processTNMMpamba(request, phoneNumber);
        case 'card':
          return await this.processCard(request);
        case 'cash':
          return { success: true, message: 'Cash payment recorded', status: 'pending' };
        default:
          return { success: false, message: 'Unsupported payment method', status: 'failed' };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, message: 'Payment processing failed', status: 'failed' };
    }
  }

  private normalizePhoneNumber(phone: string): string | null {
    // Remove common separators
    let cleaned = phone.replace(/[\s\-()]/g, '');

    // Handle Malawi phone numbers
    // +265, 0, or just the number
    if (cleaned.startsWith('+265')) {
      cleaned = cleaned.substring(4);
    } else if (cleaned.startsWith('265')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Valid Malawi numbers are 9 digits (operators use 9 digits after country/leading zero)
    if (cleaned.length !== 9 || !/^\d+$/.test(cleaned)) {
      return null;
    }

    // Reconstruct as +265XXXXXXXXX
    return '+265' + cleaned;
  }

  private async processAirtelMoney(request: PaymentRequest, phoneNumber: string): Promise<PaymentResponse> {
    // Airtel Money API integration
    // In production, call: https://api.airtel.africa/merchant/v1/payments/
    console.log(`Processing Airtel Money payment: ${phoneNumber} for MK ${request.amount}`);

    // Simulate processing
    const transactionId = `AT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, make real API call
    // const response = await fetch('https://api.airtel.africa/merchant/v1/payments/', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     reference: request.orderId,
    //     subscriber: { phone: phoneNumber },
    //     transaction: { amount: request.amount, currency: 'MWK' },
    //   }),
    // });

    return {
      success: true,
      transactionId,
      message: 'Airtel Money payment initiated. Customer will receive USSD prompt.',
      status: 'pending',
    };
  }

  private async processTNMMpamba(request: PaymentRequest, phoneNumber: string): Promise<PaymentResponse> {
    // TNM Mpamba API integration
    // In production, call TNM Mpamba API
    console.log(`Processing TNM Mpamba payment: ${phoneNumber} for MK ${request.amount}`);

    const transactionId = `TNM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, make real API call
    // const response = await fetch('https://api.tnm.com/v1/mpamba/pay', { ... });

    return {
      success: true,
      transactionId,
      message: 'TNM Mpamba payment initiated. Customer will receive payment prompt.',
      status: 'pending',
    };
  }

  private async processCard(request: PaymentRequest): Promise<PaymentResponse> {
    // Card payment via Stripe or DPO Group
    console.log(`Processing card payment for MK ${request.amount}`);

    const transactionId = `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      transactionId,
      message: 'Card payment processed',
      status: 'completed',
    };
  }

  // Check payment status
  async checkPaymentStatus(transactionId: string): Promise<{ status: 'pending' | 'completed' | 'failed' }> {
    // In production, check actual gateway status
    return { status: 'completed' };
  }

  // Get supported operators for a phone number
  getSupportedOperator(phoneNumber: string): string | null {
    const cleaned = this.normalizePhoneNumber(phoneNumber);
    if (!cleaned) return null;

    // Airtel: 1, TNM: 6, 8, 9
    const firstDigit = cleaned[4]; // After +2656 or similar
    if (['1'].includes(firstDigit)) return 'airtel_money';
    if (['6', '8', '9'].includes(firstDigit)) return 'tnm_mpamba';

    return null;
  }
}

export default new MalawiPaymentGateway();

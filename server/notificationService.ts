import { randomUUID } from 'crypto';
import { emailService, EmailPayload } from './emailService';
import { logger } from './logger';

/**
 * Event-driven multi-channel Notification Service.
 * Provides template rendering, delivery queueing, retries, logs, and opt-in controls.
 */

export type NotificationChannel = 'email' | 'sms';
export type DeliveryStatus = 'queued' | 'processing' | 'sent' | 'failed' | 'skipped';

export interface NotificationPayload {
  userId: string;
  userEmail: string;
  firstName: string;
  type: 'welcome' | 'order-confirmation' | 'prescription-approved' | 'delivery-notification' | 'custom';
  data: Record<string, any>;
}

export interface NotificationJob {
  id: string;
  eventType: string;
  channels: NotificationChannel[];
  recipient: {
    userId?: string;
    email?: string;
    phone?: string;
    firstName?: string;
  };
  template: string;
  variables: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  status: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

export interface DeliveryLogEntry {
  id: string;
  jobId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  provider: string;
  attemptedAt: string;
  error?: string;
}

type TemplateRenderer = (variables: Record<string, unknown>) => { subject: string; html: string; text: string };

const templateRegistry: Record<string, TemplateRenderer> = {
  'appointment-confirmation': (vars) => ({
    subject: 'Appointment confirmation - Thandizo Pharmacy',
    html: `<p>Hello ${vars.firstName || 'there'}, your appointment is confirmed for ${vars.scheduledAt}.</p>`,
    text: `Your appointment is confirmed for ${vars.scheduledAt}.`,
  }),
  'prescription-ready': (vars) => ({
    subject: 'Prescription ready for collection',
    html: `<p>Your prescription ${vars.prescriptionId} is ready. ${vars.instructions || ''}</p>`,
    text: `Your prescription ${vars.prescriptionId} is ready. ${vars.instructions || ''}`,
  }),
  'refill-reminder': (vars) => ({
    subject: 'Medication refill reminder',
    html: `<p>Reminder: ${vars.medicationName} may be due for refill on ${vars.refillDate}.</p>`,
    text: `Reminder: ${vars.medicationName} may be due for refill on ${vars.refillDate}.`,
  }),
  'inventory-critical-alert': (vars) => ({
    subject: 'Critical inventory alert - Thandizo Pharmacy',
    html: `<p>${vars.message}</p><p><strong>Recommended action:</strong> ${vars.suggestedAction}</p>`,
    text: `${vars.message}\nRecommended action: ${vars.suggestedAction}`,
  }),
  'system-alert': (vars) => ({
    subject: `System alert: ${vars.title || 'Action required'}`,
    html: `<p>${vars.message}</p>`,
    text: String(vars.message || ''),
  }),
  custom: (vars) => ({
    subject: String(vars.subject || 'Thandizo Pharmacy notification'),
    html: String(vars.html || vars.message || ''),
    text: String(vars.text || vars.message || ''),
  }),
};

class SmsProvider {
  async send(to: string, message: string): Promise<boolean> {
    if (!to) return false;
    logger.info('SMS queued to provider abstraction', { to, messageLength: message.length });
    return true;
  }
}

class NotificationService {
  private queue: NotificationJob[] = [];
  private deliveryLogs: DeliveryLogEntry[] = [];
  private optOuts: Map<string, Set<NotificationChannel>> = new Map();
  private processing = false;
  private smsProvider = new SmsProvider();

  async enqueue(input: Omit<NotificationJob, 'id' | 'attempts' | 'maxAttempts' | 'status' | 'createdAt' | 'updatedAt'> & { maxAttempts?: number }): Promise<NotificationJob> {
    const now = new Date().toISOString();
    const job: NotificationJob = {
      id: randomUUID(),
      ...input,
      attempts: 0,
      maxAttempts: input.maxAttempts || 3,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    };

    this.queue.push(job);
    void this.processQueue();
    return job;
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    const templateMap: Record<NotificationPayload['type'], string> = {
      welcome: 'custom',
      'order-confirmation': 'custom',
      'prescription-approved': 'prescription-ready',
      'delivery-notification': 'custom',
      custom: 'custom',
    };

    const job = await this.enqueue({
      eventType: payload.type,
      channels: ['email'],
      recipient: {
        userId: payload.userId,
        email: payload.userEmail,
        firstName: payload.firstName,
      },
      template: templateMap[payload.type],
      variables: { firstName: payload.firstName, ...payload.data },
    });

    await this.processQueue();
    return job.status === 'sent' || this.deliveryLogs.some((log) => log.jobId === job.id && log.status === 'sent');
  }

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

  async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const nextJob = this.queue.find((job) => job.status === 'queued' || job.status === 'failed');
      if (!nextJob || nextJob.attempts >= nextJob.maxAttempts) return;

      nextJob.status = 'processing';
      nextJob.attempts += 1;
      nextJob.updatedAt = new Date().toISOString();

      const template = templateRegistry[nextJob.template] || templateRegistry.custom;
      const rendered = template({ ...nextJob.variables, firstName: nextJob.recipient.firstName });
      const channelResults = await Promise.all(nextJob.channels.map((channel) => this.deliver(nextJob, channel, rendered)));

      nextJob.status = channelResults.every(Boolean) ? 'sent' : nextJob.attempts >= nextJob.maxAttempts ? 'failed' : 'queued';
      nextJob.updatedAt = new Date().toISOString();
    } finally {
      this.processing = false;
      if (this.queue.some((job) => job.status === 'queued')) {
        setTimeout(() => void this.processQueue(), 250);
      }
    }
  }

  setOptOut(userId: string, channel: NotificationChannel, optedOut: boolean): void {
    const existing = this.optOuts.get(userId) || new Set<NotificationChannel>();
    if (optedOut) existing.add(channel);
    else existing.delete(channel);
    this.optOuts.set(userId, existing);
  }

  getDeliveryLogs(): DeliveryLogEntry[] {
    return this.deliveryLogs.slice().reverse();
  }

  getQueueStatus(): NotificationJob[] {
    return this.queue.slice().reverse();
  }

  private async deliver(job: NotificationJob, channel: NotificationChannel, rendered: { subject: string; html: string; text: string }): Promise<boolean> {
    const optedOut = job.recipient.userId ? this.optOuts.get(job.recipient.userId)?.has(channel) : false;
    const provider = channel === 'email' ? 'emailService' : 'smsProvider';

    if (optedOut) {
      this.recordDelivery(job.id, channel, 'skipped', provider);
      return true;
    }

    try {
      const success = channel === 'email'
        ? await emailService.send({ to: job.recipient.email || '', subject: rendered.subject, html: rendered.html } as EmailPayload)
        : await this.smsProvider.send(job.recipient.phone || '', rendered.text);

      this.recordDelivery(job.id, channel, success ? 'sent' : 'failed', provider, success ? undefined : 'Provider rejected message');
      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      job.lastError = message;
      this.recordDelivery(job.id, channel, 'failed', provider, message);
      logger.error('Notification delivery failed', { error, jobId: job.id, channel });
      return false;
    }
  }

  private recordDelivery(jobId: string, channel: NotificationChannel, status: DeliveryStatus, provider: string, error?: string): void {
    this.deliveryLogs.push({ id: randomUUID(), jobId, channel, status, provider, attemptedAt: new Date().toISOString(), error });
  }
}

export const notificationService = new NotificationService();

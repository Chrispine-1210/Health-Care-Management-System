/**
 * Webhook Manager - Event-driven architecture for order/delivery updates
 */

interface WebhookPayload {
  event: string;
  timestamp: number;
  data: any;
}

interface WebhookSubscriber {
  id: string;
  url: string;
  events: string[];
  active: boolean;
}

class WebhookManager {
  private subscribers: Map<string, WebhookSubscriber> = new Map();
  private eventQueue: WebhookPayload[] = [];

  /**
   * Register webhook subscriber
   */
  subscribe(id: string, url: string, events: string[]) {
    this.subscribers.set(id, {
      id,
      url,
      events,
      active: true,
    });
  }

  /**
   * Unsubscribe webhook
   */
  unsubscribe(id: string) {
    this.subscribers.delete(id);
  }

  /**
   * Emit event to all subscribed webhooks
   */
  async emit(event: string, data: any) {
    const payload: WebhookPayload = {
      event,
      timestamp: Date.now(),
      data,
    };

    for (const subscriber of this.subscribers.values()) {
      if (subscriber.active && subscriber.events.includes(event)) {
        this.eventQueue.push(payload);
        // In production, send to webhook URL asynchronously
      }
    }
  }

  /**
   * Process webhook queue
   */
  async processQueue() {
    while (this.eventQueue.length > 0) {
      const payload = this.eventQueue.shift();
      if (payload) {
        // Send webhook payload to subscribers
        console.log('Processing webhook:', payload);
      }
    }
  }

  /**
   * Get all subscribers
   */
  getSubscribers() {
    return Array.from(this.subscribers.values());
  }
}

export const webhookManager = new WebhookManager();

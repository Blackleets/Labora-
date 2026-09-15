
import { auditService } from '../audit/AuditService';

type EventHandler = (payload: any) => void;

interface EventMeta {
  user_id: string;
  organization_id?: string;
  country_code?: string;
  module: string;
  request_id?: string;
}

class EventBus {
  private handlers: Record<string, EventHandler[]> = {};

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  /**
   * Emit an event and automatically log to Audit Service if it's a significant action
   */
  emit(event: string, payload: any, meta: EventMeta) {
    // 1. Trigger subscribers
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => handler(payload));
    }

    // 2. Auto-Audit for state changes
    // We log everything that isn't purely UI interaction (like hover)
    auditService.logEvent({
      user_id: meta.user_id,
      organization_id: meta.organization_id,
      country_code: meta.country_code || 'GLOBAL',
      module: meta.module,
      action: event,
      request_id: meta.request_id,
      summary: `Event: ${event}`,
      details: payload,
      status: 'success'
    });
  }
}

export const eventBus = new EventBus();

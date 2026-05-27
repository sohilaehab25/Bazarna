/**
 * Order Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Preparation layer for customer notifications triggered by order status
 * transitions. All methods are stubs ready for integration.
 *
 * Planned integration points (implementation order):
 *   Phase 2 — Transactional email via the existing EmailService
 *   Phase 3 — SMS (Twilio / MessageBird) for shipped + delivered events
 *   Phase 4 — Push notifications (FCM) for mobile
 *   Phase 5 — Webhook delivery for third-party integrations
 */

import { Order, OrderStatus } from '../models/Order';
import { emitOrderStatusUpdate, OrderStatusUpdatePayload } from '../utils/socket';

// ---------------------------------------------------------------------------
// Payload type
// ---------------------------------------------------------------------------

export interface OrderStatusChangedPayload {
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  performedBy: string;
  reason?: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Transitions that warrant a customer notification
// ---------------------------------------------------------------------------

const CUSTOMER_NOTIFY_TRANSITIONS = new Set<OrderStatus>([
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
]);

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class OrderNotificationService {

  /**
   * Main dispatcher — called after every successful status transition.
   * Fires all applicable notification hooks in parallel (non-blocking).
   * Errors from individual hooks are caught and logged; they must never
   * propagate up to the HTTP response.
   */
  async dispatch(payload: OrderStatusChangedPayload, order: Order): Promise<void> {
    const hooks: Promise<void>[] = [];

    // Always push a real-time Socket.IO event
    hooks.push(this.pushRealtimeUpdate(payload));

    // Email customer on meaningful transitions
    if (CUSTOMER_NOTIFY_TRANSITIONS.has(payload.toStatus)) {
      const customerEmail = this.resolveCustomerEmail(order);
      if (customerEmail) {
        hooks.push(this.sendStatusEmail(payload, customerEmail));
      }
    }

    // SMS — only for high-value milestones
    if (payload.toStatus === OrderStatus.SHIPPED || payload.toStatus === OrderStatus.DELIVERED) {
      const phone = this.resolveCustomerPhone(order);
      if (phone) {
        hooks.push(this.sendSmsNotification(payload, phone));
      }
    }

    // Run all hooks; swallow individual failures
    const results = await Promise.allSettled(hooks);
    results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .forEach((r) =>
        console.error('[OrderNotificationService] Hook failed:', r.reason),
      );
  }

  // ---------------------------------------------------------------------------
  // Real-time — Socket.IO
  // ---------------------------------------------------------------------------

  private async pushRealtimeUpdate(payload: OrderStatusChangedPayload): Promise<void> {
    const socketPayload: OrderStatusUpdatePayload = {
      orderId:     payload.orderId,
      fromStatus:  payload.fromStatus,
      toStatus:    payload.toStatus,
      performedBy: payload.performedBy,
      reason:      payload.reason,
      timestamp:   payload.timestamp,
    };
    emitOrderStatusUpdate(socketPayload);
  }

  // ---------------------------------------------------------------------------
  // Email — Phase 2 integration point
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendStatusEmail(
    _payload: OrderStatusChangedPayload,
    _customerEmail: string,
  ): Promise<void> {
    /**
     * TODO Phase 2: Integrate with EmailService
     *
     * Example:
     *   const template = resolveEmailTemplate(_payload.toStatus);
     *   await emailService.send({
     *     to: _customerEmail,
     *     subject: `Your order ${_payload.orderId} — ${template.subject}`,
     *     html: template.render({ orderId: _payload.orderId, ... }),
     *   });
     */
  }

  // ---------------------------------------------------------------------------
  // SMS — Phase 3 integration point
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendSmsNotification(
    _payload: OrderStatusChangedPayload,
    _phone: string,
  ): Promise<void> {
    /**
     * TODO Phase 3: Integrate with Twilio / MessageBird
     *
     * Example:
     *   await twilioClient.messages.create({
     *     to: _phone,
     *     from: process.env.TWILIO_FROM,
     *     body: `Your order has been ${_payload.toStatus}.`,
     *   });
     */
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private resolveCustomerEmail(order: Order): string | null {
    if (order.customer?.email) return order.customer.email;
    if (typeof order.userId === 'object' && order.userId) {
      return (order.userId as unknown as { email?: string }).email ?? null;
    }
    return null;
  }

  private resolveCustomerPhone(order: Order): string | null {
    // Phone field not yet in Order model — hook is ready for when it is added.
    // Return null until phone collection is implemented.
    void order;
    return null;
  }
}

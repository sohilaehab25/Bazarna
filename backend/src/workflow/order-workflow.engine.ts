/**
 * Order Workflow Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised, single-source-of-truth for order status transitions.
 *
 * Design goals:
 *  • Explicit allow-list — anything not listed is forbidden by default.
 *  • Terminal states are enforced — once an order is cancelled/refunded it
 *    cannot change state.
 *  • Role restrictions are encoded here so callers never need to re-implement
 *    permission logic.
 *  • Descriptive error messages help the frontend surface actionable feedback.
 */

import { OrderStatus } from '../models/Order';
import { UserRole } from '../models/User';

// ---------------------------------------------------------------------------
// Transition map — the single source of truth
// ---------------------------------------------------------------------------

/**
 * Maps each status to the statuses that may legally follow it.
 * Any pair not listed here is INVALID.
 *
 * Pending    ──► Paid, Cancelled
 * Paid       ──► Processing, Refunded, Cancelled
 * Processing ──► Shipped, Cancelled
 * Preparing  ──► Shipped, Cancelled   (legacy alias — backward compat)
 * Shipped    ──► Delivered
 * Delivered  ──► Refunded
 * Cancelled  ──► (terminal)
 * Refunded   ──► (terminal)
 */
export const TRANSITION_MAP: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  [OrderStatus.PENDING]:    [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]:       [OrderStatus.PROCESSING, OrderStatus.REFUNDED, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]:  [OrderStatus.SHIPPED, OrderStatus.CANCELLED], // legacy
  [OrderStatus.SHIPPED]:    [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]:  [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]:  [],
  [OrderStatus.REFUNDED]:   [],
};

// ---------------------------------------------------------------------------
// Terminal and destructive sets
// ---------------------------------------------------------------------------

/** Orders in a terminal state cannot be transitioned further. */
export const TERMINAL_STATUSES = new Set<OrderStatus>([
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
]);

/**
 * Transitions that require an explicit reason field and must only be
 * performed by ADMIN. Front-end shows a confirmation dialog for these.
 */
export const DESTRUCTIVE_TRANSITIONS = new Set<OrderStatus>([
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
]);

// ---------------------------------------------------------------------------
// Role restrictions
// All transitions currently require ADMIN (backend routes are already admin-
// guarded), but the table is ready for future scoped roles (e.g. warehouse
// staff who may only ship, not cancel).
// ---------------------------------------------------------------------------

/**
 * Per-destination-status minimum role requirement.
 * Omitting a status means any authenticated admin can perform it.
 */
export const TRANSITION_ROLE_REQUIREMENTS: Readonly<Partial<Record<OrderStatus, UserRole[]>>> = {
  [OrderStatus.CANCELLED]: [UserRole.ADMIN],
  [OrderStatus.REFUNDED]:  [UserRole.ADMIN],
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Custom error class — allows controller to distinguish workflow errors from
// unexpected failures via instanceof rather than fragile string matching.
// ---------------------------------------------------------------------------

export class WorkflowValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowValidationError';
  }
}

/**
 * Validates a requested transition.
 * Throws a WorkflowValidationError on failure — caller uses instanceof to
 * return the correct HTTP status.
 */
export function validateTransition(
  from: OrderStatus,
  to: OrderStatus,
  performerRole?: UserRole,
): void {
  // 1. Terminal check
  if (TERMINAL_STATUSES.has(from)) {
    throw new WorkflowValidationError(
      `Order is in a terminal state (${from}) and cannot be transitioned further.`,
    );
  }

  // 2. Transition allowed?
  const allowed = TRANSITION_MAP[from] ?? [];
  if (!allowed.includes(to)) {
    const allowedStr = allowed.length > 0 ? allowed.join(', ') : 'none';
    throw new WorkflowValidationError(
      `Transition from "${from}" to "${to}" is not allowed. Allowed next states: ${allowedStr}.`,
    );
  }

  // 3. Role requirement
  const requiredRoles = TRANSITION_ROLE_REQUIREMENTS[to];
  if (requiredRoles && performerRole && !requiredRoles.includes(performerRole)) {
    throw new WorkflowValidationError(
      `Insufficient role to perform transition to "${to}". Required: ${requiredRoles.join(', ')}.`,
    );
  }
}

/**
 * Returns the valid destination statuses reachable from `from`.
 * Used to drive the frontend's dynamic action buttons.
 */
export function getAvailableTransitions(
  from: OrderStatus,
  performerRole?: UserRole,
): OrderStatus[] {
  const candidates = TRANSITION_MAP[from] ?? [];
  if (!performerRole) return [...candidates];

  return candidates.filter((to) => {
    const required = TRANSITION_ROLE_REQUIREMENTS[to];
    return !required || required.includes(performerRole);
  });
}

/**
 * Type guard — checks that a raw string is a valid OrderStatus value.
 */
export function isValidStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && Object.values(OrderStatus).includes(value as OrderStatus);
}

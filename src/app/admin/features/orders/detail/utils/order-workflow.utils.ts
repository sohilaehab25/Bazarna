/**
 * Frontend Order Workflow Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side mirror of the backend workflow engine.
 * Used to drive dynamic action buttons and disable invalid transitions
 * without a round-trip.
 *
 * IMPORTANT: The backend always re-validates. This layer is for UX only —
 * it prevents the user from even attempting an invalid transition.
 */

import { AdminOrderStatus } from '../../data-access/admin-orders.contracts';

// ---------------------------------------------------------------------------
// Transition action config
// ---------------------------------------------------------------------------

export interface AdminTransitionConfig {
  /** Target status if the action is confirmed */
  toStatus: AdminOrderStatus;
  /** Short label shown on the action button */
  label: string;
  /** Visual variant for the button */
  variant: 'primary' | 'warning' | 'danger';
  /** If set, a confirmation prompt is required before executing */
  confirmPrompt?: string;
  /** Single-line description shown below the button */
  description: string;
  /** Destructive transitions (cancel/refund) require explicit reason input */
  isDestructive: boolean;
}

// ---------------------------------------------------------------------------
// Transition map — must stay in sync with the backend TRANSITION_MAP
// ---------------------------------------------------------------------------

/** Shared transitions for processing/preparing statuses */
const PROCESSING_TRANSITIONS: readonly AdminTransitionConfig[] = [
  {
    toStatus: 'shipped',
    label: 'Mark as Shipped',
    variant: 'primary',
    isDestructive: false,
    description: 'Confirm the package has been dispatched',
  },
  {
    toStatus: 'cancelled',
    label: 'Cancel Order',
    variant: 'danger',
    isDestructive: true,
    confirmPrompt: 'Cancel this order? This cannot be undone.',
    description: 'Void the order',
  },
];

export const ADMIN_TRANSITION_MAP: Readonly<
  Record<AdminOrderStatus, readonly AdminTransitionConfig[]>
> = {
  pending: [
    {
      toStatus: 'paid',
      label: 'Confirm Payment',
      variant: 'primary',
      isDestructive: false,
      description: 'Mark payment as received and proceed',
    },
    {
      toStatus: 'cancelled',
      label: 'Cancel Order',
      variant: 'danger',
      isDestructive: true,
      confirmPrompt: 'Cancel this order? This cannot be undone.',
      description: 'Void the order entirely',
    },
  ],

  paid: [
    {
      toStatus: 'processing',
      label: 'Start Processing',
      variant: 'primary',
      isDestructive: false,
      description: 'Begin picking and packing',
    },
    {
      toStatus: 'refunded',
      label: 'Process Refund',
      variant: 'warning',
      isDestructive: true,
      confirmPrompt: 'Issue a full refund for this order?',
      description: 'Return funds to the customer',
    },
    {
      toStatus: 'cancelled',
      label: 'Cancel Order',
      variant: 'danger',
      isDestructive: true,
      confirmPrompt: 'Cancel this order? This cannot be undone.',
      description: 'Void the order',
    },
  ],

  processing: PROCESSING_TRANSITIONS,
  /** @deprecated legacy alias — same transitions as processing */
  preparing: PROCESSING_TRANSITIONS,

  shipped: [
    {
      toStatus: 'delivered',
      label: 'Confirm Delivery',
      variant: 'primary',
      isDestructive: false,
      description: 'Mark the order as successfully delivered',
    },
  ],

  delivered: [
    {
      toStatus: 'refunded',
      label: 'Process Refund',
      variant: 'warning',
      isDestructive: true,
      confirmPrompt: 'Issue a full refund for this delivered order?',
      description: 'Return funds to the customer',
    },
  ],

  cancelled: [],
  refunded:  [],
};

// ---------------------------------------------------------------------------
// Status display configuration
// ---------------------------------------------------------------------------

export interface AdminStatusDisplayConfig {
  label: string;
  /** BEM modifier applied to the badge element */
  badgeModifier: string;
  description: string;
}

export const ADMIN_STATUS_CONFIG: Readonly<
  Record<AdminOrderStatus, AdminStatusDisplayConfig>
> = {
  pending:    { label: 'Pending',    badgeModifier: 'pending',    description: 'Awaiting payment confirmation' },
  paid:       { label: 'Paid',       badgeModifier: 'paid',       description: 'Payment confirmed' },
  processing: { label: 'Processing', badgeModifier: 'processing', description: 'Being prepared for shipment' },
  preparing:  { label: 'Preparing',  badgeModifier: 'processing', description: 'Being prepared (legacy)' },
  shipped:    { label: 'Shipped',    badgeModifier: 'shipped',    description: 'En route to customer' },
  delivered:  { label: 'Delivered',  badgeModifier: 'delivered',  description: 'Delivered to customer' },
  cancelled:  { label: 'Cancelled',  badgeModifier: 'cancelled',  description: 'Order cancelled' },
  refunded:   { label: 'Refunded',   badgeModifier: 'refunded',   description: 'Order refunded' },
};

// ---------------------------------------------------------------------------
// Terminal statuses — no further transitions possible
// ---------------------------------------------------------------------------

export const ADMIN_TERMINAL_STATUSES = new Set<AdminOrderStatus>([
  'cancelled',
  'refunded',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getAvailableTransitions(
  status: AdminOrderStatus,
): readonly AdminTransitionConfig[] {
  return ADMIN_TRANSITION_MAP[status] ?? [];
}

export function isTerminalStatus(status: AdminOrderStatus): boolean {
  return ADMIN_TERMINAL_STATUSES.has(status);
}

export function formatStatus(status: AdminOrderStatus): string {
  return ADMIN_STATUS_CONFIG[status]?.label ?? status;
}

export function resolveBadgeClass(
  status: AdminOrderStatus,
  prefix = 'admin-smart-table__badge',
): string {
  const mod = ADMIN_STATUS_CONFIG[status]?.badgeModifier ?? 'neutral';
  return `${prefix}--${mod}`;
}

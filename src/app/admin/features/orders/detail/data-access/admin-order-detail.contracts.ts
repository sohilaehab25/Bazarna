import { ApiResponse } from '../../../../../../app.type';
import {
  AdminOrderCustomer,
  AdminOrderPaymentMethod,
  AdminOrderStatus,
  AdminOrderUserRef,
} from '../../data-access/admin-orders.contracts';

// ---------------------------------------------------------------------------
// Note (admin-authored, embedded in order)
// ---------------------------------------------------------------------------

export interface AdminOrderDetailNote {
  _id: string;
  author: string;
  body: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Product reference populated on order items
// ---------------------------------------------------------------------------

export interface AdminOrderDetailProductRef {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface AdminOrderDetailItem {
  productId: string | AdminOrderDetailProductRef;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Full hydrated order (returned by GET /api/orders/:id)
// ---------------------------------------------------------------------------

/**
 * Immutable audit entry appended on every status transition.
 * Mirrors the backend IStatusHistoryEntry shape.
 */
export interface AdminStatusHistoryEntry {
  _id: string;
  fromStatus: AdminOrderStatus;
  toStatus: AdminOrderStatus;
  performedBy: string;
  performedByRole: string;
  reason?: string;
  timestamp: string;
}

export interface AdminOrderDetail {
  _id: string;
  orderNumber?: number;
  userId?: string | AdminOrderUserRef;
  items: AdminOrderDetailItem[];
  totalPrice: number;
  status: AdminOrderStatus;
  paymentMethod: AdminOrderPaymentMethod;
  customer?: AdminOrderCustomer;
  notes: AdminOrderDetailNote[];
  statusHistory: AdminStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export type AdminOrderDetailResponseApi = ApiResponse<AdminOrderDetail>;

// ---------------------------------------------------------------------------
// Add-note request payload
// ---------------------------------------------------------------------------

export interface AdminOrderAddNotePayload {
  body: string;
}

// ---------------------------------------------------------------------------
// Synthetic timeline event (derived on the frontend from order state + notes)
// ---------------------------------------------------------------------------

export type AdminOrderTimelineEventType = 'created' | 'status_change' | 'note';

export interface AdminOrderTimelineEvent {
  id: string;
  type: AdminOrderTimelineEventType;
  label: string;
  description?: string;
  timestamp: string;
  statusValue?: AdminOrderStatus;
}

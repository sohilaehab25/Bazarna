import { ApiResponse } from '../../../../../app.type';

// ---------------------------------------------------------------------------
// Primitive domain types
// ---------------------------------------------------------------------------

export type AdminOrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  /** @deprecated Legacy alias for processing — kept for backward compat */
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type AdminOrderPaymentMethod = 'cash' | 'visa';
export type AdminOrdersSortBy = 'createdAt' | 'updatedAt' | 'totalPrice' | 'status';
export type AdminOrdersSortOrder = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Embedded value objects
// ---------------------------------------------------------------------------

export interface AdminOrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
}

export interface AdminOrderUserRef {
  _id: string;
  name: string;
  email: string;
}

export interface AdminOrderProductRef {
  _id: string;
  name: string;
  price: number;
}

export interface AdminOrderItem {
  productId: string | AdminOrderProductRef;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Main domain entity
// ---------------------------------------------------------------------------

export interface AdminOrder {
  _id: string;
  orderNumber?: number;
  userId?: string | AdminOrderUserRef;
  items: AdminOrderItem[];
  totalPrice: number;
  status: AdminOrderStatus;
  paymentMethod: AdminOrderPaymentMethod;
  customer?: AdminOrderCustomer;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Query / filter shape (serialized to HTTP params)
// ---------------------------------------------------------------------------

export interface AdminOrdersQuery {
  page: number;
  pageSize: number;
  search: string;
  status: AdminOrderStatus | 'all';
  paymentMethod: AdminOrderPaymentMethod | 'all';
  dateFrom: string;
  dateTo: string;
  minRevenue: string;
  maxRevenue: string;
  sortBy: AdminOrdersSortBy;
  sortOrder: AdminOrdersSortOrder;
}

// ---------------------------------------------------------------------------
// Pagination meta (mirrors backend shape)
// ---------------------------------------------------------------------------

export interface AdminOrdersPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------

export interface AdminOrdersResponse {
  items: AdminOrder[];
  pagination: AdminOrdersPagination;
}

export type AdminOrdersResponseApi = ApiResponse<AdminOrdersResponse>;

import {
  AdminTableCellValue,
  AdminTableColumn,
  AdminTableRow,
} from '../../shared/components/admin-smart-table/admin-smart-table.component';
import {
  AdminOrder,
  AdminOrderStatus,
  AdminOrderPaymentMethod,
  AdminOrdersSortBy,
} from './data-access/admin-orders.contracts';

// ---------------------------------------------------------------------------
// Status / payment filter option shapes
// ---------------------------------------------------------------------------

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export const ADMIN_ORDERS_STATUS_OPTIONS: readonly SelectOption<AdminOrderStatus | 'all'>[] = [
  { value: 'all',        label: 'All statuses' },
  { value: 'pending',    label: 'Pending'    },
  { value: 'paid',       label: 'Paid'       },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped',    label: 'Shipped'    },
  { value: 'delivered',  label: 'Delivered'  },
  { value: 'cancelled',  label: 'Cancelled'  },
  { value: 'refunded',   label: 'Refunded'   },
];

export const ADMIN_ORDERS_PAYMENT_OPTIONS: readonly SelectOption<AdminOrderPaymentMethod | 'all'>[] = [
  { value: 'all', label: 'All methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'visa', label: 'Visa' },
];

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

export const ADMIN_ORDERS_TABLE_COLUMNS: readonly AdminTableColumn[] = [
  { key: 'shortId', header: 'Order ID', width: '10%' },
  { key: 'customerName', header: 'Customer' },
  { key: 'customerEmail', header: 'Email' },
  {
    key: 'status',
    header: 'Status',
    type: 'badge',
    sortable: true,
    align: 'center',
    width: '11%',
    formatter: formatOrderStatus,
    badgeClassResolver: resolveOrderStatusClass,
  },
  {
    key: 'paymentMethod',
    header: 'Payment',
    type: 'badge',
    align: 'center',
    width: '10%',
    formatter: formatPaymentMethod,
    badgeClassResolver: resolvePaymentMethodClass,
  },
  {
    key: 'totalPrice',
    header: 'Total',
    type: 'currency',
    sortable: true,
    align: 'right',
    width: '10%',
  },
  { key: 'itemCount', header: 'Items', type: 'number', align: 'center', width: '7%' },
  { key: 'createdAt', header: 'Placed', type: 'date', sortable: true, width: '11%' },
];

// ---------------------------------------------------------------------------
// Sort key mapping
// ---------------------------------------------------------------------------

export const ADMIN_ORDERS_SORT_BY_COLUMN: Readonly<Record<string, AdminOrdersSortBy>> = {
  totalPrice: 'totalPrice',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  status: 'status',
};

export function isSortableOrdersColumn(
  columnKey: string,
): columnKey is keyof typeof ADMIN_ORDERS_SORT_BY_COLUMN {
  return Object.hasOwn(ADMIN_ORDERS_SORT_BY_COLUMN, columnKey);
}

export function isAdminOrderStatusFilter(value: string): value is AdminOrderStatus | 'all' {
  return ADMIN_ORDERS_STATUS_OPTIONS.some((option) => option.value === value);
}

export function isAdminOrderPaymentFilter(value: string): value is AdminOrderPaymentMethod | 'all' {
  return ADMIN_ORDERS_PAYMENT_OPTIONS.some((option) => option.value === value);
}

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------

export function toAdminOrderTableRow(order: AdminOrder): AdminTableRow {
  const customer = order.customer;
  const user = typeof order.userId === 'object' ? order.userId : null;

  const customerName = customer
    ? `${customer.firstName} ${customer.lastName}`.trim()
    : (user?.name ?? 'Guest');

  const customerEmail = customer?.email ?? user?.email ?? 'N/A';

  return {
    _id: order._id,
    shortId: order.orderNumber ? `#${order.orderNumber}` : '#' + order._id.slice(-8).toUpperCase(),
    customerName,
    customerEmail,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalPrice: order.totalPrice,
    itemCount: order.items.length,
    createdAt: order.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Formatters and badge resolvers
// ---------------------------------------------------------------------------

function formatOrderStatus(value: AdminTableCellValue): string {
  const v = typeof value === 'string' ? value.toLowerCase() : '';
  const map: Record<string, string> = {
    pending:    'Pending',
    paid:       'Paid',
    processing: 'Processing',
    preparing:  'Preparing',
    shipped:    'Shipped',
    delivered:  'Delivered',
    cancelled:  'Cancelled',
    refunded:   'Refunded',
  };
  return map[v] ?? 'Unknown';
}

function resolveOrderStatusClass(value: AdminTableCellValue): string {
  const v = typeof value === 'string' ? value.toLowerCase() : '';
  const map: Record<string, string> = {
    pending:    'admin-smart-table__badge--pending',
    paid:       'admin-smart-table__badge--paid',
    processing: 'admin-smart-table__badge--processing',
    preparing:  'admin-smart-table__badge--processing',
    shipped:    'admin-smart-table__badge--shipped',
    delivered:  'admin-smart-table__badge--delivered',
    cancelled:  'admin-smart-table__badge--cancelled',
    refunded:   'admin-smart-table__badge--refunded',
  };
  return map[v] ?? 'admin-smart-table__badge--neutral';
}

function formatPaymentMethod(value: AdminTableCellValue): string {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';
  switch (normalized) {
    case 'cash':
      return 'Cash';
    case 'visa':
      return 'Visa';
    default:
      return 'N/A';
  }
}

function resolvePaymentMethodClass(value: AdminTableCellValue): string {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';
  switch (normalized) {
    case 'cash':
      return 'admin-smart-table__badge--cash';
    case 'visa':
      return 'admin-smart-table__badge--visa';
    default:
      return 'admin-smart-table__badge--neutral';
  }
}

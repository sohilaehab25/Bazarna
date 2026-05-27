import {
  AdminTableCellValue,
  AdminTableColumn,
  AdminTableRow,
} from '../../shared/components/admin-smart-table/admin-smart-table.component';
import {
  AdminProduct,
  AdminProductStatus,
  AdminProductsBulkAction,
  AdminProductsSortBy,
  AdminProductsStockState,
} from './data-access/admin-products.contracts';

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface BulkActionOption {
  action: AdminProductsBulkAction;
  label: string;
  variant: 'default' | 'danger';
}

export const ADMIN_PRODUCTS_STATUS_OPTIONS: readonly SelectOption<AdminProductStatus | 'all'>[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

export const ADMIN_PRODUCTS_STOCK_STATE_OPTIONS: readonly SelectOption<AdminProductsStockState>[] = [
  { value: 'all', label: 'All stock states' },
  { value: 'in-stock', label: 'In stock' },
  { value: 'low-stock', label: 'Low stock' },
  { value: 'out-of-stock', label: 'Out of stock' },
];

export const ADMIN_PRODUCTS_BULK_ACTIONS: readonly BulkActionOption[] = [
  { action: 'activate', label: 'Activate', variant: 'default' },
  { action: 'mark-draft', label: 'Move to Draft', variant: 'default' },
  { action: 'archive', label: 'Archive', variant: 'default' },
  { action: 'delete', label: 'Delete', variant: 'danger' },
];

export const ADMIN_PRODUCTS_TABLE_COLUMNS: readonly AdminTableColumn[] = [
  { key: 'name', header: 'Product', sortable: true },
  { key: 'category', header: 'Category' },
  {
    key: 'status',
    header: 'Status',
    type: 'badge',
    sortable: true,
    align: 'center',
    width: '13%',
    formatter: formatStatus,
    badgeClassResolver: resolveStatusClass,
  },
  {
    key: 'stock',
    header: 'Stock Health',
    type: 'badge',
    sortable: true,
    align: 'center',
    width: '13%',
    formatter: formatStock,
    badgeClassResolver: resolveStockClass,
  },
  { key: 'price', header: 'Price', type: 'currency', sortable: true, align: 'right', width: '14%' },
  { key: 'updatedAt', header: 'Updated', type: 'date', sortable: true, width: '14%' },
];

export const ADMIN_PRODUCTS_SORT_BY_COLUMN: Readonly<Record<string, AdminProductsSortBy>> = {
  name: 'name',
  price: 'price',
  stock: 'stock',
  status: 'status',
  updatedAt: 'updatedAt',
};

export function toAdminProductTableRow(product: AdminProduct): AdminTableRow {
  return {
    _id: product._id,
    name: product.name,
    category: product.categoryId?.name ?? 'Uncategorized',
    status: product.status ?? 'active',
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold ?? 10,
    price: product.price,
    updatedAt: product.updatedAt,
  };
}

export function isSortableProductsColumn(columnKey: string): columnKey is keyof typeof ADMIN_PRODUCTS_SORT_BY_COLUMN {
  return Object.hasOwn(ADMIN_PRODUCTS_SORT_BY_COLUMN, columnKey);
}

export function isAdminProductStatusFilter(value: string): value is AdminProductStatus | 'all' {
  return ADMIN_PRODUCTS_STATUS_OPTIONS.some((option) => option.value === value);
}

export function isAdminProductsStockStateFilter(value: string): value is AdminProductsStockState {
  return ADMIN_PRODUCTS_STOCK_STATE_OPTIONS.some((option) => option.value === value);
}

function formatStatus(value: AdminTableCellValue): string {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';

  switch (normalized) {
    case 'active':
      return 'Active';
    case 'draft':
      return 'Draft';
    case 'archived':
      return 'Archived';
    default:
      return 'N/A';
  }
}

function resolveStatusClass(value: AdminTableCellValue): string {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';

  if (normalized === 'active' || normalized === 'draft' || normalized === 'archived') {
    return `admin-smart-table__badge--${normalized}`;
  }

  return 'admin-smart-table__badge--neutral';
}

function formatStock(value: AdminTableCellValue, row: AdminTableRow): string {
  const stock = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(stock)) {
    return 'N/A';
  }

  const threshold = typeof row['lowStockThreshold'] === 'number' ? row['lowStockThreshold'] : 10;

  if (stock <= 0) {
    return 'Out of stock';
  }

  if (stock <= threshold) {
    return `Low (${stock})`;
  }

  return `In stock (${stock})`;
}

function resolveStockClass(value: AdminTableCellValue, row: AdminTableRow): string {
  const stock = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(stock)) {
    return 'admin-smart-table__badge--neutral';
  }

  const threshold = typeof row['lowStockThreshold'] === 'number' ? row['lowStockThreshold'] : 10;

  if (stock <= 0) {
    return 'admin-smart-table__badge--out';
  }

  if (stock <= threshold) {
    return 'admin-smart-table__badge--low';
  }

  return 'admin-smart-table__badge--in';
}

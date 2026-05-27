import {
    AdminTableColumn,
    AdminTableRow,
} from '../../shared/components/admin-smart-table/admin-smart-table.component';
import {
    AdminInventoryRecord,
    AdminInventorySortBy,
    AdminInventoryStatus,
} from './data-access/admin-inventory.contracts';

// ---------------------------------------------------------------------------
// Filter Options
// ---------------------------------------------------------------------------

interface SelectOption<T extends string> {
    value: T;
    label: string;
}

export const ADMIN_INVENTORY_STATUS_OPTIONS: readonly SelectOption<AdminInventoryStatus | 'all'>[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'in-stock', label: 'In Stock' },
    { value: 'low-stock', label: 'Low Stock' },
    { value: 'out-of-stock', label: 'Out of Stock' },
    { value: 'reserved', label: 'Reserved' },
];

export const ADMIN_INVENTORY_LOG_TYPE_OPTIONS: readonly SelectOption<string>[] = [
    { value: 'all', label: 'All types' },
    { value: 'restock', label: 'Restock' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'sale', label: 'Sale' },
    { value: 'reservation', label: 'Reservation' },
    { value: 'release', label: 'Release' },
    { value: 'return', label: 'Return' },
];

// ---------------------------------------------------------------------------
// Table Columns
// ---------------------------------------------------------------------------

export const ADMIN_INVENTORY_TABLE_COLUMNS: readonly AdminTableColumn[] = [
    { key: 'productName', header: 'Product', sortable: false },
    {
        key: 'status',
        header: 'Status',
        type: 'badge',
        align: 'center',
        width: '12%',
        formatter: formatInventoryStatus,
        badgeClassResolver: resolveStatusClass,
    },
    {
        key: 'availableStock',
        header: 'Available',
        type: 'number',
        sortable: true,
        align: 'right',
        width: '11%',
    },
    {
        key: 'reservedStock',
        header: 'Reserved',
        type: 'number',
        sortable: true,
        align: 'right',
        width: '11%',
    },
    {
        key: 'totalStock',
        header: 'Total',
        type: 'number',
        sortable: true,
        align: 'right',
        width: '10%',
    },
    {
        key: 'threshold',
        header: 'Threshold',
        type: 'number',
        align: 'right',
        width: '10%',
    },
    {
        key: 'lastRestocked',
        header: 'Last Restocked',
        type: 'date',
        sortable: true,
        width: '14%',
    },
];

export const ADMIN_INVENTORY_SORT_BY_COLUMN: Readonly<Record<string, AdminInventorySortBy>> = {
    availableStock: 'availableStock',
    reservedStock: 'reservedStock',
    totalStock: 'totalStock',
    lastRestocked: 'lastRestockedAt',
};

// ---------------------------------------------------------------------------
// Row Mapping
// ---------------------------------------------------------------------------

export function toAdminInventoryTableRow(record: AdminInventoryRecord): AdminTableRow {
    return {
        _id: record._id,
        productId: record.productId?._id ?? '',
        productName: record.productId?.name ?? 'Unknown Product',
        status: record.status,
        availableStock: record.availableStock,
        reservedStock: record.reservedStock,
        totalStock: record.totalStock,
        threshold: record.lowStockThreshold,
        lastRestocked: record.lastRestockedAt,
    };
}

// ---------------------------------------------------------------------------
// Formatters & Resolvers
// ---------------------------------------------------------------------------

function formatInventoryStatus(value: unknown): string {
    switch (value) {
        case 'in-stock':
            return 'In Stock';
        case 'low-stock':
            return 'Low Stock';
        case 'out-of-stock':
            return 'Out of Stock';
        case 'reserved':
            return 'Reserved';
        default:
            return String(value ?? '');
    }
}

function resolveStatusClass(value: unknown): string {
    switch (value) {
        case 'in-stock':
            return 'badge--success';
        case 'low-stock':
            return 'badge--warning';
        case 'out-of-stock':
            return 'badge--danger';
        case 'reserved':
            return 'badge--info';
        default:
            return 'badge--neutral';
    }
}

// ---------------------------------------------------------------------------
// Guard helpers
// ---------------------------------------------------------------------------

export function isInventoryStatusFilter(value: string): value is AdminInventoryStatus | 'all' {
    return ['all', 'in-stock', 'low-stock', 'out-of-stock', 'reserved'].includes(value);
}

export function isSortableInventoryColumn(key: string): boolean {
    return key in ADMIN_INVENTORY_SORT_BY_COLUMN;
}

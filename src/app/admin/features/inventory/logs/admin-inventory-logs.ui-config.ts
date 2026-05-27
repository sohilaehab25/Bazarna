import { AdminTableColumn, AdminTableRow } from '../../../shared/components/admin-smart-table/admin-smart-table.component';
import { AdminInventoryLogEntry, AdminInventoryLogReferenceType, AdminInventoryLogType } from '../data-access/admin-inventory.contracts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LogTypeConfig {
    label: string;
    badgeClass: string;
    icon: string;
}

export interface SelectOption<T extends string> {
    value: T;
    label: string;
}

// ---------------------------------------------------------------------------
// Log Type Configuration (single source of truth)
// ---------------------------------------------------------------------------

export const INVENTORY_LOG_TYPE_CONFIG: Readonly<Record<AdminInventoryLogType, LogTypeConfig>> = {
    sale: { label: 'Sale', badgeClass: 'badge--danger', icon: '↓' },
    reservation: { label: 'Reserved', badgeClass: 'badge--warning', icon: '⏸' },
    release: { label: 'Released', badgeClass: 'badge--info', icon: '↩' },
    restock: { label: 'Restocked', badgeClass: 'badge--success', icon: '↑' },
    adjustment: { label: 'Adjusted', badgeClass: 'badge--neutral', icon: '⇄' },
    return: { label: 'Returned', badgeClass: 'badge--info', icon: '↩' },
    refund: { label: 'Refunded', badgeClass: 'badge--success', icon: '↑' },
    import: { label: 'Imported', badgeClass: 'badge--success', icon: '📦' },
    warehouse_transfer: { label: 'Transfer', badgeClass: 'badge--info', icon: '🔄' },
    initial: { label: 'Initial', badgeClass: 'badge--neutral', icon: '●' },
};

export const INVENTORY_REF_TYPE_LABELS: Readonly<Record<AdminInventoryLogReferenceType, string>> = {
    order: 'Order',
    manual: 'Manual',
    system: 'System',
    return_request: 'Return',
    import: 'Import',
    transfer: 'Transfer',
};

// ---------------------------------------------------------------------------
// Filter Options
// ---------------------------------------------------------------------------

export const INVENTORY_LOG_TYPE_OPTIONS: readonly SelectOption<AdminInventoryLogType | 'all'>[] = [
    { value: 'all', label: 'All Types' },
    ...Object.entries(INVENTORY_LOG_TYPE_CONFIG).map(([value, config]) => ({
        value: value as AdminInventoryLogType,
        label: config.label,
    })),
];

export const INVENTORY_REF_TYPE_OPTIONS: readonly SelectOption<AdminInventoryLogReferenceType | 'all'>[] = [
    { value: 'all', label: 'All Sources' },
    ...Object.entries(INVENTORY_REF_TYPE_LABELS).map(([value, label]) => ({
        value: value as AdminInventoryLogReferenceType,
        label,
    })),
];

// ---------------------------------------------------------------------------
// Formatters (pure functions)
// ---------------------------------------------------------------------------

export function formatLogType(type: AdminInventoryLogType): string {
    return INVENTORY_LOG_TYPE_CONFIG[type]?.label ?? type;
}

export function formatRefType(type: AdminInventoryLogReferenceType): string {
    return INVENTORY_REF_TYPE_LABELS[type] ?? type;
}

export function resolveLogTypeBadgeClass(type: AdminInventoryLogType): string {
    return INVENTORY_LOG_TYPE_CONFIG[type]?.badgeClass ?? 'badge--neutral';
}

export function resolveLogTypeIcon(type: AdminInventoryLogType): string {
    return INVENTORY_LOG_TYPE_CONFIG[type]?.icon ?? '•';
}

export function formatQuantity(value: number): string {
    return value > 0 ? `+${value}` : String(value);
}

export function resolveQuantityClass(quantity: number): string {
    if (quantity > 0) return 'qty--positive';
    if (quantity < 0) return 'qty--negative';
    return '';
}

// ---------------------------------------------------------------------------
// Table Column Configuration
// ---------------------------------------------------------------------------

export const INVENTORY_LOGS_TABLE_COLUMNS: readonly AdminTableColumn[] = [
    {
        key: 'createdAt',
        header: 'Date',
        type: 'date',
        width: '160px',
    },
    {
        key: 'productName',
        header: 'Product',
        type: 'text',
        width: '200px',
    },
    {
        key: 'type',
        header: 'Type',
        type: 'badge',
        width: '130px',
        formatter: (val) => formatLogType(val as AdminInventoryLogType),
        badgeClassResolver: (val) => resolveLogTypeBadgeClass(val as AdminInventoryLogType),
    },
    {
        key: 'quantity',
        header: 'Qty',
        type: 'number',
        width: '80px',
        align: 'right',
        formatter: (val) => formatQuantity(val as number),
    },
    {
        key: 'newAvailable',
        header: 'After (Avail)',
        type: 'number',
        width: '100px',
        align: 'right',
    },
    {
        key: 'referenceType',
        header: 'Source',
        type: 'badge',
        width: '110px',
        formatter: (val) => formatRefType(val as AdminInventoryLogReferenceType),
        badgeClassResolver: () => 'badge--neutral',
    },
    {
        key: 'reason',
        header: 'Reason',
        type: 'text',
    },
    {
        key: 'performedByName',
        header: 'By',
        type: 'text',
        width: '120px',
    },
];

// ---------------------------------------------------------------------------
// Row Mapping
// ---------------------------------------------------------------------------

export function toLogTableRow(log: AdminInventoryLogEntry): AdminTableRow {
    return {
        _id: log._id,
        createdAt: log.createdAt,
        productName: log.productId?.name ?? 'Unknown',
        type: log.type,
        quantity: log.quantity,
        previousAvailable: log.previousAvailable,
        newAvailable: log.newAvailable,
        previousReserved: log.previousReserved,
        newReserved: log.newReserved,
        referenceType: log.referenceType,
        referenceId: log.referenceId,
        reason: log.reason,
        performedByName: log.performedBy?.name ?? 'System',
    };
}

// ---------------------------------------------------------------------------
// Timeline Grouping (pure function)
// ---------------------------------------------------------------------------

export interface TimelineGroup {
    date: string;
    entries: AdminInventoryLogEntry[];
}

export function groupLogsByDate(logs: readonly AdminInventoryLogEntry[]): TimelineGroup[] {
    const groups: TimelineGroup[] = [];
    const map = new Map<string, AdminInventoryLogEntry[]>();

    for (const log of logs) {
        const date = log.createdAt.substring(0, 10);
        if (!map.has(date)) {
            const entries: AdminInventoryLogEntry[] = [];
            map.set(date, entries);
            groups.push({ date, entries });
        }
        map.get(date)!.push(log);
    }

    return groups;
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isLogType(value: string): value is AdminInventoryLogType {
    return value in INVENTORY_LOG_TYPE_CONFIG;
}

export function isRefType(value: string): value is AdminInventoryLogReferenceType {
    return value in INVENTORY_REF_TYPE_LABELS;
}

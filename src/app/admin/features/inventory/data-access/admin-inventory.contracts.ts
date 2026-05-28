import { ApiResponse } from '../../../../../app.type';

// ---------------------------------------------------------------------------
// Inventory Status
// ---------------------------------------------------------------------------

export type AdminInventoryStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'reserved';

// ---------------------------------------------------------------------------
// Inventory Log Types
// ---------------------------------------------------------------------------

export type AdminInventoryLogType =
    | 'sale'
    | 'reservation'
    | 'release'
    | 'restock'
    | 'adjustment'
    | 'return'
    | 'refund'
    | 'import'
    | 'warehouse_transfer'
    | 'initial';

export type AdminInventoryLogReferenceType = 'order' | 'manual' | 'system' | 'return_request' | 'import' | 'transfer';

// ---------------------------------------------------------------------------
// Query/Filter Types
// ---------------------------------------------------------------------------

export type AdminInventorySortBy =
    | 'availableStock'
    | 'reservedStock'
    | 'totalStock'
    | 'updatedAt'
    | 'lastRestockedAt';

export type AdminInventorySortOrder = 'asc' | 'desc';

export interface AdminInventoryQuery {
    page: number;
    pageSize: number;
    search: string;
    status: AdminInventoryStatus | 'all';
    warehouseId: string;
    sortBy: AdminInventorySortBy;
    sortOrder: AdminInventorySortOrder;
}

// ---------------------------------------------------------------------------
// Core Data Interfaces
// ---------------------------------------------------------------------------

export interface AdminInventoryProductRef {
    _id: string;
    name: string;
    imageUrl: string;
    price: number;
    status: string;
    categoryId?: string;
}

export interface AdminInventoryRecord {
    _id: string;
    productId: AdminInventoryProductRef;
    warehouseId: string;
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    lowStockThreshold: number;
    status: AdminInventoryStatus;
    lastRestockedAt: string | null;
    lastAuditedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminInventoryLogEntry {
    _id: string;
    productId: { _id: string; name: string; imageUrl: string } | null;
    warehouseId: string;
    type: AdminInventoryLogType;
    quantity: number;
    previousAvailable: number;
    newAvailable: number;
    previousReserved: number;
    newReserved: number;
    referenceType: AdminInventoryLogReferenceType;
    referenceId: string | null;
    performedBy: { _id: string; name: string; email: string } | null;
    reason: string;
    metadata: Record<string, unknown>;
    createdAt: string;
}

// ---------------------------------------------------------------------------
// Statistics / Summaries
// ---------------------------------------------------------------------------

export interface AdminInventoryStats {
    totalProducts: number;
    totalStock: number;
    totalAvailable: number;
    totalReserved: number;
    outOfStockCount: number;
    lowStockCount: number;
    inStockCount: number;
}

export interface AdminInventoryActivityEntry {
    _id: AdminInventoryLogType;
    count: number;
    totalQuantity: number;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface AdminInventoryPagination {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------

export interface AdminInventoryListResponse {
    items: AdminInventoryRecord[];
    pagination: AdminInventoryPagination;
}

export interface AdminInventoryLogsResponse {
    items: AdminInventoryLogEntry[];
    pagination: AdminInventoryPagination;
}

// ---------------------------------------------------------------------------
// Mutation Payloads
// ---------------------------------------------------------------------------

export interface AdminRestockPayload {
    productId: string;
    quantity: number;
    warehouseId?: string;
    reason: string;
}

export interface AdminAdjustPayload {
    productId: string;
    newAvailableStock: number;
    warehouseId?: string;
    reason: string;
}

export interface AdminThresholdPayload {
    productId: string;
    threshold: number;
    warehouseId?: string;
}

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

export type AdminInventoryListApi = ApiResponse<AdminInventoryListResponse>;
export type AdminInventoryStatsApi = ApiResponse<AdminInventoryStats>;
export type AdminInventoryRecordApi = ApiResponse<AdminInventoryRecord>;
export type AdminInventoryLogsApi = ApiResponse<AdminInventoryLogsResponse>;
export type AdminInventoryLowStockApi = ApiResponse<AdminInventoryRecord[]>;
export type AdminInventoryActivityApi = ApiResponse<AdminInventoryActivityEntry[]>;
export type AdminInventoryHistoryApi = ApiResponse<AdminInventoryLogEntry[]>;
export type AdminInventorySyncApi = ApiResponse<{ synced: number }>;

// ---------------------------------------------------------------------------
// Dashboard Analytics
// ---------------------------------------------------------------------------

export interface AdminInventoryTimelineDay {
    _id: string; // date string YYYY-MM-DD
    movements: {
        type: AdminInventoryLogType;
        totalQuantity: number;
        count: number;
    }[];
}

export interface AdminInventoryTopSellingProduct {
    _id: string;
    totalSold: number;
    transactionCount: number;
    productName: string;
    productPrice: number;
    productImageUrl: string;
}

export interface AdminInventoryDashboardData {
    stats: AdminInventoryStats;
    lowStock: AdminInventoryRecord[];
    activity: AdminInventoryActivityEntry[];
    timeline: AdminInventoryTimelineDay[];
    topSelling: AdminInventoryTopSellingProduct[];
    recentMovements: AdminInventoryLogEntry[];
}

export type AdminInventoryDashboardApi = ApiResponse<AdminInventoryDashboardData>;
export type AdminInventoryTopSellingApi = ApiResponse<AdminInventoryTopSellingProduct[]>;
export type AdminInventoryTimelineApi = ApiResponse<AdminInventoryTimelineDay[]>;

// ---------------------------------------------------------------------------
// Inventory Logs Query (advanced filtering)
// ---------------------------------------------------------------------------

export interface AdminInventoryLogsQuery {
    page: number;
    pageSize: number;
    productId?: string;
    warehouseId?: string;
    type?: AdminInventoryLogType | 'all';
    referenceType?: AdminInventoryLogReferenceType | 'all';
    performedBy?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

// ---------------------------------------------------------------------------
// New Mutation Payloads
// ---------------------------------------------------------------------------

export interface AdminRefundPayload {
    productId: string;
    quantity: number;
    orderId: string;
    warehouseId?: string;
    reason: string;
}

export interface AdminImportPayload {
    items: { productId: string; quantity: number }[];
    warehouseId?: string;
    reason: string;
}

export interface AdminTransferPayload {
    productId: string;
    quantity: number;
    fromWarehouse: string;
    toWarehouse: string;
    reason: string;
}

export interface AdminImportResult {
    imported: number;
    errors: string[];
}

export type AdminRefundApi = ApiResponse<AdminInventoryRecord>;
export type AdminImportApi = ApiResponse<AdminImportResult>;
export type AdminTransferApi = ApiResponse<{ from: AdminInventoryRecord; to: AdminInventoryRecord }>;

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
    AdminAdjustPayload,
    AdminInventoryActivityEntry,
    AdminInventoryLogEntry,
    AdminInventoryLogsQuery,
    AdminInventoryPagination,
    AdminInventoryQuery,
    AdminInventoryRecord,
    AdminInventorySortBy,
    AdminInventorySortOrder,
    AdminInventoryStats,
    AdminInventoryStatus,
    AdminRestockPayload,
    AdminThresholdPayload,
} from './admin-inventory.contracts';
import { AdminInventoryApiService } from './admin-inventory-api.service';

const DEFAULT_QUERY: AdminInventoryQuery = {
    page: 1,
    pageSize: 20,
    search: '',
    status: 'all',
    warehouseId: 'default',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
};

const DEFAULT_PAGINATION: AdminInventoryPagination = {
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

const DEFAULT_STATS: AdminInventoryStats = {
    totalProducts: 0,
    totalStock: 0,
    totalAvailable: 0,
    totalReserved: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    inStockCount: 0,
};

@Injectable({
    providedIn: 'root',
})
export class AdminInventoryStore {
    private readonly api = inject(AdminInventoryApiService);

    // -----------------------------------------------------------------------
    // State signals
    // -----------------------------------------------------------------------

    private readonly initializedState = signal(false);

    private readonly queryState = signal<AdminInventoryQuery>({ ...DEFAULT_QUERY });
    private readonly inventoryState = signal<readonly AdminInventoryRecord[]>([]);
    private readonly paginationState = signal<AdminInventoryPagination>({ ...DEFAULT_PAGINATION });
    private readonly statsState = signal<AdminInventoryStats>({ ...DEFAULT_STATS });
    private readonly lowStockState = signal<readonly AdminInventoryRecord[]>([]);
    private readonly activityState = signal<readonly AdminInventoryActivityEntry[]>([]);
    private readonly logsState = signal<readonly AdminInventoryLogEntry[]>([]);
    private readonly logsPaginationState = signal<AdminInventoryPagination>({ ...DEFAULT_PAGINATION });

    private readonly loadingState = signal(false);
    private readonly statsLoadingState = signal(false);
    private readonly logsLoadingState = signal(false);
    private readonly mutationLoadingState = signal(false);

    private readonly errorState = signal<string | null>(null);
    private readonly mutationErrorState = signal<string | null>(null);
    private readonly mutationSuccessState = signal<string | null>(null);

    // -----------------------------------------------------------------------
    // Public readonly selectors
    // -----------------------------------------------------------------------

    readonly query = this.queryState.asReadonly();
    readonly inventory = this.inventoryState.asReadonly();
    readonly pagination = this.paginationState.asReadonly();
    readonly stats = this.statsState.asReadonly();
    readonly lowStock = this.lowStockState.asReadonly();
    readonly activity = this.activityState.asReadonly();
    readonly logs = this.logsState.asReadonly();
    readonly logsPagination = this.logsPaginationState.asReadonly();

    readonly loading = this.loadingState.asReadonly();
    readonly statsLoading = this.statsLoadingState.asReadonly();
    readonly logsLoading = this.logsLoadingState.asReadonly();
    readonly mutationLoading = this.mutationLoadingState.asReadonly();

    readonly error = this.errorState.asReadonly();
    readonly mutationError = this.mutationErrorState.asReadonly();
    readonly mutationSuccess = this.mutationSuccessState.asReadonly();

    // Derived
    readonly hasRows = computed(() => this.inventoryState().length > 0);
    readonly hasActiveFilters = computed(() => {
        const q = this.queryState();
        return q.search.trim().length > 0 || q.status !== 'all';
    });
    readonly lowStockCount = computed(() => this.lowStockState().length);

    // -----------------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------------

    init(): void {
        if (!this.initializedState()) {
            this.initializedState.set(true);
            this.loadStats();
            this.loadLowStock();
            this.loadActivity();
        }
        this.loadInventory();
    }

    refresh(): void {
        this.loadInventory();
        this.loadStats();
        this.loadLowStock();
    }

    // -----------------------------------------------------------------------
    // Filter mutations
    // -----------------------------------------------------------------------

    resetFilters(): void {
        this.patchQuery({ search: '', status: 'all' }, true);
    }

    setSearch(value: string): void {
        this.patchQuery({ search: value.trim() }, true);
    }

    setStatus(value: AdminInventoryStatus | 'all'): void {
        this.patchQuery({ status: value }, true);
    }

    setSortBy(sortBy: AdminInventorySortBy): void {
        this.patchQuery({ sortBy }, false);
    }

    setSortOrder(sortOrder: AdminInventorySortOrder): void {
        this.patchQuery({ sortOrder }, false);
    }

    setPage(page: number): void {
        this.patchQuery({ page }, false);
    }

    setPageSize(pageSize: number): void {
        this.patchQuery({ pageSize, page: 1 }, false);
    }

    toggleSort(sortBy: AdminInventorySortBy): void {
        const current = this.queryState();
        if (current.sortBy === sortBy) {
            this.patchQuery({ sortOrder: current.sortOrder === 'asc' ? 'desc' : 'asc' }, false);
        } else {
            this.patchQuery({ sortBy, sortOrder: 'desc' }, false);
        }
    }

    // -----------------------------------------------------------------------
    // Inventory mutations
    // -----------------------------------------------------------------------

    restock(payload: AdminRestockPayload): void {
        this.mutationLoadingState.set(true);
        this.mutationErrorState.set(null);
        this.mutationSuccessState.set(null);

        this.api.restock(payload).subscribe({
            next: () => {
                this.mutationSuccessState.set('Stock restocked successfully');
                this.mutationLoadingState.set(false);
                this.refresh();
            },
            error: (err: HttpErrorResponse) => {
                this.mutationErrorState.set(err.error?.message ?? 'Restock failed');
                this.mutationLoadingState.set(false);
            },
        });
    }

    adjust(payload: AdminAdjustPayload): void {
        this.mutationLoadingState.set(true);
        this.mutationErrorState.set(null);
        this.mutationSuccessState.set(null);

        this.api.adjust(payload).subscribe({
            next: () => {
                this.mutationSuccessState.set('Stock adjusted successfully');
                this.mutationLoadingState.set(false);
                this.refresh();
            },
            error: (err: HttpErrorResponse) => {
                this.mutationErrorState.set(err.error?.message ?? 'Adjustment failed');
                this.mutationLoadingState.set(false);
            },
        });
    }

    setThreshold(payload: AdminThresholdPayload): void {
        this.mutationLoadingState.set(true);
        this.mutationErrorState.set(null);
        this.mutationSuccessState.set(null);

        this.api.setThreshold(payload).subscribe({
            next: () => {
                this.mutationSuccessState.set('Threshold updated');
                this.mutationLoadingState.set(false);
                this.refresh();
            },
            error: (err: HttpErrorResponse) => {
                this.mutationErrorState.set(err.error?.message ?? 'Failed to update threshold');
                this.mutationLoadingState.set(false);
            },
        });
    }

    syncFromProducts(): void {
        this.mutationLoadingState.set(true);
        this.mutationErrorState.set(null);
        this.mutationSuccessState.set(null);

        this.api.syncFromProducts().subscribe({
            next: (result) => {
                this.mutationSuccessState.set(`Synced ${result.synced} products`);
                this.mutationLoadingState.set(false);
                this.refresh();
            },
            error: (err: HttpErrorResponse) => {
                this.mutationErrorState.set(err.error?.message ?? 'Sync failed');
                this.mutationLoadingState.set(false);
            },
        });
    }

    // -----------------------------------------------------------------------
    // Logs tab
    // -----------------------------------------------------------------------

    loadLogs(options?: { productId?: string; type?: string; page?: number }): void {
        this.logsLoadingState.set(true);

        this.api
            .getLogs({
                page: options?.page ?? 1,
                pageSize: 20,
                productId: options?.productId,
                type: (options?.type as AdminInventoryLogsQuery['type']) ?? 'all',
            })
            .subscribe({
                next: (res) => {
                    this.logsState.set(res.items);
                    this.logsPaginationState.set(res.pagination);
                    this.logsLoadingState.set(false);
                },
                error: () => {
                    this.logsLoadingState.set(false);
                },
            });
    }

    // -----------------------------------------------------------------------
    // Dismiss messages
    // -----------------------------------------------------------------------

    dismissMutationSuccess(): void {
        this.mutationSuccessState.set(null);
    }

    dismissMutationError(): void {
        this.mutationErrorState.set(null);
    }

    // -----------------------------------------------------------------------
    // Private
    // -----------------------------------------------------------------------

    private patchQuery(patch: Partial<AdminInventoryQuery>, resetPage: boolean): void {
        const current = this.queryState();
        const next: AdminInventoryQuery = {
            ...current,
            ...patch,
            page: resetPage ? 1 : patch.page ?? current.page,
        };

        if (JSON.stringify(current) === JSON.stringify(next)) {
            return;
        }

        this.queryState.set(next);
        this.loadInventory();
    }

    private loadInventory(): void {
        this.loadingState.set(true);
        this.errorState.set(null);

        this.api.getInventoryList(this.queryState()).subscribe({
            next: (res) => {
                this.inventoryState.set(res.items);
                this.paginationState.set(res.pagination);
                this.loadingState.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.errorState.set(err.error?.message ?? 'Failed to load inventory');
                this.loadingState.set(false);
            },
        });
    }

    private loadStats(): void {
        this.statsLoadingState.set(true);

        this.api.getStats().subscribe({
            next: (stats) => {
                this.statsState.set(stats);
                this.statsLoadingState.set(false);
            },
            error: () => {
                this.statsLoadingState.set(false);
            },
        });
    }

    private loadLowStock(): void {
        this.api.getLowStockAlerts().subscribe({
            next: (items) => {
                this.lowStockState.set(items);
            },
            error: () => {
                // Silent fail — stats card handles empty state
            },
        });
    }

    private loadActivity(): void {
        this.api.getActivitySummary().subscribe({
            next: (entries) => {
                this.activityState.set(entries);
            },
            error: () => {
                // Silent fail
            },
        });
    }
}

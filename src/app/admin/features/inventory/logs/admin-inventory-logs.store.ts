import { DestroyRef, Injectable, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { AdminInventoryApiService } from '../data-access/admin-inventory-api.service';
import {
    AdminInventoryLogEntry,
    AdminInventoryLogType,
    AdminInventoryLogReferenceType,
    AdminInventoryLogsQuery,
    AdminInventoryPagination,
} from '../data-access/admin-inventory.contracts';

// ---------------------------------------------------------------------------
// State interfaces
// ---------------------------------------------------------------------------

export interface LogsFilterState {
    type: AdminInventoryLogType | 'all';
    referenceType: AdminInventoryLogReferenceType | 'all';
    dateFrom: string;
    dateTo: string;
    search: string;
    productId: string;
}

const DEFAULT_FILTERS: LogsFilterState = {
    type: 'all',
    referenceType: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    productId: '',
};

const DEFAULT_PAGINATION: AdminInventoryPagination = {
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

@Injectable()
export class AdminInventoryLogsStore {
    private readonly api = inject(AdminInventoryApiService);
    private readonly destroyRef = inject(DestroyRef);

    // Trigger subject — emits whenever we need to (re)load
    private readonly loadTrigger$ = new Subject<void>();

    // State
    readonly logs = signal<readonly AdminInventoryLogEntry[]>([]);
    readonly pagination = signal<AdminInventoryPagination>(DEFAULT_PAGINATION);
    readonly filters = signal<LogsFilterState>(DEFAULT_FILTERS);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly viewMode = signal<'table' | 'timeline'>('table');

    // Computed
    readonly totalItems = computed(() => this.pagination().totalItems);
    readonly totalPages = computed(() => this.pagination().totalPages);
    readonly hasData = computed(() => this.logs().length > 0);

    constructor() {
        // Single reactive pipeline — switchMap cancels previous in-flight request
        this.loadTrigger$
            .pipe(
                tap(() => {
                    this.loading.set(true);
                    this.error.set(null);
                }),
                switchMap(() => {
                    const query = this.buildQuery();
                    return this.api.getLogs(query).pipe(
                        catchError((err) => {
                            this.error.set(err?.error?.message || 'Failed to load logs');
                            this.loading.set(false);
                            return EMPTY;
                        })
                    );
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((data) => {
                this.logs.set(data.items);
                this.pagination.set(data.pagination);
                this.loading.set(false);
            });
    }

    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------

    load(): void {
        this.loadTrigger$.next();
    }

    setPage(page: number): void {
        this.pagination.update((p) => ({ ...p, page }));
        this.load();
    }

    setFilters(partial: Partial<LogsFilterState>): void {
        this.filters.update((f) => ({ ...f, ...partial }));
        this.pagination.update((p) => ({ ...p, page: 1 }));
        this.load();
    }

    resetFilters(): void {
        this.filters.set(DEFAULT_FILTERS);
        this.pagination.update((p) => ({ ...p, page: 1 }));
        this.load();
    }

    setViewMode(mode: 'table' | 'timeline'): void {
        this.viewMode.set(mode);
    }

    // ---------------------------------------------------------------------------
    // Private
    // ---------------------------------------------------------------------------

    private buildQuery(): AdminInventoryLogsQuery {
        const p = this.pagination();
        const f = this.filters();

        return {
            page: p.page,
            pageSize: p.pageSize,
            type: f.type,
            referenceType: f.referenceType,
            dateFrom: f.dateFrom || undefined,
            dateTo: f.dateTo || undefined,
            search: f.search || undefined,
            productId: f.productId || undefined,
        };
    }
}

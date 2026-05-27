import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AdminOrder,
  AdminOrdersPagination,
  AdminOrdersQuery,
  AdminOrdersSortBy,
  AdminOrdersSortOrder,
} from './admin-orders.contracts';
import { AdminOrdersApiService } from './admin-orders-api.service';

const DEFAULT_QUERY: AdminOrdersQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  status: 'all',
  paymentMethod: 'all',
  dateFrom: '',
  dateTo: '',
  minRevenue: '',
  maxRevenue: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const DEFAULT_PAGINATION: AdminOrdersPagination = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

@Injectable({
  providedIn: 'root',
})
export class AdminOrdersStore {
  private readonly api = inject(AdminOrdersApiService);

  private readonly initializedState = signal(false);

  // Request token guards against out-of-order HTTP responses
  private readonly requestToken = signal(0);

  private readonly queryState = signal<AdminOrdersQuery>({ ...DEFAULT_QUERY });
  private readonly ordersState = signal<readonly AdminOrder[]>([]);
  private readonly paginationState = signal<AdminOrdersPagination>({ ...DEFAULT_PAGINATION });
  private readonly selectedIdsState = signal<readonly string[]>([]);

  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  // ---------------------------------------------------------------------------
  // Public read-only signals
  // ---------------------------------------------------------------------------

  readonly query = this.queryState.asReadonly();
  readonly orders = this.ordersState.asReadonly();
  readonly pagination = this.paginationState.asReadonly();
  readonly selectedIds = this.selectedIdsState.asReadonly();

  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly selectedCount = computed(() => this.selectedIdsState().length);
  readonly hasRows = computed(() => this.ordersState().length > 0);

  readonly hasActiveFilters = computed(() => {
    const q = this.queryState();
    return (
      q.search.trim().length > 0 ||
      q.status !== 'all' ||
      q.paymentMethod !== 'all' ||
      q.dateFrom !== '' ||
      q.dateTo !== '' ||
      q.minRevenue !== '' ||
      q.maxRevenue !== ''
    );
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init(): void {
    if (this.initializedState()) {
      this.loadOrders();
      return;
    }

    this.initializedState.set(true);
    this.loadOrders();
  }

  refresh(): void {
    this.loadOrders();
  }

  // ---------------------------------------------------------------------------
  // Filter mutations - each resets to page 1 and re-fetches
  // ---------------------------------------------------------------------------

  resetFilters(): void {
    this.patchQuery(
      {
        search: '',
        status: 'all',
        paymentMethod: 'all',
        dateFrom: '',
        dateTo: '',
        minRevenue: '',
        maxRevenue: '',
      },
      true
    );
  }

  setSearch(value: string): void {
    this.patchQuery({ search: value.trim() }, true);
  }

  setStatus(value: AdminOrdersQuery['status']): void {
    this.patchQuery({ status: value }, true);
  }

  setPaymentMethod(value: AdminOrdersQuery['paymentMethod']): void {
    this.patchQuery({ paymentMethod: value }, true);
  }

  setDateFrom(value: string): void {
    this.patchQuery({ dateFrom: value }, true);
  }

  setDateTo(value: string): void {
    this.patchQuery({ dateTo: value }, true);
  }

  setMinRevenue(value: string): void {
    this.patchQuery({ minRevenue: value }, true);
  }

  setMaxRevenue(value: string): void {
    this.patchQuery({ maxRevenue: value }, true);
  }

  // ---------------------------------------------------------------------------
  // Pagination mutations
  // ---------------------------------------------------------------------------

  setPage(page: number): void {
    const normalized = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    this.patchQuery({ page: normalized }, false);
  }

  setPageSize(pageSize: number): void {
    const normalized = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : DEFAULT_QUERY.pageSize;
    this.patchQuery({ pageSize: normalized }, true);
  }

  // ---------------------------------------------------------------------------
  // Sort mutation
  // ---------------------------------------------------------------------------

  updateSort(sortBy: AdminOrdersSortBy, sortOrder: AdminOrdersSortOrder): void {
    this.patchQuery({ sortBy, sortOrder }, true);
  }

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  setSelectedIds(ids: readonly string[]): void {
    const normalizedIds = [...new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0))];
    if (this.areStringArraysEqual(this.selectedIdsState(), normalizedIds)) {
      return;
    }

    this.selectedIdsState.set(normalizedIds);
  }

  clearSelection(): void {
    this.selectedIdsState.set([]);
  }

  // ---------------------------------------------------------------------------
  // Private fetch
  // ---------------------------------------------------------------------------

  private loadOrders(): void {
    const token = this.requestToken() + 1;
    this.requestToken.set(token);

    this.loadingState.set(true);
    this.errorState.set(null);

    this.api.getOrders(this.queryState()).subscribe({
      next: (response) => {
        if (this.requestToken() !== token) {
          return; // Stale response - discard
        }

        this.ordersState.set(response.items);
        this.paginationState.set(response.pagination);
        this.loadingState.set(false);
        this.clearSelection();
      },
      error: (error: unknown) => {
        if (this.requestToken() !== token) {
          return;
        }

        this.loadingState.set(false);
        this.ordersState.set([]);
        this.paginationState.set({
          ...DEFAULT_PAGINATION,
          page: this.queryState().page,
          pageSize: this.queryState().pageSize,
        });
        this.errorState.set(this.resolveErrorMessage(error));
      },
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }

      return error.message || 'Unable to load orders.';
    }

    return 'Unable to load orders.';
  }

  private patchQuery(patch: Partial<AdminOrdersQuery>, resetPage: boolean): void {
    const current = this.queryState();
    const next: AdminOrdersQuery = {
      ...current,
      ...patch,
    };

    if (resetPage) {
      next.page = 1;
    }

    if (this.areQueriesEqual(current, next)) {
      return;
    }

    this.queryState.set(next);
    this.loadOrders();
  }

  private areQueriesEqual(first: AdminOrdersQuery, second: AdminOrdersQuery): boolean {
    return (
      first.page === second.page &&
      first.pageSize === second.pageSize &&
      first.search === second.search &&
      first.status === second.status &&
      first.paymentMethod === second.paymentMethod &&
      first.dateFrom === second.dateFrom &&
      first.dateTo === second.dateTo &&
      first.minRevenue === second.minRevenue &&
      first.maxRevenue === second.maxRevenue &&
      first.sortBy === second.sortBy &&
      first.sortOrder === second.sortOrder
    );
  }

  private areStringArraysEqual(first: readonly string[], second: readonly string[]): boolean {
    if (first.length !== second.length) {
      return false;
    }

    return first.every((value, index) => value === second[index]);
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Category } from '../../../../../app.type';
import {
  AdminProduct,
  AdminProductsBulkAction,
  AdminProductsBulkActionResult,
  AdminProductsPagination,
  AdminProductsQuery,
  AdminProductsSortBy,
  AdminProductsSortOrder,
  CreateProductPayload,
  UpdateProductPayload,
} from './admin-products.contracts';
import { AdminProductsApiService } from './admin-products-api.service';

const DEFAULT_QUERY: AdminProductsQuery = {
  page: 1,
  pageSize: 12,
  search: '',
  categoryId: null,
  status: 'all',
  stockState: 'all',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

const DEFAULT_PAGINATION: AdminProductsPagination = {
  page: 1,
  pageSize: 12,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

@Injectable({
  providedIn: 'root',
})
export class AdminProductsStore {
  private readonly api = inject(AdminProductsApiService);

  private readonly initializedState = signal(false);
  private readonly requestToken = signal(0);

  private readonly queryState = signal<AdminProductsQuery>({ ...DEFAULT_QUERY });
  private readonly productsState = signal<readonly AdminProduct[]>([]);
  private readonly paginationState = signal<AdminProductsPagination>({
    ...DEFAULT_PAGINATION,
  });
  private readonly categoriesState = signal<readonly Category[]>([]);
  private readonly selectedIdsState = signal<readonly string[]>([]);

  private readonly loadingState = signal(false);
  private readonly categoriesLoadingState = signal(false);
  private readonly bulkLoadingState = signal(false);

  private readonly errorState = signal<string | null>(null);
  private readonly bulkErrorState = signal<string | null>(null);
  private readonly bulkSuccessState = signal<string | null>(null);

  readonly query = this.queryState.asReadonly();
  readonly products = this.productsState.asReadonly();
  readonly pagination = this.paginationState.asReadonly();
  readonly categories = this.categoriesState.asReadonly();
  readonly selectedIds = this.selectedIdsState.asReadonly();

  readonly loading = this.loadingState.asReadonly();
  readonly categoriesLoading = this.categoriesLoadingState.asReadonly();
  readonly bulkLoading = this.bulkLoadingState.asReadonly();

  readonly error = this.errorState.asReadonly();
  readonly bulkError = this.bulkErrorState.asReadonly();
  readonly bulkSuccess = this.bulkSuccessState.asReadonly();

  readonly selectedCount = computed(() => this.selectedIdsState().length);
  readonly hasRows = computed(() => this.productsState().length > 0);
  readonly hasActiveFilters = computed(() => {
    const query = this.queryState();
    return (
      query.search.trim().length > 0 ||
      query.categoryId !== null ||
      query.status !== 'all' ||
      query.stockState !== 'all'
    );
  });

  init(): void {
    if (!this.initializedState()) {
      this.initializedState.set(true);
      this.loadCategories();
    }

    this.loadProducts();
  }

  refresh(): void {
    this.loadProducts();
  }

  resetFilters(): void {
    this.patchQuery(
      {
        search: '',
        categoryId: null,
        status: 'all',
        stockState: 'all',
      },
      true
    );
  }

  setSearch(value: string): void {
    this.patchQuery({ search: value.trim() }, true);
  }

  setCategoryId(value: string | null): void {
    this.patchQuery({ categoryId: value }, true);
  }

  setStatus(value: AdminProductsQuery['status']): void {
    this.patchQuery({ status: value }, true);
  }

  setStockState(value: AdminProductsQuery['stockState']): void {
    this.patchQuery({ stockState: value }, true);
  }

  setPage(page: number): void {
    const normalized = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    this.patchQuery({ page: normalized }, false);
  }

  setPageSize(pageSize: number): void {
    const normalized = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 12;
    this.patchQuery({ pageSize: normalized }, true);
  }

  updateSort(sortBy: AdminProductsSortBy, sortOrder: AdminProductsSortOrder): void {
    this.patchQuery({ sortBy, sortOrder }, true);
  }

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

  runBulkAction(action: AdminProductsBulkAction): void {
    if (this.bulkLoadingState()) {
      return;
    }

    const selectedIds = this.selectedIdsState();
    if (selectedIds.length === 0) {
      return;
    }

    this.bulkLoadingState.set(true);
    this.bulkErrorState.set(null);
    this.bulkSuccessState.set(null);

    this.api
      .runBulkAction({
        action,
        productIds: [...selectedIds],
      })
      .subscribe({
        next: (result) => {
          this.bulkLoadingState.set(false);
          this.clearSelection();
          this.bulkSuccessState.set(this.describeBulkResult(action, result));
          this.loadProducts();
        },
        error: (error: unknown) => {
          this.bulkLoadingState.set(false);
          this.bulkErrorState.set(this.resolveErrorMessage(error, 'Unable to complete bulk action.'));
        },
      });
  }

  // CRUD operations
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  createProduct(payload: CreateProductPayload): void {
    this.saving.set(true);
    this.saveError.set(null);

    this.api.createProduct(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadProducts();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.resolveErrorMessage(error, 'Failed to create product.'));
      },
    });
  }

  updateProduct(id: string, payload: UpdateProductPayload): void {
    this.saving.set(true);
    this.saveError.set(null);

    this.api.updateProduct(id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadProducts();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.resolveErrorMessage(error, 'Failed to update product.'));
      },
    });
  }

  deleteProduct(id: string): void {
    this.saving.set(true);
    this.saveError.set(null);

    this.api.deleteProduct(id).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadProducts();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.resolveErrorMessage(error, 'Failed to delete product.'));
      },
    });
  }

  private loadProducts(): void {
    const token = this.requestToken() + 1;
    this.requestToken.set(token);

    this.loadingState.set(true);
    this.errorState.set(null);

    this.api.getProducts(this.queryState()).subscribe({
      next: (response) => {
        if (this.requestToken() !== token) {
          return;
        }

        this.productsState.set(
          response.items.map((item) => ({
            ...item,
            status: item.status ?? 'active',
          }))
        );
        this.paginationState.set(response.pagination);
        this.loadingState.set(false);
        this.errorState.set(null);
        this.clearSelection();
      },
      error: (error: unknown) => {
        if (this.requestToken() !== token) {
          return;
        }

        this.loadingState.set(false);
        this.productsState.set([]);
        this.paginationState.set({
          ...DEFAULT_PAGINATION,
          page: this.queryState().page,
          pageSize: this.queryState().pageSize,
        });
        this.errorState.set(this.resolveErrorMessage(error, 'Unable to load products.'));
      },
    });
  }

  private loadCategories(): void {
    this.categoriesLoadingState.set(true);

    this.api.getCategories().subscribe({
      next: (categories) => {
        this.categoriesLoadingState.set(false);
        this.categoriesState.set(categories);
      },
      error: () => {
        this.categoriesLoadingState.set(false);
        this.categoriesState.set([]);
      },
    });
  }

  private describeBulkResult(
    action: AdminProductsBulkAction,
    result: AdminProductsBulkActionResult
  ): string {
    if (action === 'delete') {
      return `${result.deletedCount} product(s) deleted.`;
    }

    return `${result.modifiedCount} product(s) updated.`;
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }

      return error.message || fallback;
    }

    return fallback;
  }

  private patchQuery(patch: Partial<AdminProductsQuery>, resetPage: boolean): void {
    const current = this.queryState();
    const next: AdminProductsQuery = {
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
    this.bulkSuccessState.set(null);
    this.bulkErrorState.set(null);
    this.loadProducts();
  }

  private areQueriesEqual(first: AdminProductsQuery, second: AdminProductsQuery): boolean {
    return (
      first.page === second.page &&
      first.pageSize === second.pageSize &&
      first.search === second.search &&
      first.categoryId === second.categoryId &&
      first.status === second.status &&
      first.stockState === second.stockState &&
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

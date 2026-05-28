import { Injectable, inject, signal, computed } from '@angular/core';
import { AdminCategoriesApiService } from './admin-categories-api.service';
import {
  AdminCategoriesQuery,
  AdminCategoriesPagination,
  AdminCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from './admin-categories.contracts';

@Injectable({
  providedIn: 'root',
})
export class AdminCategoriesStore {
  private readonly api = inject(AdminCategoriesApiService);

  private readonly _items = signal<AdminCategory[]>([]);
  private readonly _pagination = signal<AdminCategoriesPagination>({
    page: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0,
  });
  private readonly _query = signal<AdminCategoriesQuery>({
    page: 1,
    pageSize: 12,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _saving = signal(false);
  private readonly _saveError = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly query = this._query.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly saveError = this._saveError.asReadonly();

  loadCategories(query?: Partial<AdminCategoriesQuery>): void {
    if (query) {
      this._query.update((q) => ({ ...q, ...query }));
    }
    this._loading.set(true);
    this._error.set(null);

    this.api.getCategories(this._query()).subscribe({
      next: (res) => {
        this._items.set(res.items);
        this._pagination.set(res.pagination);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('Failed to load categories');
        this._loading.set(false);
      },
    });
  }

  createCategory(payload: CreateCategoryPayload): void {
    this._saving.set(true);
    this._saveError.set(null);

    this.api.createCategory(payload).subscribe({
      next: () => {
        this._saving.set(false);
        this.loadCategories();
      },
      error: () => {
        this._saveError.set('Failed to create category');
        this._saving.set(false);
      },
    });
  }

  updateCategory(id: string, payload: UpdateCategoryPayload): void {
    this._saving.set(true);
    this._saveError.set(null);

    this.api.updateCategory(id, payload).subscribe({
      next: () => {
        this._saving.set(false);
        this.loadCategories();
      },
      error: () => {
        this._saveError.set('Failed to update category');
        this._saving.set(false);
      },
    });
  }

  deleteCategory(id: string): void {
    this.api.deleteCategory(id).subscribe({
      next: () => this.loadCategories(),
      error: () => this._error.set('Failed to delete category'),
    });
  }
}

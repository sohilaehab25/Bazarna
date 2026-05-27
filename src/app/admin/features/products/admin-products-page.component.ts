import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AdminSmartTableComponent,
  AdminTableRow,
  AdminTableSortChange,
} from '../../shared/components/admin-smart-table/admin-smart-table.component';
import { AdminTablePaginationComponent } from '../../shared/components/admin-table-pagination/admin-table-pagination.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AdminProduct, AdminProductsBulkAction, CreateProductPayload, UpdateProductPayload } from './data-access/admin-products.contracts';
import { AdminProductsStore } from './data-access/admin-products.store';
import {
  ADMIN_PRODUCTS_BULK_ACTIONS,
  ADMIN_PRODUCTS_SORT_BY_COLUMN,
  ADMIN_PRODUCTS_STATUS_OPTIONS,
  ADMIN_PRODUCTS_STOCK_STATE_OPTIONS,
  ADMIN_PRODUCTS_TABLE_COLUMNS,
  isAdminProductStatusFilter,
  isAdminProductsStockStateFilter,
  isSortableProductsColumn,
  toAdminProductTableRow,
} from './admin-products.ui-config';
import { AdminProductFormComponent } from './components/admin-product-form.component';

@Component({
  selector: 'app-admin-products-page',
  imports: [AdminSmartTableComponent, AdminTablePaginationComponent, AdminProductFormComponent],
  templateUrl: './admin-products-page.component.html',
  styleUrl: './admin-products-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductsPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(AdminProductsStore);
  private readonly searchInput$ = new Subject<string>();

  readonly query = this.store.query;
  readonly pagination = this.store.pagination;
  readonly products = this.store.products;
  readonly categories = this.store.categories;

  readonly loading = this.store.loading;
  readonly categoriesLoading = this.store.categoriesLoading;
  readonly error = this.store.error;
  readonly bulkLoading = this.store.bulkLoading;
  readonly bulkError = this.store.bulkError;
  readonly bulkSuccess = this.store.bulkSuccess;
  readonly selectedIds = this.store.selectedIds;
  readonly selectedCount = this.store.selectedCount;
  readonly hasActiveFilters = this.store.hasActiveFilters;

  readonly searchValue = signal('');

  readonly columns = ADMIN_PRODUCTS_TABLE_COLUMNS;
  readonly statusOptions = ADMIN_PRODUCTS_STATUS_OPTIONS;
  readonly stockStateOptions = ADMIN_PRODUCTS_STOCK_STATE_OPTIONS;
  readonly bulkActions = ADMIN_PRODUCTS_BULK_ACTIONS;

  readonly tableRows = computed<readonly AdminTableRow[]>(() =>
    this.products().map((product) => toAdminProductTableRow(product))
  );

  // Form state
  readonly showForm = signal(false);
  readonly editingProduct = signal<AdminProduct | null>(null);
  readonly showDeleteConfirm = signal<AdminProduct | null>(null);

  constructor() {
    this.store.init();
    this.searchValue.set(this.query().search);

    this.searchInput$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.store.setSearch(value);
      });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.searchValue.set(value);
    this.searchInput$.next(value);
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.store.setCategoryId(target.value || null);
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;

    if (isAdminProductStatusFilter(value)) {
      this.store.setStatus(value);
    }
  }

  onStockStateChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;

    if (isAdminProductsStockStateFilter(value)) {
      this.store.setStockState(value);
    }
  }

  onSortChange(change: AdminTableSortChange): void {
    if (!isSortableProductsColumn(change.key)) {
      return;
    }

    this.store.updateSort(ADMIN_PRODUCTS_SORT_BY_COLUMN[change.key], change.direction);
  }

  onSelectionChange(ids: readonly string[]): void {
    this.store.setSelectedIds(ids);
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.store.setPageSize(pageSize);
  }

  onBulkAction(action: AdminProductsBulkAction): void {
    this.store.runBulkAction(action);
  }

  clearFilters(): void {
    this.searchValue.set('');
    this.store.resetFilters();
  }

  // CRUD actions
  openCreateForm(): void {
    this.editingProduct.set(null);
    this.showForm.set(true);
  }

  openEditForm(row: AdminTableRow): void {
    const product = this.products().find((p) => p._id === row['_id']);
    if (product) {
      this.editingProduct.set(product);
      this.showForm.set(true);
    }
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
  }

  onSaveProduct(payload: CreateProductPayload | UpdateProductPayload): void {
    const editing = this.editingProduct();
    if (editing) {
      this.store.updateProduct(editing._id, payload);
    } else {
      this.store.createProduct(payload as CreateProductPayload);
    }
    this.closeForm();
  }

  requestDelete(row: AdminTableRow): void {
    const product = this.products().find((p) => p._id === row['_id']);
    if (product) {
      this.showDeleteConfirm.set(product);
    }
  }

  confirmDelete(): void {
    const product = this.showDeleteConfirm();
    if (product) {
      this.store.deleteProduct(product._id);
      this.showDeleteConfirm.set(null);
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(null);
  }
}

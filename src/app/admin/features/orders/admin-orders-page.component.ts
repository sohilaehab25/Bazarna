import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  AdminSmartTableComponent,
  AdminTableRow,
  AdminTableSortChange,
} from '../../shared/components/admin-smart-table/admin-smart-table.component';
import { AdminTablePaginationComponent } from '../../shared/components/admin-table-pagination/admin-table-pagination.component';
import { AdminOrdersStore } from './data-access/admin-orders.store';
import {
  ADMIN_ORDERS_PAYMENT_OPTIONS,
  ADMIN_ORDERS_SORT_BY_COLUMN,
  ADMIN_ORDERS_STATUS_OPTIONS,
  ADMIN_ORDERS_TABLE_COLUMNS,
  isAdminOrderPaymentFilter,
  isAdminOrderStatusFilter,
  isSortableOrdersColumn,
  toAdminOrderTableRow,
} from './admin-orders.ui-config';

@Component({
  selector: 'app-admin-orders-page',
  imports: [CommonModule, AdminSmartTableComponent, AdminTablePaginationComponent],
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly store = inject(AdminOrdersStore);

  private readonly searchInput$ = new Subject<string>();
  private readonly minRevenueInput$ = new Subject<string>();
  private readonly maxRevenueInput$ = new Subject<string>();

  readonly query = this.store.query;
  readonly pagination = this.store.pagination;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly selectedIds = this.store.selectedIds;
  readonly selectedCount = this.store.selectedCount;
  readonly hasActiveFilters = this.store.hasActiveFilters;

  readonly columns = ADMIN_ORDERS_TABLE_COLUMNS;
  readonly statusOptions = ADMIN_ORDERS_STATUS_OPTIONS;
  readonly paymentOptions = ADMIN_ORDERS_PAYMENT_OPTIONS;
  readonly pageSizeOptions = [10, 20, 50, 100] as const;

  readonly searchValue = signal('');
  readonly minRevenueValue = signal('');
  readonly maxRevenueValue = signal('');

  readonly tableRows = computed<readonly AdminTableRow[]>(() =>
    this.store.orders().map((order) => toAdminOrderTableRow(order))
  );

  constructor() {
    this.store.init();
    this.searchValue.set(this.query().search);
    this.minRevenueValue.set(this.query().minRevenue);
    this.maxRevenueValue.set(this.query().maxRevenue);

    this.searchInput$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.store.setSearch(value));

    this.minRevenueInput$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.store.setMinRevenue(value));

    this.maxRevenueInput$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.store.setMaxRevenue(value));
  }

  onSearchInput(event: Event): void {
    const value = this.getInputValue(event);
    this.searchValue.set(value);
    this.searchInput$.next(value);
  }

  onStatusChange(event: Event): void {
    const value = this.getSelectValue(event);
    if (isAdminOrderStatusFilter(value)) {
      this.store.setStatus(value);
    }
  }

  onPaymentMethodChange(event: Event): void {
    const value = this.getSelectValue(event);
    if (isAdminOrderPaymentFilter(value)) {
      this.store.setPaymentMethod(value);
    }
  }

  onDateFromChange(event: Event): void {
    this.store.setDateFrom(this.getInputValue(event));
  }

  onDateToChange(event: Event): void {
    this.store.setDateTo(this.getInputValue(event));
  }

  onMinRevenueInput(event: Event): void {
    const value = this.getInputValue(event);
    this.minRevenueValue.set(value);
    this.minRevenueInput$.next(value);
  }

  onMaxRevenueInput(event: Event): void {
    const value = this.getInputValue(event);
    this.maxRevenueValue.set(value);
    this.maxRevenueInput$.next(value);
  }

  onSortChange(change: AdminTableSortChange): void {
    if (!isSortableOrdersColumn(change.key)) {
      return;
    }
    this.store.updateSort(ADMIN_ORDERS_SORT_BY_COLUMN[change.key], change.direction);
  }

  onSelectionChange(ids: readonly string[]): void {
    this.store.setSelectedIds(ids);
  }

  onRowClick(row: AdminTableRow): void {
    const id = row['_id'];
    if (typeof id === 'string' && id.length > 0) {
      this.router.navigate(['/admin/orders', id]);
    }
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.store.setPageSize(pageSize);
  }

  clearFilters(): void {
    this.searchValue.set('');
    this.minRevenueValue.set('');
    this.maxRevenueValue.set('');
    this.store.resetFilters();
  }

  private getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private getSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}

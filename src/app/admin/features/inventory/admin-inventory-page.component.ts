import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    computed,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    AdminSmartTableComponent,
    AdminTableRow,
    AdminTableSortChange,
} from '../../shared/components/admin-smart-table/admin-smart-table.component';
import { AdminTablePaginationComponent } from '../../shared/components/admin-table-pagination/admin-table-pagination.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AdminInventoryStore } from './data-access/admin-inventory.store';
import {
    ADMIN_INVENTORY_LOG_TYPE_OPTIONS,
    ADMIN_INVENTORY_SORT_BY_COLUMN,
    ADMIN_INVENTORY_STATUS_OPTIONS,
    ADMIN_INVENTORY_TABLE_COLUMNS,
    isInventoryStatusFilter,
    isSortableInventoryColumn,
    toAdminInventoryTableRow,
} from './admin-inventory.ui-config';
import {
    AdminInventorySortBy,
    AdminInventoryStatus,
} from './data-access/admin-inventory.contracts';

@Component({
    selector: 'app-admin-inventory-page',
    imports: [CommonModule, FormsModule, AdminSmartTableComponent, AdminTablePaginationComponent],
    templateUrl: './admin-inventory-page.component.html',
    styleUrl: './admin-inventory-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminInventoryPageComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly store = inject(AdminInventoryStore);
    private readonly searchInput$ = new Subject<string>();

    // Store selectors
    readonly query = this.store.query;
    readonly pagination = this.store.pagination;
    readonly inventory = this.store.inventory;
    readonly stats = this.store.stats;
    readonly lowStock = this.store.lowStock;
    readonly lowStockCount = this.store.lowStockCount;
    readonly activity = this.store.activity;
    readonly logs = this.store.logs;
    readonly logsPagination = this.store.logsPagination;

    readonly loading = this.store.loading;
    readonly statsLoading = this.store.statsLoading;
    readonly logsLoading = this.store.logsLoading;
    readonly mutationLoading = this.store.mutationLoading;
    readonly error = this.store.error;
    readonly mutationError = this.store.mutationError;
    readonly mutationSuccess = this.store.mutationSuccess;
    readonly hasActiveFilters = this.store.hasActiveFilters;

    // Local UI state
    readonly searchValue = signal('');
    readonly activeTab = signal<'overview' | 'logs'>('overview');

    // Restock modal state
    readonly showRestockModal = signal(false);
    readonly restockProductId = signal('');
    readonly restockProductName = signal('');
    readonly restockQuantity = signal(0);
    readonly restockReason = signal('');

    // Adjust modal state
    readonly showAdjustModal = signal(false);
    readonly adjustProductId = signal('');
    readonly adjustProductName = signal('');
    readonly adjustNewStock = signal(0);
    readonly adjustReason = signal('');

    // Config
    readonly columns = ADMIN_INVENTORY_TABLE_COLUMNS;
    readonly statusOptions = ADMIN_INVENTORY_STATUS_OPTIONS;
    readonly logTypeOptions = ADMIN_INVENTORY_LOG_TYPE_OPTIONS;

    // Table rows
    readonly tableRows = computed<readonly AdminTableRow[]>(() =>
        this.inventory().map((record) => toAdminInventoryTableRow(record))
    );

    constructor() {
        this.store.init();
        this.searchValue.set(this.query().search);

        this.searchInput$
            .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.store.setSearch(value);
            });
    }

    // -----------------------------------------------------------------------
    // Tab Management
    // -----------------------------------------------------------------------

    switchTab(tab: 'overview' | 'logs'): void {
        this.activeTab.set(tab);
        if (tab === 'logs') {
            this.store.loadLogs();
        }
    }

    // -----------------------------------------------------------------------
    // Filter handlers
    // -----------------------------------------------------------------------

    onSearchInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchValue.set(value);
        this.searchInput$.next(value);
    }

    onStatusChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        if (isInventoryStatusFilter(value)) {
            this.store.setStatus(value as AdminInventoryStatus | 'all');
        }
    }

    onResetFilters(): void {
        this.searchValue.set('');
        this.store.resetFilters();
    }

    onSortChange(sortChange: AdminTableSortChange): void {
        if (isSortableInventoryColumn(sortChange.key)) {
            const sortBy = ADMIN_INVENTORY_SORT_BY_COLUMN[sortChange.key] as AdminInventorySortBy;
            this.store.setSortBy(sortBy);
            this.store.setSortOrder(sortChange.direction);
        }
    }

    onPageChange(page: number): void {
        this.store.setPage(page);
    }

    onPageSizeChange(pageSize: number): void {
        this.store.setPageSize(pageSize);
    }

    // -----------------------------------------------------------------------
    // Restock
    // -----------------------------------------------------------------------

    openRestockModal(row: AdminTableRow): void {
        this.restockProductId.set(row['productId'] as string);
        this.restockProductName.set(row['productName'] as string);
        this.restockQuantity.set(0);
        this.restockReason.set('');
        this.showRestockModal.set(true);
    }

    closeRestockModal(): void {
        this.showRestockModal.set(false);
    }

    confirmRestock(): void {
        const quantity = this.restockQuantity();
        const reason = this.restockReason().trim();

        if (quantity <= 0 || !reason) {
            return;
        }

        this.store.restock({
            productId: this.restockProductId(),
            quantity,
            reason,
        });
        this.showRestockModal.set(false);
    }

    // -----------------------------------------------------------------------
    // Adjust
    // -----------------------------------------------------------------------

    openAdjustModal(row: AdminTableRow): void {
        this.adjustProductId.set(row['productId'] as string);
        this.adjustProductName.set(row['productName'] as string);
        this.adjustNewStock.set(row['availableStock'] as number);
        this.adjustReason.set('');
        this.showAdjustModal.set(true);
    }

    closeAdjustModal(): void {
        this.showAdjustModal.set(false);
    }

    confirmAdjust(): void {
        const newAvailableStock = this.adjustNewStock();
        const reason = this.adjustReason().trim();

        if (newAvailableStock < 0 || !reason) {
            return;
        }

        this.store.adjust({
            productId: this.adjustProductId(),
            newAvailableStock,
            reason,
        });
        this.showAdjustModal.set(false);
    }

    // -----------------------------------------------------------------------
    // Sync
    // -----------------------------------------------------------------------

    onSyncFromProducts(): void {
        this.store.syncFromProducts();
    }

    // -----------------------------------------------------------------------
    // Messages
    // -----------------------------------------------------------------------

    dismissSuccess(): void {
        this.store.dismissMutationSuccess();
    }

    dismissError(): void {
        this.store.dismissMutationError();
    }

    // -----------------------------------------------------------------------
    // Logs
    // -----------------------------------------------------------------------

    onLogTypeChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.store.loadLogs({ type: value });
    }

    onLogsPageChange(page: number): void {
        this.store.loadLogs({ page });
    }

    // -----------------------------------------------------------------------
    // Row click → restock action
    // -----------------------------------------------------------------------

    onRowClick(row: AdminTableRow): void {
        this.openRestockModal(row);
    }
}

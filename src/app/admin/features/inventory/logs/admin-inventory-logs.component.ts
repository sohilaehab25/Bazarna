import { ChangeDetectionStrategy, Component, inject, OnInit, computed } from '@angular/core';
import { AdminInventoryLogsStore } from './admin-inventory-logs.store';
import { AdminSmartTableComponent, AdminTableRow } from '../../../shared/components/admin-smart-table/admin-smart-table.component';
import { AdminTablePaginationComponent } from '../../../shared/components/admin-table-pagination/admin-table-pagination.component';
import { AdminWidgetShellComponent } from '../../../shared/components/admin-widget-shell/admin-widget-shell.component';
import { AdminLogTimelineComponent } from './components/admin-log-timeline.component';
import { AdminInventoryLogType, AdminInventoryLogReferenceType } from '../data-access/admin-inventory.contracts';
import {
    INVENTORY_LOGS_TABLE_COLUMNS,
    INVENTORY_LOG_TYPE_OPTIONS,
    INVENTORY_REF_TYPE_OPTIONS,
    groupLogsByDate,
    toLogTableRow,
} from './admin-inventory-logs.ui-config';

@Component({
    selector: 'app-admin-inventory-logs',
    imports: [
        AdminSmartTableComponent,
        AdminTablePaginationComponent,
        AdminWidgetShellComponent,
        AdminLogTimelineComponent,
    ],
    providers: [AdminInventoryLogsStore],
    templateUrl: './admin-inventory-logs.component.html',
    styleUrl: './admin-inventory-logs.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminInventoryLogsComponent implements OnInit {
    protected readonly store = inject(AdminInventoryLogsStore);

    // Config (static, no re-renders)
    protected readonly columns = INVENTORY_LOGS_TABLE_COLUMNS;
    protected readonly logTypeOptions = INVENTORY_LOG_TYPE_OPTIONS;
    protected readonly refTypeOptions = INVENTORY_REF_TYPE_OPTIONS;

    // Derived from store
    protected readonly tableRows = computed<readonly AdminTableRow[]>(() =>
        this.store.logs().map(toLogTableRow)
    );

    protected readonly timelineGroups = computed(() =>
        groupLogsByDate(this.store.logs())
    );

    ngOnInit(): void {
        this.store.load();
    }

    // Template event handlers
    protected onResetFilters(): void {
        this.store.resetFilters();
    }

    protected onPageChange(page: number): void {
        this.store.setPage(page);
    }

    protected onViewModeChange(mode: 'table' | 'timeline'): void {
        this.store.setViewMode(mode);
    }

    protected onTypeChange(value: string): void {
        this.store.setFilters({ type: value as AdminInventoryLogType | 'all' });
    }

    protected onRefTypeChange(value: string): void {
        this.store.setFilters({ referenceType: value as AdminInventoryLogReferenceType | 'all' });
    }

    protected onDateFromChange(value: string): void {
        this.store.setFilters({ dateFrom: value });
    }

    protected onDateToChange(value: string): void {
        this.store.setFilters({ dateTo: value });
    }

    protected onSearchSubmit(value: string): void {
        this.store.setFilters({ search: value });
    }
}

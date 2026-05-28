import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminMetricCardComponent } from '../../../shared/components/admin-metric-card/admin-metric-card.component';
import { AdminWidgetShellComponent } from '../../../shared/components/admin-widget-shell/admin-widget-shell.component';
import {
    AdminSmartTableComponent,
    AdminTableColumn,
    AdminTableRow,
} from '../../../shared/components/admin-smart-table/admin-smart-table.component';
import {
    AdminStockDistributionComponent,
    StockDistributionSegment,
} from '../../../shared/components/admin-stock-distribution/admin-stock-distribution.component';
import {
    AdminActivityBreakdownComponent,
} from '../../../shared/components/admin-activity-breakdown/admin-activity-breakdown.component';
import {
    AdminStockTimelineComponent,
} from '../../../shared/components/admin-stock-timeline/admin-stock-timeline.component';
import { AdminInventoryDashboardStore } from './admin-inventory-dashboard.store';

@Component({
    selector: 'app-admin-inventory-dashboard',
    imports: [
        CommonModule,
        AdminMetricCardComponent,
        AdminWidgetShellComponent,
        AdminSmartTableComponent,
        AdminStockDistributionComponent,
        AdminActivityBreakdownComponent,
        AdminStockTimelineComponent,
    ],
    templateUrl: './admin-inventory-dashboard.component.html',
    styleUrl: './admin-inventory-dashboard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [AdminInventoryDashboardStore],
})
export class AdminInventoryDashboardComponent {
    private readonly store = inject(AdminInventoryDashboardStore);

    // Selectors
    readonly stats = this.store.stats;
    readonly lowStock = this.store.lowStock;
    readonly topSelling = this.store.topSelling;
    readonly recentMovements = this.store.recentMovements;
    readonly activityBreakdown = this.store.activityBreakdown;
    readonly timelineChartData = this.store.timelineChartData;
    readonly stockHealthPercentage = this.store.stockHealthPercentage;
    readonly reservedPercentage = this.store.reservedPercentage;

    readonly loading = this.store.loading;
    readonly error = this.store.error;
    readonly days = this.store.days;

    readonly hasLowStock = this.store.hasLowStock;
    readonly hasTopSelling = this.store.hasTopSelling;
    readonly hasTimeline = this.store.hasTimeline;
    readonly hasRecentMovements = this.store.hasRecentMovements;

    // Period options
    readonly periodOptions = [
        { value: 7, label: '7 days' },
        { value: 14, label: '14 days' },
        { value: 30, label: '30 days' },
        { value: 90, label: '90 days' },
    ] as const;

    readonly selectedPeriod = signal(30);

    // Stock distribution segments
    readonly stockDistribution = computed<readonly StockDistributionSegment[]>(() => {
        const s = this.stats();
        return [
            { label: 'In Stock', value: s.inStockCount, color: '#10b981' },
            { label: 'Low Stock', value: s.lowStockCount, color: '#f59e0b' },
            { label: 'Out of Stock', value: s.outOfStockCount, color: '#ef4444' },
        ];
    });

    // Low stock table
    readonly lowStockColumns: readonly AdminTableColumn[] = [
        { key: 'product', header: 'Product' },
        { key: 'available', header: 'Available', type: 'number', align: 'right', width: '15%' },
        { key: 'threshold', header: 'Threshold', type: 'number', align: 'right', width: '15%' },
        {
            key: 'status',
            header: 'Severity',
            type: 'badge',
            align: 'center',
            width: '15%',
            formatter: (v) => (v === 'out-of-stock' ? 'Critical' : 'Warning'),
            badgeClassResolver: (v) => (v === 'out-of-stock' ? 'badge--danger' : 'badge--warning'),
        },
    ];

    readonly lowStockRows = computed<readonly AdminTableRow[]>(() =>
        this.lowStock().map((record) => ({
            _id: record._id,
            product: record.productId?.name ?? 'Unknown',
            available: record.availableStock,
            threshold: record.lowStockThreshold,
            status: record.status,
        }))
    );

    // Top selling table
    readonly topSellingColumns: readonly AdminTableColumn[] = [
        { key: 'product', header: 'Product' },
        { key: 'unitsSold', header: 'Units Sold', type: 'number', align: 'right', width: '18%' },
        { key: 'revenue', header: 'Revenue', type: 'currency', align: 'right', width: '18%' },
        { key: 'transactions', header: 'Orders', type: 'number', align: 'right', width: '14%' },
    ];

    readonly topSellingRows = computed<readonly AdminTableRow[]>(() =>
        this.topSelling().map((item) => ({
            _id: item._id,
            product: item.productName,
            unitsSold: item.totalSold,
            revenue: item.totalSold * item.productPrice,
            transactions: item.transactionCount,
        }))
    );

    // Recent movements table
    readonly recentMovementsColumns: readonly AdminTableColumn[] = [
        { key: 'date', header: 'Date', type: 'date', width: '16%' },
        { key: 'product', header: 'Product' },
        {
            key: 'type',
            header: 'Type',
            type: 'badge',
            width: '12%',
            formatter: (v) => String(v ?? ''),
            badgeClassResolver: resolveMovementBadge,
        },
        { key: 'quantity', header: 'Qty', type: 'number', align: 'right', width: '10%' },
        { key: 'result', header: 'Result', width: '14%' },
    ];

    readonly recentMovementsRows = computed<readonly AdminTableRow[]>(() =>
        this.recentMovements().map((log) => ({
            _id: log._id,
            date: log.createdAt,
            product: log.productId?.name ?? 'Unknown',
            type: log.type,
            quantity: log.quantity,
            result: `${log.previousAvailable} → ${log.newAvailable}`,
        }))
    );

    constructor() {
        this.store.load();
        this.store.connectRealtime();
    }

    onPeriodChange(event: Event): void {
        const value = Number((event.target as HTMLSelectElement).value);
        this.selectedPeriod.set(value);
        this.store.setDays(value);
    }

    onRefresh(): void {
        this.store.refresh();
    }

    formatNumber(value: number): string {
        return new Intl.NumberFormat('en-US').format(value);
    }
}

function resolveMovementBadge(value: unknown): string {
    switch (value) {
        case 'restock': return 'badge--success';
        case 'sale': return 'badge--info';
        case 'adjustment': return 'badge--neutral';
        case 'reservation': return 'badge--warning';
        case 'release': return 'badge--success';
        case 'return': return 'badge--danger';
        default: return 'badge--neutral';
    }
}

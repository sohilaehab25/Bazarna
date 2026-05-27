import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    AdminInventoryActivityEntry,
    AdminInventoryDashboardData,
    AdminInventoryLogEntry,
    AdminInventoryRecord,
    AdminInventoryStats,
    AdminInventoryTimelineDay,
    AdminInventoryTopSellingProduct,
} from '../data-access/admin-inventory.contracts';
import { AdminInventoryApiService } from '../data-access/admin-inventory-api.service';
import { AdminRealtimeService } from '../../../core/services/admin-realtime.service';

const DEFAULT_STATS: AdminInventoryStats = {
    totalProducts: 0,
    totalStock: 0,
    totalAvailable: 0,
    totalReserved: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    inStockCount: 0,
};

@Injectable()
export class AdminInventoryDashboardStore {
    private readonly api = inject(AdminInventoryApiService);
    private readonly realtime = inject(AdminRealtimeService);
    private readonly destroyRef = inject(DestroyRef);

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    private readonly statsState = signal<AdminInventoryStats>({ ...DEFAULT_STATS });
    private readonly lowStockState = signal<readonly AdminInventoryRecord[]>([]);
    private readonly activityState = signal<readonly AdminInventoryActivityEntry[]>([]);
    private readonly timelineState = signal<readonly AdminInventoryTimelineDay[]>([]);
    private readonly topSellingState = signal<readonly AdminInventoryTopSellingProduct[]>([]);
    private readonly recentMovementsState = signal<readonly AdminInventoryLogEntry[]>([]);

    private readonly loadingState = signal(false);
    private readonly errorState = signal<string | null>(null);

    private readonly daysState = signal(30);

    // -----------------------------------------------------------------------
    // Public selectors
    // -----------------------------------------------------------------------

    readonly stats = this.statsState.asReadonly();
    readonly lowStock = this.lowStockState.asReadonly();
    readonly activity = this.activityState.asReadonly();
    readonly timeline = this.timelineState.asReadonly();
    readonly topSelling = this.topSellingState.asReadonly();
    readonly recentMovements = this.recentMovementsState.asReadonly();

    readonly loading = this.loadingState.asReadonly();
    readonly error = this.errorState.asReadonly();
    readonly days = this.daysState.asReadonly();

    // Computed derived state
    readonly stockHealthPercentage = computed(() => {
        const s = this.statsState();
        if (s.totalProducts === 0) return 0;
        return Math.round((s.inStockCount / s.totalProducts) * 100);
    });

    readonly reservedPercentage = computed(() => {
        const s = this.statsState();
        if (s.totalStock === 0) return 0;
        return Math.round((s.totalReserved / s.totalStock) * 100);
    });

    readonly lowStockCount = computed(() => this.lowStockState().length);
    readonly outOfStockCount = computed(() => this.statsState().outOfStockCount);

    readonly hasLowStock = computed(() => this.lowStockState().length > 0);
    readonly hasTopSelling = computed(() => this.topSellingState().length > 0);
    readonly hasTimeline = computed(() => this.timelineState().length > 0);
    readonly hasRecentMovements = computed(() => this.recentMovementsState().length > 0);

    readonly timelineChartData = computed(() => {
        return this.timelineState().map((day) => {
            const restocked = day.movements.find((m) => m.type === 'restock')?.totalQuantity ?? 0;
            const sold = day.movements.find((m) => m.type === 'sale')?.totalQuantity ?? 0;
            const adjusted = day.movements.find((m) => m.type === 'adjustment')?.totalQuantity ?? 0;
            return {
                date: day._id,
                restocked,
                sold,
                adjusted,
                total: day.movements.reduce((sum, m) => sum + m.count, 0),
            };
        });
    });

    readonly activityBreakdown = computed(() => {
        const entries = this.activityState();
        const total = entries.reduce((sum, e) => sum + e.count, 0);
        return entries.map((entry) => ({
            type: entry._id,
            count: entry.count,
            quantity: entry.totalQuantity,
            percentage: total > 0 ? Math.round((entry.count / total) * 100) : 0,
        }));
    });

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------

    load(): void {
        this.loadingState.set(true);
        this.errorState.set(null);

        this.api.getDashboardAnalytics('default', this.daysState()).subscribe({
            next: (data: AdminInventoryDashboardData) => {
                this.statsState.set(data.stats);
                this.lowStockState.set(data.lowStock);
                this.activityState.set(data.activity);
                this.timelineState.set(data.timeline);
                this.topSellingState.set(data.topSelling);
                this.recentMovementsState.set(data.recentMovements);
                this.loadingState.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.errorState.set(err.error?.message ?? 'Failed to load inventory dashboard');
                this.loadingState.set(false);
            },
        });
    }

    setDays(days: number): void {
        this.daysState.set(days);
        this.load();
    }

    refresh(): void {
        this.load();
    }

    connectRealtime(): void {
        this.realtime
            .onEvent('inventory-updated')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                // Refresh stats on any inventory change
                this.api.getStats().subscribe({
                    next: (stats) => this.statsState.set(stats),
                });
            });

        this.realtime
            .onEvent('low-stock-alert')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.api.getLowStockAlerts().subscribe({
                    next: (items) => this.lowStockState.set(items),
                });
            });
    }
}

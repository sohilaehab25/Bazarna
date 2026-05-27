import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AdminMetricCardComponent } from '../../shared/components/admin-metric-card/admin-metric-card.component';
import {
  AdminSmartTableComponent,
  AdminTableCellValue,
  AdminTableColumn,
  AdminTableRow,
} from '../../shared/components/admin-smart-table/admin-smart-table.component';
import { AdminRevenueChartComponent } from '../../shared/components/admin-revenue-chart/admin-revenue-chart.component';
import { AdminWidgetShellComponent } from '../../shared/components/admin-widget-shell/admin-widget-shell.component';
import { AdminDashboardStore } from './data-access/admin-dashboard.store';

function formatOrderStatus(value: AdminTableCellValue): string {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';

  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'preparing':
      return 'Preparing';
    case 'delivered':
      return 'Delivered';
    default:
      return 'Unknown';
  }
}

function resolveOrderStatusBadgeClass(value: AdminTableCellValue): string {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';

  if (normalized === 'pending') {
    return 'admin-smart-table__badge--low';
  }

  if (normalized === 'preparing') {
    return 'admin-smart-table__badge--active';
  }

  if (normalized === 'delivered') {
    return 'admin-smart-table__badge--in';
  }

  return 'admin-smart-table__badge--neutral';
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    CommonModule,
    AdminMetricCardComponent,
    AdminWidgetShellComponent,
    AdminSmartTableComponent,
    AdminRevenueChartComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private readonly store = inject(AdminDashboardStore);

  readonly kpis = this.store.kpis;
  readonly latestOrders = this.store.latestOrders;
  readonly lowStockAlerts = this.store.lowStockAlerts;
  readonly revenueSeries = this.store.revenueSeries;
  readonly topSellingProducts = this.store.topSellingProducts;

  readonly latestOrderRows = computed<readonly AdminTableRow[]>(() =>
    this.latestOrders().map((row) => ({
      ...row,
    }))
  );

  readonly lowStockRows = computed<readonly AdminTableRow[]>(() =>
    this.lowStockAlerts().map((row) => ({
      ...row,
    }))
  );

  readonly topSellingRows = computed<readonly AdminTableRow[]>(() =>
    this.topSellingProducts().map((row) => ({
      ...row,
    }))
  );

  readonly ordersLoading = this.store.ordersLoading;
  readonly productsLoading = this.store.productsLoading;
  readonly usersLoading = this.store.usersLoading;

  readonly ordersError = this.store.ordersError;
  readonly productsError = this.store.productsError;
  readonly usersError = this.store.usersError;
  readonly chartError = this.store.chartError;
  readonly topSellingError = this.store.topSellingError;

  readonly latestOrdersEmpty = computed(() => this.latestOrders().length === 0);
  readonly lowStockEmpty = computed(() => this.lowStockAlerts().length === 0);
  readonly topSellingEmpty = computed(() => this.topSellingProducts().length === 0);
  readonly revenueEmpty = computed(
    () => this.revenueSeries().length === 0 || this.revenueSeries().every((point) => point.value === 0)
  );

  readonly latestOrdersColumns: readonly AdminTableColumn[] = [
    { key: 'orderId', header: 'Order ID', width: '25%' },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      formatter: formatOrderStatus,
      badgeClassResolver: resolveOrderStatusBadgeClass,
    },
    { key: 'paymentMethod', header: 'Payment' },
    { key: 'totalPrice', header: 'Total', type: 'currency' },
    { key: 'createdAt', header: 'Created', type: 'date' },
  ];

  readonly lowStockColumns: readonly AdminTableColumn[] = [
    { key: 'product', header: 'Product' },
    { key: 'category', header: 'Category' },
    { key: 'stock', header: 'Stock', type: 'number' },
  ];

  readonly topSellingColumns: readonly AdminTableColumn[] = [
    { key: 'product', header: 'Product' },
    { key: 'soldUnits', header: 'Units Sold', type: 'number' },
    { key: 'revenue', header: 'Revenue', type: 'currency' },
  ];

  constructor() {
    this.store.load();
    this.store.connectRealtime();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
}

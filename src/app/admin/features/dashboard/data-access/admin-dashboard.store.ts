import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { Order, Product } from '../../../../../app.type';
import { AdminRealtimeService } from '../../../core/services/admin-realtime.service';
import {
  DashboardKpis,
  DashboardLatestOrderRow,
  DashboardLowStockRow,
  DashboardRequestState,
  DashboardRevenuePoint,
  DashboardTopSellingRow,
  DashboardUser,
} from './admin-dashboard.contracts';
import { AdminDashboardApiService } from './admin-dashboard-api.service';

function createRequestState<T>(initialData: T): DashboardRequestState<T> {
  return {
    data: initialData,
    loading: false,
    error: null,
    loaded: false,
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardStore {
  private readonly api = inject(AdminDashboardApiService);
  private readonly realtime = inject(AdminRealtimeService);

  private readonly initialized = signal(false);
  private readonly realtimeConnected = signal(false);
  private readonly ordersState = signal<DashboardRequestState<readonly Order[]>>(
    createRequestState<readonly Order[]>([])
  );
  private readonly productsState = signal<DashboardRequestState<readonly Product[]>>(
    createRequestState<readonly Product[]>([])
  );
  private readonly usersState = signal<DashboardRequestState<readonly DashboardUser[]>>(
    createRequestState<readonly DashboardUser[]>([])
  );

  readonly orders = computed(() => this.ordersState().data);
  readonly products = computed(() => this.productsState().data);
  readonly users = computed(() => this.usersState().data);

  readonly ordersLoading = computed(() => this.ordersState().loading);
  readonly productsLoading = computed(() => this.productsState().loading);
  readonly usersLoading = computed(() => this.usersState().loading);

  readonly ordersError = computed(() => this.ordersState().error);
  readonly productsError = computed(() => this.productsState().error);
  readonly usersError = computed(() => this.usersState().error);

  readonly chartError = computed(() => this.ordersError());
  readonly topSellingError = computed(() => this.ordersError() ?? this.productsError());

  readonly anyLoading = computed(
    () => this.ordersLoading() || this.productsLoading() || this.usersLoading()
  );

  readonly kpis = computed<DashboardKpis>(() => {
    const orders = this.orders();
    const products = this.products();
    const users = this.users();

    return {
      totalRevenue: orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
      totalOrders: orders.length,
      totalUsers: users.length,
      totalProducts: products.length,
      pendingOrders: orders.filter((order) => order.status === 'pending').length,
    };
  });

  readonly latestOrders = computed<readonly DashboardLatestOrderRow[]>(() => {
    return [...this.orders()]
      .sort((first, second) => this.asTimestamp(second.createdAt) - this.asTimestamp(first.createdAt))
      .slice(0, 6)
      .map((order) => ({
        orderId: order._id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalPrice: Number(order.totalPrice),
        createdAt: String(order.createdAt),
      }));
  });

  readonly lowStockAlerts = computed<readonly DashboardLowStockRow[]>(() => {
    return this.products()
      .filter((product) => Number(product.stock) <= 5)
      .sort((first, second) => Number(first.stock) - Number(second.stock))
      .slice(0, 6)
      .map((product) => ({
        product: product.name,
        category: product.categoryId?.name ?? 'Uncategorized',
        stock: Number(product.stock),
      }));
  });

  readonly revenueSeries = computed<readonly DashboardRevenuePoint[]>(() => {
    const buckets = new Map<string, number>();

    for (let dayOffset = 6; dayOffset >= 0; dayOffset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      const key = this.dayKey(date);
      buckets.set(key, 0);
    }

    for (const order of this.orders()) {
      const key = this.dayKey(new Date(order.createdAt));
      if (!buckets.has(key)) {
        continue;
      }

      buckets.set(key, Number(buckets.get(key)) + Number(order.totalPrice || 0));
    }

    return [...buckets.entries()].map(([key, value]) => ({
      label: this.shortDayLabel(key),
      value,
    }));
  });

  readonly topSellingProducts = computed<readonly DashboardTopSellingRow[]>(() => {
    const productCatalog = new Map<string, Product>(
      this.products().map((product) => [product._id, product])
    );
    const totals = new Map<string, { soldUnits: number; revenue: number }>();

    for (const order of this.orders()) {
      for (const item of order.items) {
        const productId = this.resolveProductId(item.productId);
        if (!productId) {
          continue;
        }

        const quantity = Number(item.quantity || 0);
        const product = productCatalog.get(productId);
        const revenue = quantity * Number(product?.price ?? 0);

        const current = totals.get(productId) ?? { soldUnits: 0, revenue: 0 };
        totals.set(productId, {
          soldUnits: current.soldUnits + quantity,
          revenue: current.revenue + revenue,
        });
      }
    }

    return [...totals.entries()]
      .map(([productId, totalsByProduct]) => ({
        product: productCatalog.get(productId)?.name ?? `Product ${productId.slice(-4)}`,
        soldUnits: totalsByProduct.soldUnits,
        revenue: totalsByProduct.revenue,
      }))
      .sort((first, second) => second.soldUnits - first.soldUnits)
      .slice(0, 6);
  });

  load(force = false): void {
    if (this.initialized() && !force) {
      return;
    }

    this.initialized.set(true);
    this.loadOrders();
    this.loadProducts();
    this.loadUsers();
  }

  connectRealtime(): void {
    if (this.realtimeConnected()) {
      return;
    }

    this.realtimeConnected.set(true);
    this.realtime.onEvent('product-stock-updated').subscribe(() => {
      this.loadProducts(true);
    });
  }

  private loadOrders(force = false): void {
    if (this.ordersState().loading && !force) {
      return;
    }

    this.patchState(this.ordersState, {
      loading: true,
      error: null,
    });

    this.api.getOrders().subscribe({
      next: (orders) => {
        this.ordersState.set({
          data: orders,
          loading: false,
          error: null,
          loaded: true,
        });
      },
      error: (error: unknown) => {
        this.patchState(this.ordersState, {
          loading: false,
          loaded: true,
          error: this.resolveError(error, 'Unable to load orders.'),
          data: [],
        });
      },
    });
  }

  private loadProducts(force = false): void {
    if (this.productsState().loading && !force) {
      return;
    }

    this.patchState(this.productsState, {
      loading: true,
      error: null,
    });

    this.api.getProducts().subscribe({
      next: (products) => {
        this.productsState.set({
          data: products,
          loading: false,
          error: null,
          loaded: true,
        });
      },
      error: (error: unknown) => {
        this.patchState(this.productsState, {
          loading: false,
          loaded: true,
          error: this.resolveError(error, 'Unable to load products.'),
          data: [],
        });
      },
    });
  }

  private loadUsers(force = false): void {
    if (this.usersState().loading && !force) {
      return;
    }

    this.patchState(this.usersState, {
      loading: true,
      error: null,
    });

    this.api.getUsers().subscribe({
      next: (users) => {
        this.usersState.set({
          data: users,
          loading: false,
          error: null,
          loaded: true,
        });
      },
      error: (error: unknown) => {
        this.patchState(this.usersState, {
          loading: false,
          loaded: true,
          error: this.resolveError(error, 'Unable to load users.'),
          data: [],
        });
      },
    });
  }

  private patchState<T>(
    stateSignal: WritableSignal<DashboardRequestState<T>>,
    patch: Partial<DashboardRequestState<T>>
  ): void {
    stateSignal.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  private resolveError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }

      return error.message || fallback;
    }

    return fallback;
  }

  private resolveProductId(productRef: unknown): string | null {
    if (typeof productRef === 'string') {
      return productRef;
    }

    if (typeof productRef === 'object' && productRef !== null) {
      const candidate = productRef as { _id?: unknown; id?: unknown };
      if (typeof candidate._id === 'string') {
        return candidate._id;
      }

      if (typeof candidate.id === 'string') {
        return candidate.id;
      }
    }

    return null;
  }

  private asTimestamp(value: string | Date): number {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  private dayKey(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private shortDayLabel(dayKey: string): string {
    const date = new Date(dayKey);
    if (Number.isNaN(date.getTime())) {
      return dayKey;
    }

    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
}

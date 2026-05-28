import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminOrderDetailStore } from './data-access/admin-order-detail.store';
import { AdminOrderInfoCardComponent, AdminOrderInfoField } from './components/admin-order-info-card/admin-order-info-card.component';
import { AdminOrderItemsComponent } from './components/admin-order-items/admin-order-items.component';
import { AdminOrderTimelineComponent } from './components/admin-order-timeline/admin-order-timeline.component';
import { AdminOrderNotesComponent } from './components/admin-order-notes/admin-order-notes.component';
import { AdminOrderActionsComponent, AdminOrderTransitionRequest } from './components/admin-order-actions/admin-order-actions.component';
import { AdminOrderDetail } from './data-access/admin-order-detail.contracts';
import { AdminOrderUserRef, AdminOrderCustomer } from '../data-access/admin-orders.contracts';

@Component({
  selector: 'app-admin-order-detail-page',
  imports: [
    AdminOrderInfoCardComponent,
    AdminOrderItemsComponent,
    AdminOrderTimelineComponent,
    AdminOrderNotesComponent,
    AdminOrderActionsComponent,
  ],
  providers: [AdminOrderDetailStore],
  templateUrl: './admin-order-detail-page.component.html',
  styleUrl: './admin-order-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(AdminOrderDetailStore);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.loadDetail(id);
    }
  }

  readonly detail = this.store.detail;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly timeline = this.store.timeline;
  readonly notes = this.store.notes;
  readonly availableTransitions = this.store.availableTransitions;
  readonly isTerminal = this.store.isTerminal;
  readonly actionLoading = this.store.actionLoading;
  readonly actionError = this.store.actionError;
  readonly noteSubmitting = this.store.noteSubmitting;
  readonly noteError = this.store.noteError;

  readonly shortId = computed(() => {
    const order = this.detail();
    if (!order) return '';
    return order.orderNumber ? `#${order.orderNumber}` : '#' + order._id.slice(-8).toUpperCase();
  });

  readonly customerFields = computed((): readonly AdminOrderInfoField[] => {
    const order = this.detail();
    if (!order) return [];
    return buildCustomerFields(order);
  });

  readonly paymentFields = computed((): readonly AdminOrderInfoField[] => {
    const order = this.detail();
    if (!order) return [];
    return [
      { label: 'Method', value: order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Visa' },
      { label: 'Total', value: formatCurrency(order.totalPrice) },
      { label: 'Items', value: String(order.items.length) },
    ];
  });

  readonly orderMetaFields = computed((): readonly AdminOrderInfoField[] => {
    const order = this.detail();
    if (!order) return [];
    return [
      { label: 'Order #', value: order.orderNumber ? String(order.orderNumber) : order._id, mono: true },
      { label: 'Placed', value: formatDatetime(order.createdAt) },
      { label: 'Updated', value: formatDatetime(order.updatedAt) },
    ];
  });

  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }

  onAddNote(body: string): void {
    this.store.addNote(body);
  }

  onTransitionRequest(request: AdminOrderTransitionRequest): void {
    this.store.transitionTo(request.toStatus, request.reason);
  }
}

// ---------------------------------------------------------------------------
// Pure helpers (no class pollution)
// ---------------------------------------------------------------------------

function buildCustomerFields(order: AdminOrderDetail): AdminOrderInfoField[] {
  const customer = order.customer as AdminOrderCustomer | undefined;
  const user = typeof order.userId === 'object' && order.userId !== null
    ? order.userId as AdminOrderUserRef
    : null;

  if (customer) {
    return [
      { label: 'Name', value: `${customer.firstName} ${customer.lastName}`.trim() },
      { label: 'Email', value: customer.email },
      { label: 'Address', value: customer.address },
      { label: 'City', value: customer.city },
      { label: 'Type', value: 'Guest' },
    ];
  }

  if (user) {
    return [
      { label: 'Name', value: user.name },
      { label: 'Email', value: user.email },
      { label: 'Type', value: 'Registered' },
    ];
  }

  return [{ label: 'Customer', value: 'Unknown' }];
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatDatetime(timestamp: string): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
}

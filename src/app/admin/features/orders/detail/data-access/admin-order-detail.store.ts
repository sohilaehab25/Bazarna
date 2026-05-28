import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AdminOrderDetail,
  AdminOrderDetailNote,
  AdminOrderTimelineEvent,
} from './admin-order-detail.contracts';
import { AdminOrderStatus } from '../../data-access/admin-orders.contracts';
import { AdminOrderDetailApiService } from './admin-order-detail-api.service';
import {
  AdminTransitionConfig,
  ADMIN_STATUS_CONFIG,
  getAvailableTransitions,
  isTerminalStatus,
} from '../utils/order-workflow.utils';

// ---------------------------------------------------------------------------
// Timeline builder — uses real statusHistory audit trail + notes
// ---------------------------------------------------------------------------

function buildTimeline(order: AdminOrderDetail): AdminOrderTimelineEvent[] {
  const events: AdminOrderTimelineEvent[] = [];

  events.push({
    id:          'created',
    type:        'created',
    label:       'Order placed',
    description: `Payment method: ${order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Visa'}`,
    timestamp:   order.createdAt,
  });

  for (const entry of order.statusHistory ?? []) {
    const label = ADMIN_STATUS_CONFIG[entry.toStatus]?.label ?? entry.toStatus;
    const desc  = entry.reason
      ? `${entry.performedBy} — ${entry.reason}`
      : `By ${entry.performedBy}`;

    events.push({
      id:          entry._id,
      type:        'status_change',
      label:       `Status: ${label}`,
      description: desc,
      timestamp:   entry.timestamp,
      statusValue: entry.toStatus,
    });
  }

  for (const note of order.notes ?? []) {
    events.push({
      id:          note._id,
      type:        'note',
      label:       `Note by ${note.author}`,
      description: note.body,
      timestamp:   note.createdAt,
    });
  }

  return events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

function resolveError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return (error.error as { message?: string } | null)?.message
      ?? error.message
      ?? 'An error occurred.';
  }
  if (error instanceof Error) return error.message;
  return 'An error occurred.';
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

@Injectable()
export class AdminOrderDetailStore {
  private readonly api = inject(AdminOrderDetailApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly detailState       = signal<AdminOrderDetail | null>(null);
  private readonly loadingState      = signal(false);
  private readonly errorState        = signal<string | null>(null);

  private readonly actionLoadingState = signal(false);
  private readonly actionErrorState   = signal<string | null>(null);

  private readonly noteSubmittingState = signal(false);
  private readonly noteErrorState      = signal<string | null>(null);

  readonly detail         = this.detailState.asReadonly();
  readonly loading        = this.loadingState.asReadonly();
  readonly error          = this.errorState.asReadonly();
  readonly actionLoading  = this.actionLoadingState.asReadonly();
  readonly actionError    = this.actionErrorState.asReadonly();
  readonly noteSubmitting = this.noteSubmittingState.asReadonly();
  readonly noteError      = this.noteErrorState.asReadonly();

  readonly availableTransitions = computed((): readonly AdminTransitionConfig[] => {
    const status = this.detailState()?.status;
    if (!status) return [];
    return getAvailableTransitions(status);
  });

  readonly isTerminal = computed((): boolean => {
    const status = this.detailState()?.status;
    return status ? isTerminalStatus(status) : false;
  });

  readonly notes = computed((): AdminOrderDetailNote[] => this.detailState()?.notes ?? []);

  readonly timeline = computed((): AdminOrderTimelineEvent[] => {
    const order = this.detailState();
    if (!order) return [];
    return buildTimeline(order);
  });

  loadDetail(id: string): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.detailState.set(null);

    this.api.getDetail(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:  (detail)         => { this.detailState.set(detail); this.loadingState.set(false); },
      error: (error: unknown) => { this.loadingState.set(false); this.errorState.set(resolveError(error)); },
    });
  }

  transitionTo(toStatus: AdminOrderStatus, reason?: string): void {
    const order = this.detailState();
    if (!order || this.actionLoadingState()) return;

    this.actionLoadingState.set(true);
    this.actionErrorState.set(null);

    this.api.updateStatus(order._id, toStatus, reason).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:  (updated)        => { this.detailState.set(updated); this.actionLoadingState.set(false); },
      error: (error: unknown) => { this.actionLoadingState.set(false); this.actionErrorState.set(resolveError(error)); },
    });
  }

  addNote(body: string): void {
    const order = this.detailState();
    if (!order || !body.trim()) return;

    this.noteSubmittingState.set(true);
    this.noteErrorState.set(null);

    this.api.addNote(order._id, body.trim()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:  (updated)        => { this.detailState.set(updated); this.noteSubmittingState.set(false); },
      error: (error: unknown) => { this.noteSubmittingState.set(false); this.noteErrorState.set(resolveError(error)); },
    });
  }
}
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { AdminOrderStatus } from '../../../data-access/admin-orders.contracts';
import {
  AdminTransitionConfig,
  ADMIN_STATUS_CONFIG,
} from '../../utils/order-workflow.utils';

export interface AdminOrderTransitionRequest {
  toStatus: AdminOrderStatus;
  reason?: string;
}

@Component({
  selector: 'app-admin-order-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'admin-order-actions' },
  templateUrl: './admin-order-actions.component.html',
  styleUrl: './admin-order-actions.component.scss',
})
export class AdminOrderActionsComponent {
  readonly currentStatus       = input.required<AdminOrderStatus>();
  readonly availableTransitions = input.required<readonly AdminTransitionConfig[]>();
  readonly isTerminal          = input(false);
  readonly loading             = input(false);
  readonly error               = input<string | null>(null);

  readonly transitionRequest = output<AdminOrderTransitionRequest>();

  /** Derived display data — computed once per status change, not per CD cycle */
  readonly statusLabel = computed(() => ADMIN_STATUS_CONFIG[this.currentStatus()]?.label ?? this.currentStatus());
  readonly statusDescription = computed(() => ADMIN_STATUS_CONFIG[this.currentStatus()]?.description ?? '');
  readonly statusModifier = computed(() => ADMIN_STATUS_CONFIG[this.currentStatus()]?.badgeModifier ?? 'neutral');

  /** Transition currently pending confirmation */
  readonly confirmingTransition = signal<AdminTransitionConfig | null>(null);
  /** Reason text for destructive transitions */
  readonly reasonValue = signal('');

  onActionClick(transition: AdminTransitionConfig): void {
    if (transition.isDestructive) {
      this.confirmingTransition.set(transition);
      this.reasonValue.set('');
    } else {
      this.transitionRequest.emit({ toStatus: transition.toStatus });
    }
  }

  onConfirm(): void {
    const t = this.confirmingTransition();
    if (!t) return;
    const reason = this.reasonValue().trim() || undefined;
    this.confirmingTransition.set(null);
    this.reasonValue.set('');
    this.transitionRequest.emit({ toStatus: t.toStatus, reason });
  }

  onCancelConfirm(): void {
    this.confirmingTransition.set(null);
    this.reasonValue.set('');
  }

  onReasonInput(event: Event): void {
    this.reasonValue.set((event.target as HTMLTextAreaElement).value);
  }
}
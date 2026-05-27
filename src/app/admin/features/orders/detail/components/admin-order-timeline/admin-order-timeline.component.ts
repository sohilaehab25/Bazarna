import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AdminOrderTimelineEvent } from '../../data-access/admin-order-detail.contracts';

@Component({
  selector: 'app-admin-order-timeline',
  templateUrl: './admin-order-timeline.component.html',
  styleUrl: './admin-order-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrderTimelineComponent {
  readonly events = input.required<readonly AdminOrderTimelineEvent[]>();

  private readonly dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '—';
    return this.dateTimeFormatter.format(date);
  }
}

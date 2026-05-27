import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AdminMetricTone = 'neutral' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-admin-metric-card',
  imports: [CommonModule],
  templateUrl: './admin-metric-card.component.html',
  styleUrl: './admin-metric-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input<string>('');
  readonly tone = input<AdminMetricTone>('neutral');
  readonly loading = input(false);
  readonly error = input<string | null>(null);
}

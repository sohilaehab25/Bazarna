import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface AdminRevenuePoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin-revenue-chart',
  imports: [CommonModule],
  templateUrl: './admin-revenue-chart.component.html',
  styleUrl: './admin-revenue-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRevenueChartComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly points = input<readonly AdminRevenuePoint[]>([]);
  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly maxValue = computed(() => {
    const values = this.points().map((point) => point.value);
    return values.length > 0 ? Math.max(...values, 1) : 1;
  });

  getBarHeight(value: number): string {
    return `${Math.max((value / this.maxValue()) * 100, 6)}%`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StockDistributionSegment {
    label: string;
    value: number;
    color: string;
}

@Component({
    selector: 'app-admin-stock-distribution',
    imports: [CommonModule],
    template: `
        <div class="stock-distribution" role="img" [attr.aria-label]="ariaLabel()">
            <div class="stock-distribution__bar">
                @for (segment of segments(); track segment.label) {
                    @if (segment.value > 0) {
                        <div
                            class="stock-distribution__segment"
                            [style.width.%]="getPercentage(segment)"
                            [style.background-color]="segment.color"
                            [attr.aria-label]="segment.label + ': ' + segment.value"
                        ></div>
                    }
                }
            </div>
            <div class="stock-distribution__legend">
                @for (segment of segments(); track segment.label) {
                    <div class="stock-distribution__legend-item">
                        <span class="stock-distribution__dot" [style.background-color]="segment.color"></span>
                        <span class="stock-distribution__legend-label">{{ segment.label }}</span>
                        <span class="stock-distribution__legend-value">{{ segment.value }}</span>
                    </div>
                }
            </div>
        </div>
    `,
    styles: `
        .stock-distribution {
            &__bar {
                display: flex;
                height: 12px;
                border-radius: 6px;
                overflow: hidden;
                background: var(--admin-bg-subtle, #f3f4f6);
                margin-bottom: 0.75rem;
            }

            &__segment {
                transition: width 0.3s ease;
                min-width: 2px;
            }

            &__legend {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
            }

            &__legend-item {
                display: flex;
                align-items: center;
                gap: 0.375rem;
                font-size: 0.75rem;
            }

            &__dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                flex-shrink: 0;
            }

            &__legend-label {
                color: var(--admin-text-secondary, #6b7280);
            }

            &__legend-value {
                font-weight: 600;
                color: var(--admin-text-primary, #1a1a2e);
            }
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStockDistributionComponent {
    readonly segments = input.required<readonly StockDistributionSegment[]>();
    readonly ariaLabel = input('Stock distribution breakdown');

    getPercentage(segment: StockDistributionSegment): number {
        const total = this.segments().reduce((sum, s) => sum + s.value, 0);
        if (total === 0) return 0;
        return (segment.value / total) * 100;
    }
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TimelineBarEntry {
    date: string;
    restocked: number;
    sold: number;
    adjusted: number;
    total: number;
}

@Component({
    selector: 'app-admin-stock-timeline',
    imports: [CommonModule],
    template: `
        <div class="stock-timeline" role="img" [attr.aria-label]="ariaLabel()">
            @if (data().length === 0) {
                <p class="stock-timeline__empty">No movement data for this period.</p>
            } @else {
                <div class="stock-timeline__chart">
                    @for (entry of data(); track entry.date) {
                        <div class="stock-timeline__column" [attr.aria-label]="entry.date + ': ' + entry.total + ' operations'">
                            <div class="stock-timeline__bars">
                                @if (entry.restocked > 0) {
                                    <div
                                        class="stock-timeline__bar stock-timeline__bar--restock"
                                        [style.height.%]="getBarHeight(entry.restocked)"
                                        [attr.aria-label]="'Restocked: ' + entry.restocked"
                                    ></div>
                                }
                                @if (entry.sold > 0) {
                                    <div
                                        class="stock-timeline__bar stock-timeline__bar--sold"
                                        [style.height.%]="getBarHeight(entry.sold)"
                                        [attr.aria-label]="'Sold: ' + entry.sold"
                                    ></div>
                                }
                                @if (entry.adjusted > 0) {
                                    <div
                                        class="stock-timeline__bar stock-timeline__bar--adjusted"
                                        [style.height.%]="getBarHeight(entry.adjusted)"
                                        [attr.aria-label]="'Adjusted: ' + entry.adjusted"
                                    ></div>
                                }
                            </div>
                            <span class="stock-timeline__date">{{ formatDate(entry.date) }}</span>
                        </div>
                    }
                </div>
                <div class="stock-timeline__legend">
                    <span class="stock-timeline__legend-item">
                        <span class="stock-timeline__legend-dot stock-timeline__legend-dot--restock"></span>
                        Restocked
                    </span>
                    <span class="stock-timeline__legend-item">
                        <span class="stock-timeline__legend-dot stock-timeline__legend-dot--sold"></span>
                        Sold
                    </span>
                    <span class="stock-timeline__legend-item">
                        <span class="stock-timeline__legend-dot stock-timeline__legend-dot--adjusted"></span>
                        Adjusted
                    </span>
                </div>
            }
        </div>
    `,
    styles: `
        .stock-timeline {
            &__empty {
                text-align: center;
                color: var(--admin-text-secondary, #6b7280);
                font-size: 0.8125rem;
                padding: 2rem 0;
            }

            &__chart {
                display: flex;
                align-items: flex-end;
                gap: 2px;
                height: 120px;
                padding-bottom: 1.5rem;
                overflow-x: auto;
            }

            &__column {
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 1;
                min-width: 16px;
                height: 100%;
                position: relative;
            }

            &__bars {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                width: 100%;
                height: 100%;
                gap: 1px;
            }

            &__bar {
                width: 80%;
                max-width: 20px;
                border-radius: 2px 2px 0 0;
                min-height: 2px;
                transition: height 0.3s ease;

                &--restock { background: #10b981; }
                &--sold { background: #3b82f6; }
                &--adjusted { background: #8b5cf6; }
            }

            &__date {
                position: absolute;
                bottom: 0;
                font-size: 0.5625rem;
                color: var(--admin-text-secondary, #6b7280);
                white-space: nowrap;
                transform: rotate(-45deg);
                transform-origin: top left;
            }

            &__legend {
                display: flex;
                gap: 1rem;
                margin-top: 0.75rem;
                justify-content: center;
            }

            &__legend-item {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.6875rem;
                color: var(--admin-text-secondary, #6b7280);
            }

            &__legend-dot {
                width: 8px;
                height: 8px;
                border-radius: 2px;

                &--restock { background: #10b981; }
                &--sold { background: #3b82f6; }
                &--adjusted { background: #8b5cf6; }
            }
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStockTimelineComponent {
    readonly data = input.required<readonly TimelineBarEntry[]>();
    readonly ariaLabel = input('Stock movement timeline');

    private maxQuantity = 0;

    getBarHeight(value: number): number {
        if (this.maxQuantity === 0) {
            this.maxQuantity = Math.max(
                ...this.data().map((d) => Math.max(d.restocked, d.sold, d.adjusted)),
                1
            );
        }
        return Math.max((value / this.maxQuantity) * 100, 5);
    }

    formatDate(dateStr: string): string {
        const parts = dateStr.split('-');
        return `${parts[1]}/${parts[2]}`;
    }
}

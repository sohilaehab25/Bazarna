import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActivityBreakdownEntry {
    type: string;
    count: number;
    quantity: number;
    percentage: number;
}

@Component({
    selector: 'app-admin-activity-breakdown',
    imports: [CommonModule],
    template: `
        <div class="activity-breakdown" role="list" [attr.aria-label]="ariaLabel()">
            @for (entry of entries(); track entry.type) {
                <div class="activity-breakdown__row" role="listitem">
                    <div class="activity-breakdown__info">
                        <span class="activity-breakdown__type" [attr.data-type]="entry.type">
                            {{ formatType(entry.type) }}
                        </span>
                        <span class="activity-breakdown__count">{{ entry.count }} operations</span>
                    </div>
                    <div class="activity-breakdown__bar-wrap">
                        <div
                            class="activity-breakdown__bar"
                            [style.width.%]="entry.percentage"
                            [attr.data-type]="entry.type"
                        ></div>
                    </div>
                    <span class="activity-breakdown__pct">{{ entry.percentage }}%</span>
                </div>
            }
            @if (entries().length === 0) {
                <p class="activity-breakdown__empty">No activity recorded.</p>
            }
        </div>
    `,
    styles: `
        .activity-breakdown {
            display: flex;
            flex-direction: column;
            gap: 0.625rem;

            &__row {
                display: grid;
                grid-template-columns: 140px 1fr 40px;
                align-items: center;
                gap: 0.75rem;
            }

            &__info {
                display: flex;
                flex-direction: column;
                gap: 0.125rem;
            }

            &__type {
                font-size: 0.8125rem;
                font-weight: 500;
                text-transform: capitalize;
                color: var(--admin-text-primary, #1a1a2e);
            }

            &__count {
                font-size: 0.6875rem;
                color: var(--admin-text-secondary, #6b7280);
            }

            &__bar-wrap {
                height: 8px;
                border-radius: 4px;
                background: var(--admin-bg-subtle, #f3f4f6);
                overflow: hidden;
            }

            &__bar {
                height: 100%;
                border-radius: 4px;
                transition: width 0.3s ease;

                &[data-type='restock'] { background: #10b981; }
                &[data-type='sale'] { background: #3b82f6; }
                &[data-type='adjustment'] { background: #8b5cf6; }
                &[data-type='reservation'] { background: #f59e0b; }
                &[data-type='release'] { background: #06b6d4; }
                &[data-type='return'] { background: #ef4444; }
                &[data-type='initial'] { background: #6b7280; }
            }

            &__pct {
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--admin-text-primary, #1a1a2e);
                text-align: right;
            }

            &__empty {
                font-size: 0.8125rem;
                color: var(--admin-text-secondary, #6b7280);
                text-align: center;
                padding: 1rem 0;
            }
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminActivityBreakdownComponent {
    readonly entries = input.required<readonly ActivityBreakdownEntry[]>();
    readonly ariaLabel = input('Activity breakdown');

    formatType(type: string): string {
        return type.replace(/_/g, ' ').replace(/-/g, ' ');
    }
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminInventoryLogEntry } from '../../data-access/admin-inventory.contracts';
import {
    TimelineGroup,
    formatLogType,
    resolveLogTypeBadgeClass,
    resolveLogTypeIcon,
    formatQuantity,
    resolveQuantityClass,
} from '../admin-inventory-logs.ui-config';

@Component({
    selector: 'app-admin-log-timeline',
    imports: [DatePipe],
    template: `
        @for (group of groups(); track group.date) {
            <article class="timeline-group" [attr.aria-label]="'Entries for ' + group.date">
                <div class="timeline-group__date">
                    <span class="timeline-group__date-badge">{{ group.date }}</span>
                </div>
                <div class="timeline-group__entries">
                    @for (entry of group.entries; track entry._id) {
                        <div class="timeline-entry" [attr.data-type]="entry.type">
                            <div class="timeline-entry__indicator">
                                <span class="timeline-entry__icon">{{ getIcon(entry.type) }}</span>
                                <div class="timeline-entry__line"></div>
                            </div>
                            <div class="timeline-entry__content">
                                <div class="timeline-entry__header">
                                    <span class="timeline-entry__type" [class]="getBadgeClass(entry.type)">
                                        {{ getLabel(entry.type) }}
                                    </span>
                                    <time class="timeline-entry__time" [attr.datetime]="entry.createdAt">
                                        {{ entry.createdAt | date:'HH:mm:ss' }}
                                    </time>
                                </div>
                                <div class="timeline-entry__body">
                                    <span class="timeline-entry__product">
                                        {{ entry.productId?.name ?? 'Unknown product' }}
                                    </span>
                                    <span class="timeline-entry__qty" [class]="getQtyClass(entry.quantity)">
                                        {{ formatQty(entry.quantity) }} units
                                    </span>
                                </div>
                                <p class="timeline-entry__detail">{{ entry.reason }}</p>
                                <div class="timeline-entry__meta">
                                    <span>{{ entry.previousAvailable }} → {{ entry.newAvailable }} available</span>
                                    @if (entry.performedBy) {
                                        <span class="timeline-entry__actor">by {{ entry.performedBy.name }}</span>
                                    }
                                    @if (entry.referenceId) {
                                        <span class="timeline-entry__ref">Ref: {{ entry.referenceId }}</span>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </article>
        }
    `,
    styleUrl: './admin-log-timeline.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLogTimelineComponent {
    readonly groups = input.required<readonly TimelineGroup[]>();

    protected getIcon(type: AdminInventoryLogEntry['type']): string {
        return resolveLogTypeIcon(type);
    }

    protected getBadgeClass(type: AdminInventoryLogEntry['type']): string {
        return resolveLogTypeBadgeClass(type);
    }

    protected getLabel(type: AdminInventoryLogEntry['type']): string {
        return formatLogType(type);
    }

    protected formatQty(quantity: number): string {
        return formatQuantity(quantity);
    }

    protected getQtyClass(quantity: number): string {
        return resolveQuantityClass(quantity);
    }
}

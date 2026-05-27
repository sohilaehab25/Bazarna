import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface AdminOrderInfoField {
  label: string;
  value: string;
  mono?: boolean;
}

@Component({
  selector: 'app-admin-order-info-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'admin-order-info-card' },
  template: `
    <div class="admin-order-info-card__header">
      <h3 class="admin-order-info-card__title">{{ title() }}</h3>
    </div>
    <dl class="admin-order-info-card__body">
      @for (field of fields(); track field.label) {
        <div class="admin-order-info-card__row">
          <dt class="admin-order-info-card__label">{{ field.label }}</dt>
          <dd
            class="admin-order-info-card__value"
            [class.admin-order-info-card__value--mono]="field.mono"
          >{{ field.value }}</dd>
        </div>
      }
    </dl>
  `,
  styles: [`
    :host {
      display: block;
      border: 1px solid var(--admin-color-border);
      border-radius: var(--admin-radius-md);
      background: var(--admin-color-surface);
      overflow: hidden;
    }

    .admin-order-info-card__header {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--admin-color-border);
    }

    .admin-order-info-card__title {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--admin-color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .admin-order-info-card__body {
      display: grid;
      gap: 0;
      padding: 0.25rem 0;
      margin: 0;
    }

    .admin-order-info-card__row {
      display: grid;
      grid-template-columns: minmax(100px, 38%) 1fr;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-bottom: 1px solid var(--admin-color-border);
    }

    .admin-order-info-card__row:last-child {
      border-bottom: none;
    }

    .admin-order-info-card__label {
      font-size: 0.78rem;
      color: var(--admin-color-text-muted);
      white-space: nowrap;
    }

    .admin-order-info-card__value {
      font-size: 0.82rem;
      color: var(--admin-color-text);
      font-weight: 500;
      word-break: break-word;
      margin: 0;
    }

    .admin-order-info-card__value--mono {
      font-family: ui-monospace, 'Courier New', monospace;
      font-size: 0.78rem;
    }
  `],
})
export class AdminOrderInfoCardComponent {
  readonly title = input.required<string>();
  readonly fields = input.required<readonly AdminOrderInfoField[]>();
}

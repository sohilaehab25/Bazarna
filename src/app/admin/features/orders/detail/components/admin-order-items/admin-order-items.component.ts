import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AdminOrderDetailItem, AdminOrderDetailProductRef } from '../../data-access/admin-order-detail.contracts';

@Component({
  selector: 'app-admin-order-items',
  templateUrl: './admin-order-items.component.html',
  styleUrl: './admin-order-items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrderItemsComponent {
  readonly items = input.required<readonly AdminOrderDetailItem[]>();
  readonly totalPrice = input.required<number>();

  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  getProductName(item: AdminOrderDetailItem): string {
    const p = item.productId;
    if (typeof p === 'object' && p !== null) {
      return (p as AdminOrderDetailProductRef).name;
    }
    return 'Unknown product';
  }

  getUnitPrice(item: AdminOrderDetailItem): string {
    const p = item.productId;
    if (typeof p === 'object' && p !== null) {
      return this.currencyFormatter.format((p as AdminOrderDetailProductRef).price);
    }
    return '—';
  }

  getSubtotal(item: AdminOrderDetailItem): string {
    const p = item.productId;
    if (typeof p === 'object' && p !== null) {
      return this.currencyFormatter.format((p as AdminOrderDetailProductRef).price * item.quantity);
    }
    return '—';
  }

  formatTotal(): string {
    return this.currencyFormatter.format(this.totalPrice());
  }
}

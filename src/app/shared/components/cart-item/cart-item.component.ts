import { ChangeDetectionStrategy, Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { CartItem } from '../../../../app.type';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-item',
  imports: [CommonModule],
  templateUrl: './cart-item.component.html',
  styleUrls: ['./cart-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartItemComponent {
    item = input.required<CartItem>();
    onRemove = output<string>();

    subtotal = computed(() => Math.round(this.item().product.price * this.item().quantity));

    private cartService = inject(CartService);

    increment() {
        this.cartService.increase(this.item().product._id);
    }

    decrement() {
        this.cartService.decrease(this.item().product._id);
    }

    remove() {
        this.onRemove.emit(this.item().product._id);
    }
}
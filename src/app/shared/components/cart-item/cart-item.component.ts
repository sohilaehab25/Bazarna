import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';
import { CartItem, CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './cart-item.component.html',
  styleUrls: ['./cart-item.component.scss']
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
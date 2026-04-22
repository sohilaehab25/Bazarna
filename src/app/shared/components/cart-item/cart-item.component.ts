import { Component, input, output, inject } from '@angular/core';
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

  private cartService = inject(CartService);

  increment() {
    this.cartService.updateQuantity(this.item().product._id, this.item().quantity + 1);
  }

  decrement() {
    this.cartService.updateQuantity(this.item().product._id, this.item().quantity - 1);
  }

  remove() {
    this.onRemove.emit(this.item().product._id);
  }
}
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CartItemComponent } from '../../shared/components/cart-item/cart-item.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent, CartItemComponent, EmptyStateComponent],
  template: `
    <div class="cart">
      <h1>Your Cart 🛒</h1>

      @if (cartItems().length === 0) {
        <app-empty-state
          icon="🛒"
          title="Your cart is empty"
          message="Start shopping to fill your cart with lovely items!"
          actionText="Browse Products">
        </app-empty-state>
      } @else {
        <div class="cart-items">
          @for (item of cartItems(); track item.product._id) {
            <app-cart-item [item]="item" (onRemove)="removeFromCart($event)"></app-cart-item>
          }
        </div>

        <app-card>
          <div class="cart-total">
            <h3>Total: {{ cartTotal() | currency }}</h3>
            <app-button routerLink="/checkout">
              Checkout 💳
            </app-button>
          </div>
        </app-card>
      }
    </div>
  `,
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  private cartService = inject(CartService);

  cartItems = this.cartService.getCartItems();
  cartTotal = this.cartService.cartTotal;

  removeFromCart(productId: string) {
    this.cartService.removeFromCart(productId);
  }
}
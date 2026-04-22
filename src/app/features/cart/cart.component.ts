import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CartItemComponent } from '../../shared/components/cart-item/cart-item.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CartService } from '../../shared/services/cart.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent, CartItemComponent, EmptyStateComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  private cartService = inject(CartService);

  cartItems = this.cartService.getCartItems();
  cartTotal = this.cartService.cartTotal;
  cartItemsCount = this.cartService.cartItemsCount;

  removeFromCart(productId: string) {
    this.cartService.removeFromCart(productId);
  }
}
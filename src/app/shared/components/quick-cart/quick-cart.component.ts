import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-quick-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <div class="quick-cart" *ngIf="cartItems.length > 0">
      <app-card>
        <div class="quick-cart-header">
          <span class="cart-icon">🛒</span>
          <span class="cart-count">{{ cartItems.length }}</span>
          <span class="cart-text">items in cart</span>
        </div>
        <div class="quick-cart-preview">
          <div class="cart-item-preview" *ngFor="let item of cartItems.slice(0, 2)">
            <span class="item-emoji">{{ item.product.emoji }}</span>
            <span class="item-name">{{ item.product.name }}</span>
            <span class="item-price">{{ item.product.price | currency }}</span>
          </div>
          <div class="cart-total" *ngIf="cartItems.length > 2">
            <span>And {{ cartItems.length - 2 }} more items...</span>
          </div>
        </div>
        <div class="quick-cart-total">
          <strong>Total: {{ total | currency }}</strong>
        </div>
        <div class="quick-cart-actions">
          <app-button variant="secondary" routerLink="/cart">
            View Cart
          </app-button>
          <app-button routerLink="/checkout">
            Checkout
          </app-button>
        </div>
      </app-card>
    </div>
  `,
  styleUrls: ['./quick-cart.component.scss']
})
export class QuickCartComponent {
  // Mock cart data - in real app, this would come from CartService
  cartItems = [
    {
      product: { id: '1', name: 'Handmade Scarf', price: 25.99, emoji: '🧣' },
      quantity: 1
    },
    {
      product: { id: '2', name: 'Ceramic Mug', price: 12.50, emoji: '☕' },
      quantity: 2
    }
  ];

  get total() {
    return this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }
}
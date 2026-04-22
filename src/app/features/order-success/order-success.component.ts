import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { OrdersService } from '../../shared/services/orders.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <div class="order-success">
      <app-card>
        <div class="success-content">
          <div class="success-icon">🎉</div>
          <h1>Order Placed Successfully!</h1>
          <p>Thank you for shopping with Cute Bazar 💕</p>
          <div class="order-details">
            <h3>Order Summary</h3>
            <p><strong>Order ID:</strong> {{ orderId }}</p>
            <p><strong>Total:</strong> {{ orderTotal }} EGP</p>
            <p><strong>Status:</strong> Processing</p>
          </div>
          <div class="success-actions">
            <app-button routerLink="/products">
              Continue Shopping
            </app-button>
            <app-button variant="secondary" routerLink="/profile">
              View Order History
            </app-button>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styleUrls: ['./order-success.component.scss']
})
export class OrderSuccessComponent {
  orderId = 'ORD-1234567890'; // In real app, get from route params
  orderTotal = 45.99; // In real app, get from service

  constructor() {
    // In real app, get order details from route params or service
  }
}
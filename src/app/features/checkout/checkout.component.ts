import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CartService } from '../../shared/services/cart.service';
import { OrdersService } from '../../shared/services/orders.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  template: `
    <div class="checkout">
      <h1>Checkout 💳</h1>

      @if (cartItems().length === 0) {
        <app-card>
          <p>Your cart is empty. Add some items before checkout! 🛒</p>
          <app-button routerLink="/products">Browse Products</app-button>
        </app-card>
      } @else {
        <div class="checkout-content">
          <div class="order-summary">
            <app-card>
              <div card-header>
                <h3>Order Summary</h3>
              </div>
              <div class="order-items">
                @for (item of cartItems(); track item.product.id) {
                  <div class="order-item">
                    <span class="order-item__emoji">{{ item.product.emoji }}</span>
                    <span class="order-item__name">{{ item.product.name }}</span>
                    <span class="order-item__quantity">x{{ item.quantity }}</span>
                    <span class="order-item__price">{{ item.product.price * item.quantity | currency }}</span>
                  </div>
                }
              </div>
              <div class="order-total">
                <strong>Total: {{ cartTotal() | currency }}</strong>
              </div>
            </app-card>
          </div>

          <div class="checkout-form">
            <app-card>
              <div card-header>
                <h3>Shipping Information</h3>
              </div>
              <form class="shipping-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>First Name</label>
                    <input type="text" placeholder="John" class="form-input">
                  </div>
                  <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" placeholder="Doe" class="form-input">
                  </div>
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="john@example.com" class="form-input">
                </div>
                <div class="form-group">
                  <label>Address</label>
                  <input type="text" placeholder="123 Main St" class="form-input">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>City</label>
                    <input type="text" placeholder="New York" class="form-input">
                  </div>
                  <div class="form-group">
                    <label>ZIP Code</label>
                    <input type="text" placeholder="10001" class="form-input">
                  </div>
                </div>
              </form>
            </app-card>

            <app-card>
              <div card-header>
                <h3>Payment Information</h3>
              </div>
              <form class="payment-form">
                <div class="form-group">
                  <label>Card Number</label>
                  <input type="text" placeholder="1234 5678 9012 3456" class="form-input">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Expiry Date</label>
                    <input type="text" placeholder="MM/YY" class="form-input">
                  </div>
                  <div class="form-group">
                    <label>CVV</label>
                    <input type="text" placeholder="123" class="form-input">
                  </div>
                </div>
              </form>
            </app-card>

            <div class="checkout-actions">
              <app-button variant="secondary" routerLink="/cart">
                Back to Cart
              </app-button>
              <app-button (onClick)="placeOrder()">
                Place Order 🎉
              </app-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent {
  private cartService = inject(CartService);
  private ordersService = inject(OrdersService);
  private router = inject(Router);

  cartItems = this.cartService.getCartItems();
  cartTotal = this.cartService.cartTotal;

  placeOrder() {
    // In a real app, you'd collect shipping and payment info from forms
    const shippingInfo = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      address: '123 Main St',
      city: 'New York',
      zipCode: '10001'
    };

    const paymentInfo = {
      cardNumber: '**** **** **** 3456',
      expiryDate: '12/25',
      cvv: '123'
    };

    const order = this.ordersService.createOrder(
      this.cartItems(),
      shippingInfo,
      paymentInfo
    );

    alert(`Order ${order.id} placed successfully! Thank you for shopping with Cute Bazar! 💕`);
    this.cartService.clearCart();
    this.router.navigate(['/order-success']);
  }
}
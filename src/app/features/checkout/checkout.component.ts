import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CartService } from '../../shared/services/cart.service';
import { OrdersService } from '../../shared/services/orders.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, RouterLink],
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
                @for (item of cartItems(); track item.product._id) {
                  <div class="order-item">
                    <img [src]="item.product.imageUrl" [alt]="item.product.name" class="order-item__image">
                    <span class="order-item__name">{{ item.product.name }}</span>
                    <span class="order-item__quantity">x{{ item.quantity }}</span>
                    <span class="order-item__price">{{ item.product.price * item.quantity }} EGP</span>
                  </div>
                }
              </div>
              <div class="order-total">
                <strong>Total: {{ cartTotal() }} EGP</strong>
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
    // In a real app, you'd collect shipping info from forms.
    // For now, we just pass the payment method as required by the backend.
    this.ordersService.checkout('cash').subscribe({
      next: (res) => {
        if (res.success) {
          alert(`Order placed successfully! Order ID: ${res.data._id} 💕`);
          this.cartService.clearCart();
          this.router.navigate(['/products']); // Redirect to products or a success page
        }
      },
      error: (err) => {
        alert('Failed to place order: ' + (err.error?.message || err.message));
      }
    });
  }
}
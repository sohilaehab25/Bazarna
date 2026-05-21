import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CartService } from '../../shared/services/cart.service';
import { OrdersService } from '../../shared/services/orders.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent, RouterLink, ReactiveFormsModule, EmptyStateComponent],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent {
  private cartService = inject(CartService);
  private ordersService = inject(OrdersService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  cartItems = this.cartService.getCartItems();
  cartTotal = this.cartService.cartTotal;

  checkoutForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required],
    city: ['', Validators.required],
    zip: [''],
    paymentMethod: ['cash', Validators.required]
  });

  placeOrder() {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const paymentMethod = this.checkoutForm.get('paymentMethod')?.value;

    this.ordersService.checkout(paymentMethod).subscribe({
      next: (res) => {
        if (res.success) {
          alert(`Order placed successfully! Order ID: ${res.data._id} 💕`);
          this.cartService.clearCart();
          this.router.navigate(['/products']);
        }
      },
      error: (err) => {
        alert('Failed to place order: ' + (err.error?.message || err.message));
      }
    });
  }
}
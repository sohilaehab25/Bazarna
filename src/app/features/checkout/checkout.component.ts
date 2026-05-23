import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CartService } from '../../shared/services/cart.service';
import { OrdersService } from '../../shared/services/orders.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { AuthService } from '../../shared/services/auth.service';

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
    private authService = inject(AuthService);
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
        paymentMethod: ['cash', Validators.required]
    });

    handleSucces(res: any) {
        if (res.success) {
            this.cartService.clearCart();
            this.router.navigate(['/products']);
        }
    };

    placeOrder() {
        if (this.checkoutForm.invalid) {
            this.checkoutForm.markAllAsTouched();
            return;
        }
        const paymentMethod = this.checkoutForm.get('paymentMethod')?.value as 'cash' | 'visa';

        if (this.authService.isLoggedIn()) {
            this.ordersService.checkout(paymentMethod).subscribe({
                next: this.handleSucces.bind(this),
            });
            return;
        }

        const items = this.cartItems().map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
        }));

        if (items.length === 0) {
            return;
        }

        const customer = {
            firstName: this.checkoutForm.get('firstName')?.value,
            lastName: this.checkoutForm.get('lastName')?.value,
            email: this.checkoutForm.get('email')?.value,
            address: this.checkoutForm.get('address')?.value,
            city: this.checkoutForm.get('city')?.value,
        };

        this.ordersService.guestCheckout({ items, paymentMethod, customer }).subscribe({
            next: this.handleSucces.bind(this),
        });
    }
}
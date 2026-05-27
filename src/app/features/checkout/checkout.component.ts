import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CartService } from '../../shared/services/cart.service';
import { OrdersService } from '../../shared/services/orders.service';
import { PaymentService } from '../../shared/services/payment.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { AuthService } from '../../shared/services/auth.service';
import { customerInfo } from '../../../app.type';
import { PaymentMethodType } from './payment/payment.types';

@Component({
    selector: 'app-checkout',
    imports: [CardComponent, ButtonComponent, RouterLink, ReactiveFormsModule, EmptyStateComponent],
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
    private readonly cartService = inject(CartService);
    private readonly ordersService = inject(OrdersService);
    private readonly paymentService = inject(PaymentService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);

    readonly cartItems = this.cartService.getCartItems();
    readonly cartTotal = this.cartService.cartTotal;
    readonly isProcessing = signal(false);
    readonly paymentError = signal<string | null>(null);

    readonly checkoutForm = this.fb.nonNullable.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        address: ['', Validators.required],
        city: ['', Validators.required],
        paymentMethod: ['cash' as PaymentMethodType, Validators.required],
    });

    placeOrder(): void {
        if (this.checkoutForm.invalid) {
            this.checkoutForm.markAllAsTouched();
            return;
        }

        this.isProcessing.set(true);
        this.paymentError.set(null);

        const { paymentMethod } = this.checkoutForm.getRawValue();

        if (paymentMethod === 'paymob') {
            this.handlePaymobCheckout();
        } else {
            this.handleCodCheckout();
        }
    }

    // -----------------------------------------------------------------------
    // COD Flow
    // -----------------------------------------------------------------------

    private handleCodCheckout(): void {
        const formValues = this.checkoutForm.getRawValue();

        const checkout$ = this.authService.isLoggedIn()
            ? this.ordersService.checkout(formValues.paymentMethod)
            : this.ordersService.guestCheckout({
                items: this.getCartItemPayload(),
                paymentMethod: formValues.paymentMethod,
                customer: this.extractCustomer(formValues),
            });

        checkout$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.isProcessing.set(false);
                    if (res.success) {
                        this.cartService.clearCart();
                        this.router.navigate(['/order-success']);
                    }
                },
                error: (err) => this.handleError(err),
            });
    }

    // -----------------------------------------------------------------------
    // Paymob Flow — creates order then initiates payment (flat switchMap)
    // -----------------------------------------------------------------------

    private handlePaymobCheckout(): void {
        const formValues = this.checkoutForm.getRawValue();
        const customer = this.extractCustomer(formValues);

        const createOrder$ = this.authService.isLoggedIn()
            ? this.ordersService.checkout('paymob')
            : this.ordersService.guestCheckout({
                items: this.getCartItemPayload(),
                paymentMethod: 'paymob',
                customer,
            });

        createOrder$.pipe(
            switchMap(res => {
                if (!res.success || !res.data) {
                    throw new Error('Failed to create order');
                }
                const order = res.data;
                const amountCents = Math.round(order.totalPrice * 100);

                return this.paymentService.initiatePayment({
                    orderId: order._id,
                    amountCents,
                    customer,
                });
            }),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe({
            next: (paymentResult) => {
                this.cartService.clearCart();
                this.paymentService.redirectToPayment(paymentResult.iframeUrl);
            },
            error: (err) => this.handleError(err),
        });
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private extractCustomer(formValues: ReturnType<typeof this.checkoutForm.getRawValue>): customerInfo {
        return {
            firstName: formValues.firstName,
            lastName: formValues.lastName,
            email: formValues.email,
            address: formValues.address,
            city: formValues.city,
        };
    }

    private getCartItemPayload(): Array<{ productId: string; quantity: number }> {
        return this.cartItems().map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
        }));
    }

    private handleError(err: unknown): void {
        this.isProcessing.set(false);
        const message = (err as { error?: { message?: string } })?.error?.message
            || (err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        this.paymentError.set(message);
    }
}
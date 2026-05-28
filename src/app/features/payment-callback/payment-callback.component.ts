import { ChangeDetectionStrategy, Component, inject, signal, afterNextRender, DestroyRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PaymentService } from '../../shared/services/payment.service';
import { PaymentCallbackState } from '../checkout/payment/payment.types';

@Component({
    selector: 'app-payment-callback',
    imports: [CardComponent, ButtonComponent, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="payment-callback">
            <app-card padding="large">
                <div class="callback-content">
                    @switch (state()) {
                        @case ('loading') {
                            <div class="callback-icon loading-icon" aria-hidden="true">⏳</div>
                            <h1>Verifying Payment...</h1>
                            <p>Please wait while we confirm your payment.</p>
                        }
                        @case ('success') {
                            <div class="callback-icon success-icon" aria-hidden="true">✅</div>
                            <h1>Payment Successful!</h1>
                            <p>Your payment has been confirmed. Your order is being processed.</p>
                            <div class="callback-actions">
                                <app-button routerLink="/products">
                                    Continue Shopping
                                </app-button>
                                <app-button variant="secondary" routerLink="/profile">
                                    View Orders
                                </app-button>
                            </div>
                        }
                        @case ('pending') {
                            <div class="callback-icon pending-icon" aria-hidden="true">🕐</div>
                            <h1>Payment Pending</h1>
                            <p>Your payment is being processed. We'll update your order once confirmed.</p>
                            <div class="callback-actions">
                                <app-button routerLink="/products">
                                    Continue Shopping
                                </app-button>
                                <app-button variant="secondary" routerLink="/profile">
                                    View Orders
                                </app-button>
                            </div>
                        }
                        @case ('failed') {
                            <div class="callback-icon failed-icon" aria-hidden="true">❌</div>
                            <h1>Payment Failed</h1>
                            <p>{{ errorMessage() }}</p>
                            <div class="callback-actions">
                                <app-button routerLink="/checkout">
                                    Try Again
                                </app-button>
                                <app-button variant="secondary" routerLink="/products">
                                    Continue Shopping
                                </app-button>
                            </div>
                        }
                        @case ('error') {
                            <div class="callback-icon error-icon" aria-hidden="true">⚠️</div>
                            <h1>Verification Error</h1>
                            <p>We couldn't verify your payment status. Please check your order history or contact support.</p>
                            <div class="callback-actions">
                                <app-button routerLink="/profile">
                                    Check Order History
                                </app-button>
                                <app-button variant="secondary" routerLink="/contact">
                                    Contact Support
                                </app-button>
                            </div>
                        }
                    }
                </div>
            </app-card>
        </div>
    `,
    styles: [`
        .payment-callback {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
            padding: 2rem;
        }

        .callback-content {
            text-align: center;
            max-width: 480px;
            margin: 0 auto;
            padding: 2rem;
        }

        .callback-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }

        .callback-content h1 {
            font-size: 1.75rem;
            margin-bottom: 0.75rem;
            color: var(--text-primary, #1a1a1a);
        }

        .callback-content p {
            color: var(--text-secondary, #666);
            margin-bottom: 2rem;
            line-height: 1.6;
        }

        .callback-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        .loading-icon {
            animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `],
})
export class PaymentCallbackComponent {
    private readonly paymentService = inject(PaymentService);
    private readonly document = inject(DOCUMENT);
    private readonly destroyRef = inject(DestroyRef);

    readonly state = signal<PaymentCallbackState>('loading');
    readonly errorMessage = signal('Your payment was declined. Please try a different payment method.');

    constructor() {
        // SSR-safe: afterNextRender only executes in the browser
        afterNextRender(() => this.verifyPayment());
    }

    private verifyPayment(): void {
        const queryString = this.document.defaultView?.location.search.substring(1);

        if (!queryString) {
            this.state.set('error');
            return;
        }

        this.paymentService.verifyCallback(queryString)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    if (result.success) {
                        this.state.set('success');
                    } else if (result.pending) {
                        this.state.set('pending');
                    } else {
                        this.state.set('failed');
                    }
                },
                error: () => {
                    this.state.set('error');
                },
            });
    }
}

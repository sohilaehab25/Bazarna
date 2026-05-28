import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../../app.type';
import type {
    InitiatePaymentRequest,
    PaymentInitiateResponse,
    PaymentStatusResponse,
    PaymentCallbackResult,
} from '../../features/checkout/payment/payment.types';

/**
 * Stateless payment data-access service.
 * Handles communication with the payments API.
 * Does NOT own UI state — that belongs in the consuming component.
 */
@Injectable({
    providedIn: 'root',
})
export class PaymentService {
    private readonly http = inject(HttpClient);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly apiUrl = 'http://localhost:3009/api/payments';

    /**
     * Initiate a Paymob payment. Returns the iframe URL.
     */
    initiatePayment(request: InitiatePaymentRequest): Observable<PaymentInitiateResponse> {
        return this.http
            .post<ApiResponse<PaymentInitiateResponse>>(`${this.apiUrl}/initiate`, request)
            .pipe(
                map(res => {
                    if (res.success && res.data) {
                        return res.data;
                    }
                    throw new Error(res.message || 'Payment initiation failed');
                }),
            );
    }

    /**
     * Check payment status for an order.
     */
    getPaymentStatus(orderId: string): Observable<PaymentStatusResponse> {
        return this.http
            .get<ApiResponse<PaymentStatusResponse>>(`${this.apiUrl}/status/${orderId}`)
            .pipe(
                map(res => {
                    if (res.success && res.data) {
                        return res.data;
                    }
                    throw new Error(res.message || 'Failed to get payment status');
                }),
            );
    }

    /**
     * Verify the Paymob callback query parameters (redirect verification).
     */
    verifyCallback(queryParams: string): Observable<PaymentCallbackResult> {
        return this.http
            .get<ApiResponse<PaymentCallbackResult>>(`${this.apiUrl}/verify-callback?${queryParams}`)
            .pipe(
                map(res => {
                    if (res.success && res.data) {
                        return res.data;
                    }
                    throw new Error(res.message || 'Callback verification failed');
                }),
            );
    }

    /**
     * Redirect to Paymob hosted payment page.
     * SSR-safe: only executes in browser.
     */
    redirectToPayment(iframeUrl: string): void {
        if (isPlatformBrowser(this.platformId)) {
            window.location.href = iframeUrl;
        }
    }
}

// ---------------------------------------------------------------------------
// Payment Feature — Types & Contracts
// Scoped to the payment feature; imported only where needed.
// ---------------------------------------------------------------------------

export type PaymentMethodType = 'cash' | 'paymob';

export type PaymentStatus =
    | 'initiated'
    | 'pending'
    | 'processing'
    | 'succeeded'
    | 'failed'
    | 'expired'
    | 'refund_requested'
    | 'refunded'
    | 'partially_refunded';

export interface PaymentCustomer {
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone?: string;
    readonly city?: string;
    readonly address?: string;
}

export interface InitiatePaymentRequest {
    readonly orderId: string;
    readonly amountCents: number;
    readonly customer: PaymentCustomer;
}

export interface PaymentInitiateResponse {
    readonly transactionId: string;
    readonly iframeUrl: string;
    readonly paymobOrderId: string;
}

export interface PaymentStatusResponse {
    readonly transactionId: string;
    readonly status: PaymentStatus;
    readonly provider: string;
    readonly amount: number;
    readonly currency: string;
    readonly paymentMethod?: string;
    readonly cardLast4?: string;
    readonly cardBrand?: string;
    readonly confirmedAt?: string;
    readonly failedAt?: string;
    readonly failureReason?: string;
}

export interface PaymentCallbackResult {
    readonly success: boolean;
    readonly pending: boolean;
    readonly orderId?: string;
    readonly transactionId?: string;
}

export type PaymentCallbackState = 'loading' | 'success' | 'failed' | 'pending' | 'error';

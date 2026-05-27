import crypto from 'crypto';
import { logger } from '../../../utils/logger';

// ---------------------------------------------------------------------------
// Paymob Configuration
// ---------------------------------------------------------------------------

interface PaymobConfig {
    readonly apiKey: string;
    readonly integrationId: string;
    readonly iframeId: string;
    readonly hmacSecret: string;
    readonly baseUrl: string;
    readonly currency: string;
}

function getPaymobConfig(): PaymobConfig {
    const apiKey = process.env.PAYMOB_API_KEY;
    const integrationId = process.env.PAYMOB_INTEGRATION_ID;
    const iframeId = process.env.PAYMOB_IFRAME_ID;
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

    if (!apiKey || !integrationId || !iframeId || !hmacSecret) {
        throw new Error('Missing Paymob environment variables: PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_IFRAME_ID, PAYMOB_HMAC_SECRET');
    }

    return {
        apiKey,
        integrationId,
        iframeId,
        hmacSecret,
        baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api',
        currency: process.env.PAYMOB_CURRENCY || 'EGP',
    };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymobPaymentIntentParams {
    readonly orderId: string;
    readonly amountCents: number;
    readonly currency?: string;
    readonly customer: {
        readonly firstName: string;
        readonly lastName: string;
        readonly email: string;
        readonly phone?: string;
    };
    readonly billingData?: {
        readonly city?: string;
        readonly country?: string;
        readonly street?: string;
    };
    readonly idempotencyKey: string;
}

export interface PaymobPaymentIntentResult {
    readonly paymentToken: string;
    readonly paymobOrderId: string;
    readonly iframeUrl: string;
}

// ---------------------------------------------------------------------------
// HMAC Verification Fields (Paymob-specified order)
// ---------------------------------------------------------------------------

const HMAC_FIELDS = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order.id',
    'owner',
    'pending',
    'source_data.pan',
    'source_data.sub_type',
    'source_data.type',
    'success',
] as const;

// ---------------------------------------------------------------------------
// Callback HMAC fields (same as HMAC_FIELDS but uses 'order' instead of 'order.id')
// ---------------------------------------------------------------------------

const CALLBACK_HMAC_FIELDS = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order',
    'owner',
    'pending',
    'source_data.pan',
    'source_data.sub_type',
    'source_data.type',
    'success',
] as const;

// ---------------------------------------------------------------------------
// Provider Implementation
// ---------------------------------------------------------------------------

export class PaymobProvider {
    private _config: PaymobConfig | undefined;

    private get config(): PaymobConfig {
        if (!this._config) {
            this._config = getPaymobConfig();
        }
        return this._config;
    }

    /**
     * Step 1: Authenticate with Paymob and get an auth token.
     */
    private async authenticate(): Promise<string> {
        const config = this.config;
        const response = await fetch(`${config.baseUrl}/auth/tokens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: config.apiKey }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error('Paymob auth failed', { status: response.status, body: errorBody });
            throw new Error('Paymob authentication failed');
        }

        const data = await response.json() as { token: string };
        return data.token;
    }

    /**
     * Step 2: Register an order with Paymob.
     */
    private async registerOrder(authToken: string, params: PaymobPaymentIntentParams): Promise<string> {
        const config = this.config;
        const response = await fetch(`${config.baseUrl}/ecommerce/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: authToken,
                delivery_needed: false,
                amount_cents: params.amountCents,
                currency: params.currency || config.currency,
                merchant_order_id: params.idempotencyKey,
                items: [],
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error('Paymob order registration failed', { status: response.status, body: errorBody });
            throw new Error('Paymob order registration failed');
        }

        const data = await response.json() as { id: number };
        return String(data.id);
    }

    /**
     * Step 3: Generate a payment key (token) for the iframe.
     */
    private async generatePaymentKey(
        authToken: string,
        paymobOrderId: string,
        params: PaymobPaymentIntentParams,
    ): Promise<string> {
        const config = this.config;

        const billingData = {
            first_name: params.customer.firstName,
            last_name: params.customer.lastName,
            email: params.customer.email,
            phone_number: params.customer.phone || 'NA',
            city: params.billingData?.city || 'NA',
            country: params.billingData?.country || 'EG',
            street: params.billingData?.street || 'NA',
            building: 'NA',
            floor: 'NA',
            apartment: 'NA',
            state: 'NA',
            shipping_method: 'NA',
            postal_code: 'NA',
        };

        const response = await fetch(`${config.baseUrl}/acceptance/payment_keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: authToken,
                amount_cents: params.amountCents,
                expiration: 1800, // 30 minutes
                order_id: paymobOrderId,
                billing_data: billingData,
                currency: params.currency || config.currency,
                integration_id: Number(config.integrationId),
                lock_order_when_paid: true,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error('Paymob payment key generation failed', { status: response.status, body: errorBody });
            throw new Error('Paymob payment key generation failed');
        }

        const data = await response.json() as { token: string };
        return data.token;
    }

    /**
     * Full payment intent creation flow.
     * Returns the iframe URL the frontend should redirect to.
     */
    async createPaymentIntent(params: PaymobPaymentIntentParams): Promise<PaymobPaymentIntentResult> {
        const config = this.config;

        // Step 1: Auth
        const authToken = await this.authenticate();

        // Step 2: Register order
        const paymobOrderId = await this.registerOrder(authToken, params);

        // Step 3: Payment key
        const paymentToken = await this.generatePaymentKey(authToken, paymobOrderId, params);

        // Build iframe URL
        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${config.iframeId}?payment_token=${paymentToken}`;

        return {
            paymentToken,
            paymobOrderId,
            iframeUrl,
        };
    }

    /**
     * Verify Paymob HMAC signature on webhook/callback.
     * Paymob concatenates specific fields in alphabetical order and HMACs with SHA512.
     */
    verifyHmac(transactionData: Record<string, unknown>, receivedHmac: string): boolean {
        const concatenated = HMAC_FIELDS.map(field => {
            const value = this.getNestedValue(transactionData, field);
            return String(value ?? '');
        }).join('');

        return this.compareHmac(concatenated, receivedHmac);
    }

    /**
     * Verify the callback query parameters HMAC (for redirect-based verification).
     * Paymob sends hmac as a query param computed over specific response fields.
     */
    verifyCallbackHmac(queryParams: Record<string, string>): boolean {
        const hmac = queryParams['hmac'];
        if (!hmac) return false;

        const concatenated = CALLBACK_HMAC_FIELDS.map(field => {
            return String(queryParams[field] ?? '');
        }).join('');

        return this.compareHmac(concatenated, hmac);
    }

    /**
     * Compute HMAC-SHA512 and perform timing-safe comparison.
     */
    private compareHmac(data: string, receivedHmac: string): boolean {
        const computedHmac = crypto
            .createHmac('sha512', this.config.hmacSecret)
            .update(data)
            .digest('hex');

        try {
            return crypto.timingSafeEqual(
                Buffer.from(computedHmac, 'hex'),
                Buffer.from(receivedHmac, 'hex'),
            );
        } catch {
            return false;
        }
    }

    /**
     * Get nested value from object using dot notation.
     */
    private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
        return path.split('.').reduce<unknown>((current, key) => {
            if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
                return (current as Record<string, unknown>)[key];
            }
            return undefined;
        }, obj);
    }
}

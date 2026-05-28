import crypto from 'crypto';
import PaymentTransactionModel, {
    IPaymentTransaction,
    PaymentProvider,
    PaymentStatus,
} from './models/PaymentTransaction';
import { PaymobProvider, PaymobPaymentIntentParams, PaymobPaymentIntentResult } from './providers/paymob.provider';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InitiatePaymentParams {
    readonly orderId: string;
    readonly userId?: string;
    readonly amountCents: number;
    readonly currency?: string;
    readonly customer: {
        readonly firstName: string;
        readonly lastName: string;
        readonly email: string;
        readonly phone?: string;
        readonly city?: string;
        readonly address?: string;
    };
}

export interface InitiatePaymentResult {
    readonly transactionId: string;
    readonly iframeUrl: string;
    readonly paymobOrderId: string;
}

export interface WebhookUpdateParams {
    readonly providerTransactionId: string;
    readonly providerOrderId: string;
    readonly success: boolean;
    readonly pending: boolean;
    readonly amountCents: number;
    readonly currency: string;
    readonly paymentMethod?: string;
    readonly cardLast4?: string;
    readonly cardBrand?: string;
    readonly failureReason?: string;
    readonly failureCode?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class PaymentService {
    private readonly paymobProvider = new PaymobProvider();

    /**
     * Initiate a Paymob payment for an order.
     * Creates a transaction record and returns the iframe URL.
     */
    async initiatePaymobPayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
        const idempotencyKey = this.generateIdempotencyKey(params.orderId);

        // Check for existing non-terminal transaction (idempotency)
        const existingTx = await PaymentTransactionModel.findOne({
            orderId: params.orderId,
            status: { $in: [PaymentStatus.INITIATED, PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        });

        if (existingTx) {
            logger.info('Returning existing payment transaction', { txId: existingTx._id, orderId: params.orderId });
            // If we already have a paymob order, rebuild the iframe URL
            if (existingTx.providerOrderId) {
                return {
                    transactionId: existingTx._id.toString(),
                    iframeUrl: '', // Client should use stored URL or re-initiate
                    paymobOrderId: existingTx.providerOrderId,
                };
            }
        }

        // Create transaction record
        const transaction = await PaymentTransactionModel.create({
            orderId: params.orderId,
            userId: params.userId,
            provider: PaymentProvider.PAYMOB,
            amount: params.amountCents,
            currency: params.currency || 'EGP',
            status: PaymentStatus.INITIATED,
            idempotencyKey,
            initiatedAt: new Date(),
            statusHistory: [{
                from: PaymentStatus.INITIATED,
                to: PaymentStatus.INITIATED,
                reason: 'Payment initiated',
                timestamp: new Date(),
            }],
        });

        try {
            // Create Paymob payment intent
            const intentParams: PaymobPaymentIntentParams = {
                orderId: params.orderId,
                amountCents: params.amountCents,
                currency: params.currency,
                customer: {
                    firstName: params.customer.firstName,
                    lastName: params.customer.lastName,
                    email: params.customer.email,
                    phone: params.customer.phone,
                },
                billingData: {
                    city: params.customer.city,
                    street: params.customer.address,
                },
                idempotencyKey,
            };

            const result: PaymobPaymentIntentResult = await this.paymobProvider.createPaymentIntent(intentParams);

            // Update transaction with provider order ID
            await this.updateTransactionStatus(transaction._id.toString(), PaymentStatus.PENDING, {
                providerOrderId: result.paymobOrderId,
            });

            return {
                transactionId: transaction._id.toString(),
                iframeUrl: result.iframeUrl,
                paymobOrderId: result.paymobOrderId,
            };
        } catch (error) {
            // Mark as failed if intent creation fails
            await this.updateTransactionStatus(transaction._id.toString(), PaymentStatus.FAILED, {
                failureReason: error instanceof Error ? error.message : 'Unknown error during payment initiation',
            });
            throw error;
        }
    }

    /**
     * Process webhook notification from Paymob.
     * This is the authoritative payment confirmation.
     */
    async processWebhookUpdate(params: WebhookUpdateParams): Promise<IPaymentTransaction | null> {
        // Find transaction by provider order ID
        const transaction = await PaymentTransactionModel.findOne({
            providerOrderId: params.providerOrderId,
            provider: PaymentProvider.PAYMOB,
        });

        if (!transaction) {
            logger.warn('Webhook received for unknown transaction', {
                providerOrderId: params.providerOrderId,
                providerTransactionId: params.providerTransactionId,
            });
            return null;
        }

        // Determine new status
        let newStatus: PaymentStatus;
        if (params.success) {
            newStatus = PaymentStatus.SUCCEEDED;
        } else if (params.pending) {
            newStatus = PaymentStatus.PROCESSING;
        } else {
            newStatus = PaymentStatus.FAILED;
        }

        // Skip if already in a terminal state (idempotent)
        if (transaction.status === PaymentStatus.SUCCEEDED || transaction.status === PaymentStatus.REFUNDED) {
            logger.info('Ignoring webhook for terminal transaction', {
                txId: transaction._id,
                currentStatus: transaction.status,
            });
            return transaction;
        }

        // Update transaction
        interface TransactionUpdate {
            providerTransactionId: string;
            status: PaymentStatus;
            paymentMethod?: string;
            cardLast4?: string;
            cardBrand?: string;
            confirmedAt?: Date;
            failedAt?: Date;
            failureReason?: string;
            failureCode?: string;
        }

        const updateData: TransactionUpdate = {
            providerTransactionId: params.providerTransactionId,
            status: newStatus,
            paymentMethod: params.paymentMethod,
            cardLast4: params.cardLast4,
            cardBrand: params.cardBrand,
        };

        if (newStatus === PaymentStatus.SUCCEEDED) {
            updateData.confirmedAt = new Date();
        } else if (newStatus === PaymentStatus.FAILED) {
            updateData.failedAt = new Date();
            updateData.failureReason = params.failureReason;
            updateData.failureCode = params.failureCode;
        }

        const updatedTx = await PaymentTransactionModel.findByIdAndUpdate(
            transaction._id,
            {
                $set: updateData,
                $push: {
                    statusHistory: {
                        from: transaction.status,
                        to: newStatus,
                        reason: params.success ? 'Payment confirmed by provider' : (params.failureReason || 'Payment failed'),
                        timestamp: new Date(),
                    },
                },
            },
            { new: true },
        );

        return updatedTx;
    }

    /**
     * Verify Paymob HMAC on webhook payload.
     */
    verifyPaymobWebhook(transactionData: Record<string, unknown>, hmac: string): boolean {
        return this.paymobProvider.verifyHmac(transactionData, hmac);
    }

    /**
     * Verify Paymob callback query params HMAC (redirect from hosted page).
     */
    verifyPaymobCallback(queryParams: Record<string, string>): boolean {
        return this.paymobProvider.verifyCallbackHmac(queryParams);
    }

    /**
     * Find a transaction by order ID.
     */
    async findByOrderId(orderId: string): Promise<IPaymentTransaction | null> {
        return PaymentTransactionModel.findOne({ orderId }).sort({ createdAt: -1 });
    }

    /**
     * Find a transaction by ID.
     */
    async findById(transactionId: string): Promise<IPaymentTransaction | null> {
        return PaymentTransactionModel.findById(transactionId);
    }

    /**
     * Expire stale initiated/pending transactions (called by cron/scheduler).
     */
    async expireStaleTransactions(olderThanMinutes: number = 30): Promise<number> {
        const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
        const now = new Date();

        const result = await PaymentTransactionModel.updateMany(
            {
                status: { $in: [PaymentStatus.INITIATED, PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
                initiatedAt: { $lt: cutoff },
            },
            [
                {
                    $set: {
                        statusHistory: {
                            $concatArrays: [
                                '$statusHistory',
                                [{
                                    from: '$status',
                                    to: PaymentStatus.EXPIRED,
                                    reason: `Expired after ${olderThanMinutes} minutes`,
                                    timestamp: now,
                                }],
                            ],
                        },
                        status: PaymentStatus.EXPIRED,
                        expiredAt: now,
                    },
                },
            ],
        );

        if (result.modifiedCount > 0) {
            logger.info(`Expired ${result.modifiedCount} stale payment transactions`);
        }

        return result.modifiedCount;
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private generateIdempotencyKey(orderId: string): string {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `pay_${orderId}_${timestamp}_${random}`;
    }

    private async updateTransactionStatus(
        transactionId: string,
        newStatus: PaymentStatus,
        extraFields: Record<string, unknown> = {},
    ): Promise<void> {
        const tx = await PaymentTransactionModel.findById(transactionId);
        if (!tx) return;

        await PaymentTransactionModel.findByIdAndUpdate(transactionId, {
            $set: { status: newStatus, ...extraFields },
            $push: {
                statusHistory: {
                    from: tx.status,
                    to: newStatus,
                    reason: `Status updated to ${newStatus}`,
                    timestamp: new Date(),
                },
            },
        });
    }
}

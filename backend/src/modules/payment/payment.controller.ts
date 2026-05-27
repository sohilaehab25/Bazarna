import { Request, Response } from 'express';
import { PaymentService, InitiatePaymentParams } from './payment.service';
import { logger } from '../../utils/logger';

const paymentService = new PaymentService();

export class PaymentController {
    /**
     * POST /api/payments/initiate
     * Creates a Paymob payment intent and returns the iframe URL.
     */
    async initiatePayment(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as { _id: string; email: string; name?: string } | undefined;
            const { orderId, amountCents, customer } = req.body;

            if (!orderId || !amountCents || !customer) {
                res.apiError('Missing required fields: orderId, amountCents, customer', 400);
                return;
            }

            if (typeof amountCents !== 'number' || amountCents <= 0) {
                res.apiError('amountCents must be a positive number', 400);
                return;
            }

            if (!customer.firstName || !customer.lastName || !customer.email) {
                res.apiError('Customer must include firstName, lastName, and email', 400);
                return;
            }

            const params: InitiatePaymentParams = {
                orderId,
                userId: user?._id,
                amountCents,
                customer: {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phone: customer.phone,
                    city: customer.city,
                    address: customer.address,
                },
            };

            const result = await paymentService.initiatePaymobPayment(params);

            res.apiSuccess('Payment initiated successfully', {
                transactionId: result.transactionId,
                iframeUrl: result.iframeUrl,
                paymobOrderId: result.paymobOrderId,
            }, 201);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Payment initiation failed';
            logger.error('Payment initiation error', { error: message });
            res.apiError(message, 500);
        }
    }

    /**
     * GET /api/payments/status/:orderId
     * Returns the payment status for an order.
     */
    async getPaymentStatus(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;

            if (!orderId) {
                res.apiError('Order ID is required', 400);
                return;
            }

            const transaction = await paymentService.findByOrderId(orderId);

            if (!transaction) {
                res.apiError('No payment found for this order', 404);
                return;
            }

            res.apiSuccess('Payment status retrieved', {
                transactionId: transaction._id,
                status: transaction.status,
                provider: transaction.provider,
                amount: transaction.amount,
                currency: transaction.currency,
                paymentMethod: transaction.paymentMethod,
                cardLast4: transaction.cardLast4,
                cardBrand: transaction.cardBrand,
                confirmedAt: transaction.confirmedAt,
                failedAt: transaction.failedAt,
                failureReason: transaction.failureReason,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to get payment status';
            res.apiError(message, 500);
        }
    }

    /**
     * GET /api/payments/verify-callback
     * Verifies a Paymob redirect callback and returns payment result.
     * Called by frontend after user returns from Paymob hosted page.
     */
    async verifyCallback(req: Request, res: Response): Promise<void> {
        try {
            const queryParams = req.query as Record<string, string>;

            const isValid = paymentService.verifyPaymobCallback(queryParams);

            if (!isValid) {
                logger.warn('Invalid Paymob callback signature', { query: queryParams });
                res.apiError('Invalid payment callback signature', 403);
                return;
            }

            const success = queryParams['success'] === 'true';
            const pending = queryParams['pending'] === 'true';
            const orderId = queryParams['order'];
            const transactionId = queryParams['id'];

            res.apiSuccess('Payment callback verified', {
                success,
                pending,
                orderId,
                transactionId,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Callback verification failed';
            logger.error('Payment callback verification error', { error: message });
            res.apiError(message, 500);
        }
    }

    /**
     * GET /api/payments/transaction/:transactionId
     * Returns full transaction details (admin only).
     */
    async getTransaction(req: Request, res: Response): Promise<void> {
        try {
            const { transactionId } = req.params;
            const transaction = await paymentService.findById(transactionId);

            if (!transaction) {
                res.apiError('Transaction not found', 404);
                return;
            }

            res.apiSuccess('Transaction retrieved', transaction);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to get transaction';
            res.apiError(message, 500);
        }
    }
}

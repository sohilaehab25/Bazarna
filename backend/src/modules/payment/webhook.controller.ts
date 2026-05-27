import { Request, Response } from 'express';
import { PaymentService, WebhookUpdateParams } from './payment.service';
import WebhookLogModel from './models/WebhookLog';
import OrderModel, { OrderStatus } from '../../models/Order';
import { PaymentStatus } from './models/PaymentTransaction';
import { emitOrderStatusUpdate, OrderStatusUpdatePayload } from '../../utils/socket';
import { logger } from '../../utils/logger';

const paymentService = new PaymentService();

export class WebhookController {
    /**
     * POST /api/webhooks/paymob
     * Handles Paymob transaction processed callback (server-to-server).
     *
     * Security:
     * - HMAC signature verification
     * - Idempotent processing (webhook ID dedup)
     * - Raw payload logging for audit
     * - Fast 200 acknowledgment
     */
    async handlePaymobWebhook(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();

        try {
            const payload = req.body;
            const hmac = (req.query['hmac'] as string) || (req.body?.hmac as string) || '';

            // Extract transaction object
            const transactionData = payload?.obj;
            if (!transactionData) {
                logger.warn('Paymob webhook: missing obj in payload');
                res.status(400).json({ message: 'Invalid payload' });
                return;
            }

            // Generate unique webhook ID for idempotency
            const webhookId = `paymob_tx_${transactionData.id}`;

            // Check for duplicate (idempotency)
            const existing = await WebhookLogModel.findOne({ webhookId });
            if (existing?.processed) {
                logger.info('Duplicate webhook ignored', { webhookId });
                res.status(200).json({ message: 'Already processed' });
                return;
            }

            // Verify HMAC signature
            const signatureValid = paymentService.verifyPaymobWebhook(transactionData, hmac);

            // Log the webhook immediately (before processing)
            await WebhookLogModel.create({
                provider: 'paymob',
                eventType: payload.type || 'TRANSACTION',
                webhookId,
                rawPayload: payload,
                headers: this.sanitizeHeaders(req.headers as Record<string, string>),
                signatureValid,
                processed: false,
            });

            if (!signatureValid) {
                logger.error('Paymob webhook HMAC verification failed', {
                    webhookId,
                    transactionId: transactionData.id,
                });
                // Still return 200 to prevent Paymob retries (we logged it for investigation)
                res.status(200).json({ message: 'Received' });
                return;
            }

            // Acknowledge immediately — process asynchronously
            res.status(200).json({ message: 'Received' });

            // Process the webhook (after response sent)
            await this.processPaymobTransaction(transactionData, webhookId);

            logger.info('Paymob webhook processed', {
                webhookId,
                duration: Date.now() - startTime,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Webhook processing error';
            logger.error('Paymob webhook error', { error: message });

            // Always return 200 to avoid infinite retries
            if (!res.headersSent) {
                res.status(200).json({ message: 'Received' });
            }
        }
    }

    /**
     * Process a Paymob transaction notification.
     * Updates the payment transaction and synchronizes the order status.
     */
    private async processPaymobTransaction(
        transactionData: Record<string, unknown>,
        webhookId: string,
    ): Promise<void> {
        try {
            const sourceData = transactionData['source_data'] as Record<string, unknown> | undefined;

            const updateParams: WebhookUpdateParams = {
                providerTransactionId: String(transactionData['id']),
                providerOrderId: String((transactionData['order'] as Record<string, unknown>)?.['id'] || ''),
                success: transactionData['success'] === true,
                pending: transactionData['pending'] === true,
                amountCents: Number(transactionData['amount_cents']) || 0,
                currency: String(transactionData['currency'] || 'EGP'),
                paymentMethod: sourceData ? String(sourceData['type'] || '') : undefined,
                cardLast4: sourceData ? String(sourceData['pan'] || '').slice(-4) : undefined,
                cardBrand: sourceData ? String(sourceData['sub_type'] || '') : undefined,
                failureReason: transactionData['data']
                    ? String((transactionData['data'] as Record<string, unknown>)['message'] || '')
                    : undefined,
                failureCode: transactionData['data']
                    ? String((transactionData['data'] as Record<string, unknown>)['txn_response_code'] || '')
                    : undefined,
            };

            // Update payment transaction
            const updatedTx = await paymentService.processWebhookUpdate(updateParams);

            if (updatedTx) {
                // Synchronize order status based on payment result
                await this.synchronizeOrderStatus(updatedTx.orderId.toString(), updatedTx.status);
            }

            // Mark webhook as processed
            await WebhookLogModel.findOneAndUpdate(
                { webhookId },
                { $set: { processed: true, processedAt: new Date() } },
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown processing error';
            logger.error('Paymob transaction processing failed', { webhookId, error: message });

            // Log the error on the webhook record for retry
            await WebhookLogModel.findOneAndUpdate(
                { webhookId },
                { $set: { processingError: message } },
            );
        }
    }

    /**
     * Synchronize order status based on payment outcome.
     * Only moves order forward — never backwards.
     */
    private async synchronizeOrderStatus(orderId: string, paymentStatus: PaymentStatus): Promise<void> {
        const order = await OrderModel.findById(orderId);
        if (!order) {
            logger.warn('Order not found for payment sync', { orderId });
            return;
        }

        let newOrderStatus: OrderStatus | null = null;

        switch (paymentStatus) {
            case PaymentStatus.SUCCEEDED:
                // Payment confirmed → mark order as paid/pending fulfillment
                if (order.status === OrderStatus.PENDING) {
                    newOrderStatus = OrderStatus.PAID;
                }
                break;

            case PaymentStatus.FAILED:
                // Payment failed → order stays pending (customer can retry)
                // We don't cancel automatically — admin decides
                break;

            case PaymentStatus.EXPIRED:
                // Payment expired → could cancel or keep pending
                break;
        }

        if (newOrderStatus && order.status !== newOrderStatus) {
            const previousStatus = order.status;
            order.status = newOrderStatus;
            order.statusHistory.push({
                fromStatus: previousStatus,
                toStatus: newOrderStatus,
                performedBy: 'system:paymob-webhook',
                performedByRole: 'system',
                reason: `Payment ${paymentStatus}`,
                timestamp: new Date(),
            } as unknown as (typeof order.statusHistory)[number]);
            await order.save();

            // Emit real-time update
            const updatePayload: OrderStatusUpdatePayload = {
                orderId,
                fromStatus: previousStatus,
                toStatus: newOrderStatus,
                performedBy: 'system:paymob-webhook',
                reason: `Payment ${paymentStatus}`,
                timestamp: new Date(),
            };
            emitOrderStatusUpdate(updatePayload);
        }
    }

    /**
     * Sanitize headers to remove sensitive data before logging.
     */
    private sanitizeHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
        const safe: Record<string, string> = {};
        const allowedHeaders = ['content-type', 'content-length', 'user-agent', 'x-forwarded-for', 'host'];

        for (const key of allowedHeaders) {
            const value = headers[key];
            if (value) {
                safe[key] = Array.isArray(value) ? value.join(', ') : value;
            }
        }
        return safe;
    }
}

import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { jwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { rolesGuard } from '../../shared/guards/roles.guard';
import { UserRole } from '../../models/User';

const router = Router();
const paymentController = new PaymentController();
const webhookController = new WebhookController();

// --- Customer-facing endpoints ---

// Initiate a Paymob payment (authenticated or guest with order ID)
router.post(
    '/initiate',
    paymentController.initiatePayment.bind(paymentController),
);

// Verify callback from Paymob redirect (no auth — Paymob redirects here)
router.get(
    '/verify-callback',
    paymentController.verifyCallback.bind(paymentController),
);

// Get payment status for an order
router.get(
    '/status/:orderId',
    paymentController.getPaymentStatus.bind(paymentController),
);

// --- Admin endpoints ---

// Get full transaction details
router.get(
    '/transaction/:transactionId',
    jwtAuthGuard,
    rolesGuard([UserRole.ADMIN]),
    paymentController.getTransaction.bind(paymentController),
);

// --- Webhook endpoint (no auth — uses HMAC verification) ---

router.post(
    '/webhooks/paymob',
    webhookController.handlePaymobWebhook.bind(webhookController),
);

export default router;

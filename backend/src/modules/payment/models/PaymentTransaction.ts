import mongoose, { Document, Schema } from 'mongoose';

// ---------------------------------------------------------------------------
// Payment Status Enum
// ---------------------------------------------------------------------------

export enum PaymentStatus {
    INITIATED = 'initiated',
    PENDING = 'pending',
    PROCESSING = 'processing',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
    EXPIRED = 'expired',
    REFUND_REQUESTED = 'refund_requested',
    REFUNDED = 'refunded',
    PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentProvider {
    PAYMOB = 'paymob',
    COD = 'cod',
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface IStatusHistoryEntry {
    from: PaymentStatus;
    to: PaymentStatus;
    reason?: string;
    timestamp: Date;
}

export interface IPaymentTransaction extends Document {
    orderId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;

    // Provider info
    provider: PaymentProvider;
    providerTransactionId?: string;
    providerOrderId?: string;

    // Amounts (stored in piasters for EGP — smallest currency unit)
    amount: number;
    currency: string;
    refundedAmount: number;

    // Status
    status: PaymentStatus;
    statusHistory: IStatusHistoryEntry[];

    // Idempotency
    idempotencyKey: string;

    // Payment metadata
    paymentMethod?: string;
    cardLast4?: string;
    cardBrand?: string;

    // Timestamps
    initiatedAt: Date;
    confirmedAt?: Date;
    failedAt?: Date;
    expiredAt?: Date;

    // Failure info
    failureReason?: string;
    failureCode?: string;

    // Audit metadata
    metadata?: Record<string, unknown>;

    createdAt: Date;
    updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const StatusHistorySchema = new Schema<IStatusHistoryEntry>({
    from: { type: String, enum: Object.values(PaymentStatus), required: true },
    to: { type: String, enum: Object.values(PaymentStatus), required: true },
    reason: { type: String, trim: true, maxlength: 500 },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });

const PaymentTransactionSchema = new Schema<IPaymentTransaction>({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },

    provider: {
        type: String,
        enum: Object.values(PaymentProvider),
        required: true,
    },
    providerTransactionId: {
        type: String,
        sparse: true,
        index: true,
    },
    providerOrderId: { type: String },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'EGP', uppercase: true },
    refundedAmount: { type: Number, default: 0, min: 0 },

    status: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.INITIATED,
        index: true,
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },

    idempotencyKey: {
        type: String,
        required: true,
        unique: true,
    },

    paymentMethod: { type: String, trim: true },
    cardLast4: { type: String, trim: true, maxlength: 4 },
    cardBrand: { type: String, trim: true },

    initiatedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
    failedAt: { type: Date },
    expiredAt: { type: Date },

    failureReason: { type: String, trim: true },
    failureCode: { type: String, trim: true },

    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
});

// Compound indexes for common query patterns
PaymentTransactionSchema.index({ status: 1, createdAt: -1 });
PaymentTransactionSchema.index({ userId: 1, createdAt: -1 });
PaymentTransactionSchema.index({ orderId: 1, status: 1 });

export default mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);

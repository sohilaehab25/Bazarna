import mongoose, { Document, Schema } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IWebhookLog extends Document {
    provider: string;
    eventType: string;
    webhookId: string;

    rawPayload: Record<string, unknown>;
    headers: Record<string, string>;

    signatureValid: boolean;
    processed: boolean;
    processedAt?: Date;
    processingError?: string;

    createdAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const WebhookLogSchema = new Schema<IWebhookLog>({
    provider: { type: String, required: true, trim: true, index: true },
    eventType: { type: String, required: true, trim: true },
    webhookId: { type: String, required: true, unique: true },

    rawPayload: { type: Schema.Types.Mixed, required: true },
    headers: { type: Schema.Types.Mixed, default: {} },

    signatureValid: { type: Boolean, required: true },
    processed: { type: Boolean, default: false, index: true },
    processedAt: { type: Date },
    processingError: { type: String, trim: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

WebhookLogSchema.index({ provider: 1, eventType: 1, createdAt: -1 });
WebhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL: 90 days

export default mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema);

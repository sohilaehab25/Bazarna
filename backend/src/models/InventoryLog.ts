import mongoose, { Document, Schema } from 'mongoose';

export enum InventoryLogType {
    SALE = 'sale',
    RESERVATION = 'reservation',
    RELEASE = 'release',
    RESTOCK = 'restock',
    ADJUSTMENT = 'adjustment',
    RETURN = 'return',
    REFUND = 'refund',
    IMPORT = 'import',
    WAREHOUSE_TRANSFER = 'warehouse_transfer',
    INITIAL = 'initial',
}

export enum InventoryLogReferenceType {
    ORDER = 'order',
    MANUAL = 'manual',
    SYSTEM = 'system',
    RETURN_REQUEST = 'return_request',
    IMPORT = 'import',
    TRANSFER = 'transfer',
}

export interface InventoryLog extends Document {
    productId: mongoose.Types.ObjectId;
    warehouseId: string;
    type: InventoryLogType;
    quantity: number;
    previousAvailable: number;
    newAvailable: number;
    previousReserved: number;
    newReserved: number;
    snapshotTotalStock: number;
    referenceType: InventoryLogReferenceType;
    referenceId: string | null;
    performedBy: mongoose.Types.ObjectId | null;
    reason: string;
    ipAddress: string | null;
    metadata: Record<string, unknown>;
    createdAt: Date;
}

const InventoryLogSchema: Schema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        warehouseId: {
            type: String,
            required: true,
            default: 'default',
            trim: true,
        },
        type: {
            type: String,
            enum: Object.values(InventoryLogType),
            required: true,
            index: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        previousAvailable: {
            type: Number,
            required: true,
        },
        newAvailable: {
            type: Number,
            required: true,
        },
        previousReserved: {
            type: Number,
            required: true,
        },
        newReserved: {
            type: Number,
            required: true,
        },
        referenceType: {
            type: String,
            enum: Object.values(InventoryLogReferenceType),
            required: true,
        },
        referenceId: {
            type: String,
            default: null,
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        snapshotTotalStock: {
            type: Number,
            default: 0,
        },
        ipAddress: {
            type: String,
            default: null,
            trim: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

InventoryLogSchema.index({ productId: 1, createdAt: -1 });
InventoryLogSchema.index({ type: 1, createdAt: -1 });
InventoryLogSchema.index({ referenceType: 1, referenceId: 1 });
InventoryLogSchema.index({ performedBy: 1, createdAt: -1 });
InventoryLogSchema.index({ createdAt: -1 });

export default mongoose.model<InventoryLog>('InventoryLog', InventoryLogSchema);

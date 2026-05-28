import mongoose, { Document, Schema } from 'mongoose';

export enum InventoryStatus {
    IN_STOCK = 'in-stock',
    LOW_STOCK = 'low-stock',
    OUT_OF_STOCK = 'out-of-stock',
    RESERVED = 'reserved',
}

export interface Inventory extends Document {
    productId: mongoose.Types.ObjectId;
    warehouseId: string;
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    lowStockThreshold: number;
    status: InventoryStatus;
    lastRestockedAt: Date | null;
    lastAuditedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const InventorySchema: Schema = new Schema(
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
            index: true,
        },
        totalStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        availableStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        reservedStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        lowStockThreshold: {
            type: Number,
            required: true,
            min: 0,
            default: 10,
        },
        status: {
            type: String,
            enum: Object.values(InventoryStatus),
            default: InventoryStatus.OUT_OF_STOCK,
            index: true,
        },
        lastRestockedAt: {
            type: Date,
            default: null,
        },
        lastAuditedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

InventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });
InventorySchema.index({ status: 1, warehouseId: 1 });
InventorySchema.index({ availableStock: 1 });

InventorySchema.pre('save', function (next) {
    this.status = computeInventoryStatus(
        this.availableStock as number,
        this.reservedStock as number,
        this.lowStockThreshold as number
    );
    next();
});

export function computeInventoryStatus(
    availableStock: number,
    reservedStock: number,
    lowStockThreshold: number
): InventoryStatus {
    if (availableStock <= 0 && reservedStock <= 0) {
        return InventoryStatus.OUT_OF_STOCK;
    }
    if (availableStock <= 0 && reservedStock > 0) {
        return InventoryStatus.RESERVED;
    }
    if (availableStock <= lowStockThreshold) {
        return InventoryStatus.LOW_STOCK;
    }
    return InventoryStatus.IN_STOCK;
}

export default mongoose.model<Inventory>('Inventory', InventorySchema);

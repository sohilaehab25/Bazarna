import mongoose, { Document, Schema } from 'mongoose';

export enum ProductStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

export type ProductStockHealth = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product extends Document {
  name: string;
  description: string;
  price: number;
  categoryId: mongoose.Types.ObjectId;
  imageUrl: string;
  stock: number;
  lowStockThreshold: number;
  status: ProductStatus;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  lowStockThreshold: {
    type: Number,
    min: 0,
    default: 10,
  },
  status: {
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.ACTIVE,
    index: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  seoTitle: {
    type: String,
    trim: true,
    default: '',
  },
  seoDescription: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

ProductSchema.index({ name: 1 });
ProductSchema.index({ stock: 1, status: 1 });
ProductSchema.index({ categoryId: 1, createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text' });

/** Compute stock health status from current stock and threshold */
export function computeStockHealth(stock: number, lowStockThreshold: number): ProductStockHealth {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

export default mongoose.model<Product>('Product', ProductSchema);
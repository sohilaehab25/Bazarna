import mongoose, { Document, Schema } from 'mongoose';

export interface Product extends Document {
  name: string;
  description: string;
  price: number;
  categoryId: mongoose.Types.ObjectId;
  imageUrl: string;
  stock: number;
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
}, {
  timestamps: true,
});

ProductSchema.index({ name: 1 });
ProductSchema.index({ categoryId: 1, createdAt: -1 });

export default mongoose.model<Product>('Product', ProductSchema);
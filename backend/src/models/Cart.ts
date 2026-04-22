import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface Cart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema: Schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
}, { _id: false });

const CartSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One cart per user
  },
  items: [CartItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.model<Cart>('Cart', CartSchema);
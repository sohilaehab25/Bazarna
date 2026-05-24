import mongoose, { Document, Schema } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  DELIVERED = 'delivered',
}

export enum PaymentMethod {
  CASH = 'cash',
  VISA = 'visa',
}

export interface IOrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
}

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface Order extends Document {
  userId?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  customer?: IOrderCustomer;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema = new Schema({
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

const OrderCustomerSchema: Schema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false });

const OrderSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  items: [OrderItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  },
  customer: {
    type: OrderCustomerSchema,
    required: false,
  },
}, {
  timestamps: true,
});

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });

export default mongoose.model<Order>('Order', OrderSchema);
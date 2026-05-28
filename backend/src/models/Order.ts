import mongoose, { Document, Schema } from 'mongoose';

export enum OrderStatus {
  PENDING    = 'pending',
  PAID       = 'paid',
  PROCESSING = 'processing',
  /** @deprecated legacy alias for PROCESSING — kept for backward compatibility */
  PREPARING  = 'preparing',
  SHIPPED    = 'shipped',
  DELIVERED  = 'delivered',
  CANCELLED  = 'cancelled',
  REFUNDED   = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  VISA = 'visa',
  PAYMOB = 'paymob',
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

export interface IOrderNote {
  _id: mongoose.Types.ObjectId;
  author: string;
  body: string;
  createdAt: Date;
}

/**
 * Immutable audit record appended on every status transition.
 * Never deleted — provides a full, tamper-evident trail.
 */
export interface IStatusHistoryEntry {
  _id: mongoose.Types.ObjectId;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  /** Admin email / user identifier who triggered the transition */
  performedBy: string;
  performedByRole: string;
  /** Optional human-readable reason (required for destructive transitions) */
  reason?: string;
  timestamp: Date;
}

export interface Order extends Document {
  orderNumber: number;
  userId?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  customer?: IOrderCustomer;
  notes: IOrderNote[];
  statusHistory: IStatusHistoryEntry[];
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

const OrderNoteSchema: Schema = new Schema({
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
}, { timestamps: { createdAt: true, updatedAt: false } });

const StatusHistoryEntrySchema: Schema = new Schema({
  fromStatus: {
    type: String,
    enum: Object.values(OrderStatus),
    required: true,
  },
  toStatus: {
    type: String,
    enum: Object.values(OrderStatus),
    required: true,
  },
  performedBy:     { type: String, required: true, trim: true, maxlength: 200 },
  performedByRole: { type: String, required: true, trim: true, maxlength: 50  },
  reason:          { type: String, trim: true, maxlength: 500 },
  timestamp:       { type: Date, default: Date.now },
});

const OrderSchema: Schema = new Schema({
  orderNumber: {
    type: Number,
    unique: true,
  },
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
  notes: {
    type: [OrderNoteSchema],
    default: [],
  },
  statusHistory: {
    type: [StatusHistoryEntrySchema],
    default: [],
  },
}, {
  timestamps: true,
});

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });

export default mongoose.model<Order>('Order', OrderSchema);
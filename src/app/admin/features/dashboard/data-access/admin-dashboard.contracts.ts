import { Order, Product } from '../../../../../app.type';

export interface DashboardUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
}

export interface DashboardKpis {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
}

export interface DashboardRevenuePoint {
  label: string;
  value: number;
}

export interface DashboardLatestOrderRow {
  orderId: string;
  status: string;
  paymentMethod: string;
  totalPrice: number;
  createdAt: string;
}

export interface DashboardTopSellingRow {
  product: string;
  soldUnits: number;
  revenue: number;
}

export interface DashboardLowStockRow {
  product: string;
  category: string;
  stock: number;
}

export interface DashboardRequestState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  loaded: boolean;
}

export interface DashboardApiDataset {
  orders: readonly Order[];
  products: readonly Product[];
  users: readonly DashboardUser[];
}

import OrderModel, { IStatusHistoryEntry, Order } from '../models/Order';
import { getNextSequence } from '../models/Counter';

export interface OrderPaginatedQuery {
  page: number;
  pageSize: number;
  status?: string;
  paymentMethod?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minRevenue?: number;
  maxRevenue?: number;
}

export class OrderRepository {
  async create(orderData: Partial<Order>): Promise<Order> {
    const orderNumber = await getNextSequence('orderNumber');
    const order = new OrderModel({ ...orderData, orderNumber });
    return await order.save();
  }

  async findById(id: string): Promise<Order | null> {
    return await OrderModel.findById(id).populate('userId').populate('items.productId');
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return await OrderModel.find({ userId }).populate('userId').populate('items.productId').sort({ createdAt: -1 });
  }

  async findAll(): Promise<Order[]> {
    return await OrderModel.find().populate('userId').populate('items.productId').sort({ createdAt: -1 });
  }

  async findPaginated(query: OrderPaginatedQuery): Promise<{ items: Order[]; total: number }> {
    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      filter['status'] = query.status;
    }

    if (query.paymentMethod && query.paymentMethod !== 'all') {
      filter['paymentMethod'] = query.paymentMethod;
    }

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (query.dateFrom) {
        dateFilter['$gte'] = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        dateFilter['$lte'] = to;
      }
      filter['createdAt'] = dateFilter;
    }

    if (query.minRevenue !== undefined || query.maxRevenue !== undefined) {
      const revenueFilter: Record<string, number> = {};
      if (query.minRevenue !== undefined) revenueFilter['$gte'] = query.minRevenue;
      if (query.maxRevenue !== undefined) revenueFilter['$lte'] = query.maxRevenue;
      filter['totalPrice'] = revenueFilter;
    }

    if (query.search && query.search.trim().length > 0) {
      // Escape regex metacharacters to prevent injection
      const safeSearch = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safeSearch, 'i');
      filter['$or'] = [
        { 'customer.email': regex },
        { 'customer.firstName': regex },
        { 'customer.lastName': regex },
      ];
    }

    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;
    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      OrderModel.find(filter)
        .populate('userId', 'name email')
        .populate('items.productId', 'name price')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(query.pageSize),
      OrderModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async update(id: string, orderData: Partial<Order>): Promise<Order | null> {
    return await OrderModel.findByIdAndUpdate(id, orderData, { new: true }).populate('userId').populate('items.productId');
  }

  async delete(id: string): Promise<boolean> {
    const result = await OrderModel.findByIdAndDelete(id);
    return !!result;
  }

  async addNote(id: string, note: { author: string; body: string }): Promise<Order | null> {
    return await OrderModel.findByIdAndUpdate(
      id,
      { $push: { notes: note } },
      { new: true, runValidators: true },
    )
      .populate('userId', 'name email')
      .populate('items.productId', 'name price imageUrl');
  }

  /**
   * Atomically updates the order status AND appends one immutable history entry.
   * Should only be called after `validateTransition` has already succeeded.
   */
  async updateStatusWithHistory(
    id: string,
    newStatus: Order['status'],
    historyEntry: Omit<IStatusHistoryEntry, '_id'>,
  ): Promise<Order | null> {
    return await OrderModel.findByIdAndUpdate(
      id,
      {
        $set:  { status: newStatus },
        $push: { statusHistory: historyEntry },
      },
      { new: true, runValidators: true },
    )
      .populate('userId', 'name email')
      .populate('items.productId', 'name price imageUrl');
  }
}

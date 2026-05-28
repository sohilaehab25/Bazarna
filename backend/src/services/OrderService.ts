import { OrderRepository } from '../repositories/OrderRepository';
import { Order, OrderStatus } from '../models/Order';
import { UserRole } from '../models/User';
import ProductModel from '../models/Product';
import { CartRepository } from '../repositories/CartRepository';
import { emitStockUpdate } from '../utils/socket';
import { validateTransition } from '../workflow/order-workflow.engine';
import { OrderNotificationService } from '../workflow/order-notifications.service';

// ---------------------------------------------------------------------------
// Paginated query types (exported for use in controller)
// ---------------------------------------------------------------------------

export interface OrdersPaginatedQuery {
  page: number;
  pageSize: number;
  status: string;
  paymentMethod: string;
  sortBy: string;
  sortOrder: string;
  search: string;
  dateFrom?: string;
  dateTo?: string;
  minRevenue?: number;
  maxRevenue?: number;
}

export interface OrdersPaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface OrdersPaginatedResult {
  items: Order[];
  pagination: OrdersPaginationMeta;
}



type GuestOrderItem = {
  productId: string;
  quantity: number;
};

type GuestCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
};

export class OrderService {
  private orderRepository = new OrderRepository();
  private cartRepository = new CartRepository();
  private notificationService = new OrderNotificationService();

  async checkout(userId: string, paymentMethod: any): Promise<Order> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Atomic stock deduction for all items
    const session = await ProductModel.startSession();
    const updatedProducts: Array<{ id: string; stock: number }> = [];
    try {
      session.startTransaction();

      for (const item of cart.items) {
        const product = await ProductModel.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );

        if (!product) {
          throw new Error(`Product ${item.productId} is out of stock or insufficient quantity`);
        }

        updatedProducts.push({ id: product._id.toString(), stock: product.stock });
      }

      const orderData: Partial<Order> = {
        userId: cart.userId,
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        totalPrice: cart.totalPrice,
        status: OrderStatus.PENDING,
        paymentMethod
      };

      const order = await this.orderRepository.create(orderData);
      
      // Clear cart after successful order
      await this.cartRepository.clearCart(userId);

      await session.commitTransaction();

      // Emit real-time stock updates — reuse products already returned from findOneAndUpdate
      for (const updated of updatedProducts) {
        emitStockUpdate(updated.id, updated.stock);
      }

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async checkoutGuest(items: GuestOrderItem[], paymentMethod: any, customer: GuestCustomer): Promise<Order> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Cart is empty');
    }

    const session = await ProductModel.startSession();
    const updatedProducts: Array<{ id: string; stock: number }> = [];

    try {
      session.startTransaction();

      let totalPrice = 0;
      const normalizedItems = [] as { productId: any; quantity: number }[];

      for (const item of items) {
        if (!item?.productId || !item?.quantity || item.quantity < 1) {
          throw new Error('Invalid cart item');
        }

        const product = await ProductModel.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );

        if (!product) {
          throw new Error(`Product ${item.productId} is out of stock or insufficient quantity`);
        }

        totalPrice += product.price * item.quantity;
        normalizedItems.push({ productId: product._id, quantity: item.quantity });
        updatedProducts.push({ id: product._id.toString(), stock: product.stock });
      }

      const orderData: Partial<Order> = {
        items: normalizedItems,
        totalPrice,
        status: OrderStatus.PENDING,
        paymentMethod,
        customer,
      };

      const order = await this.orderRepository.create(orderData);
      await session.commitTransaction();

      for (const product of updatedProducts) {
        emitStockUpdate(product.id, product.stock);
      }

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    return await this.orderRepository.create(orderData);
  }

  async getOrderById(id: string): Promise<Order | null> {
    return await this.orderRepository.findById(id);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await this.orderRepository.findByUserId(userId);
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.orderRepository.findAll();
  }

  async getOrdersPaginated(query: OrdersPaginatedQuery): Promise<OrdersPaginatedResult> {
    const { items, total } = await this.orderRepository.findPaginated({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      paymentMethod: query.paymentMethod,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      search: query.search,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      minRevenue: query.minRevenue,
      maxRevenue: query.maxRevenue,
    });

    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: total,
        totalPages,
        hasPreviousPage: query.page > 1,
        hasNextPage: query.page < totalPages,
      },
    };
  }

  async updateOrderStatus(
    id: string,
    newStatus: OrderStatus,
    actor: { performedBy: string; performedByRole: string; reason?: string },
  ): Promise<Order | null> {
    // 1. Fetch current order to read its status
    const current = await this.orderRepository.findById(id);
    if (!current) return null;

    // 2. Workflow validation — throws descriptive error on invalid transition
    validateTransition(current.status, newStatus, actor.performedByRole as UserRole);

    // 3. Atomic status update + immutable audit entry
    const updated = await this.orderRepository.updateStatusWithHistory(id, newStatus, {
      fromStatus:      current.status,
      toStatus:        newStatus,
      performedBy:     actor.performedBy,
      performedByRole: actor.performedByRole,
      reason:          actor.reason,
      timestamp:       new Date(),
    });

    // 4. Notification dispatch (includes real-time Socket.IO broadcast)
    //    Fully non-blocking — errors are logged internally, never propagated.
    if (updated) {
      this.notificationService.dispatch(
        {
          orderId:     id,
          fromStatus:  current.status,
          toStatus:    newStatus,
          performedBy: actor.performedBy,
          reason:      actor.reason,
          timestamp:   new Date(),
        },
        updated,
      ).catch((err: unknown) =>
        console.error('[OrderService] Notification dispatch failed:', err),
      );
    }

    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return await this.orderRepository.delete(id);
  }

  async addNote(orderId: string, body: string, author: string): Promise<Order | null> {
    const sanitizedBody = body.trim().replace(/<[^>]*>/g, '');
    if (!sanitizedBody) {
      throw new Error('Note body is required');
    }
    return await this.orderRepository.addNote(orderId, { author, body: sanitizedBody });
  }
}
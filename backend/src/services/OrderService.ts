import { OrderRepository } from '../repositories/OrderRepository';
import { Order, OrderStatus } from '../models/Order';
import ProductModel from '../models/Product';
import { CartRepository } from '../repositories/CartRepository';
import { emitStockUpdate } from '../utils/socket';

export class OrderService {
  private orderRepository = new OrderRepository();
  private cartRepository = new CartRepository();

  async checkout(userId: string, paymentMethod: any): Promise<Order> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Atomic stock deduction for all items
    const session = await ProductModel.startSession();
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

      // Emit real-time stock updates after successful transaction
      for (const item of cart.items) {
        const product = await ProductModel.findById(item.productId);
        if (product) {
          emitStockUpdate(product._id.toString(), product.stock);
        }
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

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    return await this.orderRepository.update(id, { status });
  }

  async deleteOrder(id: string): Promise<boolean> {
    return await this.orderRepository.delete(id);
  }
}
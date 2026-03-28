import { OrderRepository } from '../repositories/OrderRepository';
import { Order, OrderItem, CreateOrderDTO, UpdateOrderDTO, OrderStatus, UserRole } from '../models/Order';

export class OrderService {
  private orderRepository = new OrderRepository();

  async createOrder(orderData: CreateOrderDTO, userId: string): Promise<Order> {
    return await this.orderRepository.create(orderData, userId);
  }

  async getOrderById(id: string, requestingUserId: string, requestingUserRole: UserRole): Promise<Order | null> {
    const order = await this.orderRepository.findById(id);
    if (!order) return null;

    // Users can see their own orders, admins can see all
    if (order.userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Unauthorized to view this order');
    }

    return order;
  }

  async getUserOrders(userId: string, requestingUserId: string, requestingUserRole: UserRole): Promise<Order[]> {
    // Users can see their own orders, admins can see all
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Unauthorized to view these orders');
    }

    return await this.orderRepository.findByUserId(userId);
  }

  async getAllOrders(requestingUserRole: UserRole): Promise<Order[]> {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Only admins can view all orders');
    }

    return await this.orderRepository.findAll();
  }

  async updateOrderStatus(id: string, status: OrderStatus, requestingUserRole: UserRole): Promise<Order | null> {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Only admins can update order status');
    }

    return await this.orderRepository.update(id, { status });
  }

  async getOrderItems(orderId: string, requestingUserId: string, requestingUserRole: UserRole): Promise<OrderItem[]> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Users can see their own order items, admins can see all
    if (order.userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Unauthorized to view these order items');
    }

    return await this.orderRepository.getOrderItems(orderId);
  }
}
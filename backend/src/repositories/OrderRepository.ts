import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../config/dataSource';
import { OrderEntity, OrderStatus } from '../models/OrderEntity';
import { OrderItemEntity } from '../models/OrderItemEntity';
import { Order, OrderItem, CreateOrderDTO, UpdateOrderDTO } from '../models/Order';

export class OrderRepository {
  private orderRepository: Repository<OrderEntity> = AppDataSource.getRepository(OrderEntity);
  private orderItemRepository: Repository<OrderItemEntity> = AppDataSource.getRepository(OrderItemEntity);
  private dataSource: DataSource = AppDataSource;

  async create(orderData: CreateOrderDTO, userId: string): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Calculate total amount
      let totalAmount = 0;
      for (const item of orderData.items) {
        const product = await queryRunner.manager.findOne(OrderItemEntity, {
          where: { id: item.productId },
          relations: ['product'],
        });
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        // Note: This is simplified - in real app, get product price from ProductEntity
        // For now, assume price is passed or fetched properly
        totalAmount += 10 * item.quantity; // Placeholder
      }

      // Create order
      const order = queryRunner.manager.create(OrderEntity, {
        userId,
        totalAmount,
        status: OrderStatus.PENDING,
        shippingAddress: orderData.shippingAddress,
      });
      const savedOrder = await queryRunner.manager.save(OrderEntity, order);

      // Create order items
      for (const item of orderData.items) {
        const orderItem = queryRunner.manager.create(OrderItemEntity, {
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: 10, // Placeholder - should get from product
        });
        await queryRunner.manager.save(OrderItemEntity, orderItem);
      }

      await queryRunner.commitTransaction();
      return this.mapEntityToOrder(savedOrder);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    return order ? this.mapEntityToOrder(order) : null;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return orders.map(this.mapEntityToOrder);
  }

  async findAll(): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return orders.map(this.mapEntityToOrder);
  }

  async update(id: string, orderData: UpdateOrderDTO): Promise<Order | null> {
    const updateData: Partial<OrderEntity> = {};

    if (orderData.status !== undefined) updateData.status = orderData.status;
    if (orderData.shippingAddress !== undefined) updateData.shippingAddress = orderData.shippingAddress;

    if (Object.keys(updateData).length === 0) return null;

    updateData.updatedAt = new Date();

    await this.orderRepository.update(id, updateData);
    const updatedOrder = await this.orderRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    return updatedOrder ? this.mapEntityToOrder(updatedOrder) : null;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const orderItems = await this.orderItemRepository.find({
      where: { orderId },
      relations: ['product'],
    });
    return orderItems.map(item => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));
  }

  private mapEntityToOrder(entity: OrderEntity): Order {
    return {
      id: entity.id,
      userId: entity.userId,
      totalAmount: entity.totalAmount,
      status: entity.status,
      shippingAddress: entity.shippingAddress,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
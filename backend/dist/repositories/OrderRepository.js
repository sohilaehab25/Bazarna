"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
const dataSource_1 = require("../config/dataSource");
const OrderEntity_1 = require("../models/OrderEntity");
const OrderItemEntity_1 = require("../models/OrderItemEntity");
class OrderRepository {
    constructor() {
        this.orderRepository = dataSource_1.AppDataSource.getRepository(OrderEntity_1.OrderEntity);
        this.orderItemRepository = dataSource_1.AppDataSource.getRepository(OrderItemEntity_1.OrderItemEntity);
        this.dataSource = dataSource_1.AppDataSource;
    }
    async create(orderData, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Calculate total amount
            let totalAmount = 0;
            for (const item of orderData.items) {
                const product = await queryRunner.manager.findOne(OrderItemEntity_1.OrderItemEntity, {
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
            const order = queryRunner.manager.create(OrderEntity_1.OrderEntity, {
                userId,
                totalAmount,
                status: OrderEntity_1.OrderStatus.PENDING,
                shippingAddress: orderData.shippingAddress,
            });
            const savedOrder = await queryRunner.manager.save(OrderEntity_1.OrderEntity, order);
            // Create order items
            for (const item of orderData.items) {
                const orderItem = queryRunner.manager.create(OrderItemEntity_1.OrderItemEntity, {
                    orderId: savedOrder.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: 10, // Placeholder - should get from product
                });
                await queryRunner.manager.save(OrderItemEntity_1.OrderItemEntity, orderItem);
            }
            await queryRunner.commitTransaction();
            return this.mapEntityToOrder(savedOrder);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findById(id) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        return order ? this.mapEntityToOrder(order) : null;
    }
    async findByUserId(userId) {
        const orders = await this.orderRepository.find({
            where: { userId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
        return orders.map(this.mapEntityToOrder);
    }
    async findAll() {
        const orders = await this.orderRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
        return orders.map(this.mapEntityToOrder);
    }
    async update(id, orderData) {
        const updateData = {};
        if (orderData.status !== undefined)
            updateData.status = orderData.status;
        if (orderData.shippingAddress !== undefined)
            updateData.shippingAddress = orderData.shippingAddress;
        if (Object.keys(updateData).length === 0)
            return null;
        updateData.updatedAt = new Date();
        await this.orderRepository.update(id, updateData);
        const updatedOrder = await this.orderRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        return updatedOrder ? this.mapEntityToOrder(updatedOrder) : null;
    }
    async getOrderItems(orderId) {
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
    mapEntityToOrder(entity) {
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
exports.OrderRepository = OrderRepository;

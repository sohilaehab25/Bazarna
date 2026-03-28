"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const OrderRepository_1 = require("../repositories/OrderRepository");
const Order_1 = require("../models/Order");
class OrderService {
    constructor() {
        this.orderRepository = new OrderRepository_1.OrderRepository();
    }
    async createOrder(orderData, userId) {
        return await this.orderRepository.create(orderData, userId);
    }
    async getOrderById(id, requestingUserId, requestingUserRole) {
        const order = await this.orderRepository.findById(id);
        if (!order)
            return null;
        // Users can see their own orders, admins can see all
        if (order.userId !== requestingUserId && requestingUserRole !== Order_1.UserRole.ADMIN) {
            throw new Error('Unauthorized to view this order');
        }
        return order;
    }
    async getUserOrders(userId, requestingUserId, requestingUserRole) {
        // Users can see their own orders, admins can see all
        if (userId !== requestingUserId && requestingUserRole !== Order_1.UserRole.ADMIN) {
            throw new Error('Unauthorized to view these orders');
        }
        return await this.orderRepository.findByUserId(userId);
    }
    async getAllOrders(requestingUserRole) {
        if (requestingUserRole !== Order_1.UserRole.ADMIN) {
            throw new Error('Only admins can view all orders');
        }
        return await this.orderRepository.findAll();
    }
    async updateOrderStatus(id, status, requestingUserRole) {
        if (requestingUserRole !== Order_1.UserRole.ADMIN) {
            throw new Error('Only admins can update order status');
        }
        return await this.orderRepository.update(id, { status });
    }
    async getOrderItems(orderId, requestingUserId, requestingUserRole) {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        // Users can see their own order items, admins can see all
        if (order.userId !== requestingUserId && requestingUserRole !== Order_1.UserRole.ADMIN) {
            throw new Error('Unauthorized to view these order items');
        }
        return await this.orderRepository.getOrderItems(orderId);
    }
}
exports.OrderService = OrderService;

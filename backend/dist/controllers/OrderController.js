"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const OrderService_1 = require("../../services/OrderService");
const orderService = new OrderService_1.OrderService();
class OrderController {
    async createOrder(req, res) {
        try {
            const order = await orderService.createOrder(req.body, req.user.userId);
            res.status(201).json(order);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async getOrder(req, res) {
        try {
            const order = await orderService.getOrderById(req.params.id, req.user.userId, req.user.role);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json(order);
        }
        catch (error) {
            res.status(403).json({ message: error.message });
        }
    }
    async getUserOrders(req, res) {
        try {
            const orders = await orderService.getUserOrders(req.user.userId, req.user.userId, req.user.role);
            res.json(orders);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async getAllOrders(req, res) {
        try {
            const orders = await orderService.getAllOrders(req.user.role);
            res.json(orders);
        }
        catch (error) {
            res.status(403).json({ message: error.message });
        }
    }
    async updateOrderStatus(req, res) {
        try {
            const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user.role);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json(order);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async getOrderItems(req, res) {
        try {
            const items = await orderService.getOrderItems(req.params.id, req.user.userId, req.user.role);
            res.json(items);
        }
        catch (error) {
            res.status(403).json({ message: error.message });
        }
    }
}
exports.OrderController = OrderController;

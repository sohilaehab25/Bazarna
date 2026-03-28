import { Response } from 'express';
import { OrderService } from '../../services/OrderService';
import { AuthRequest } from '../../middlewares/auth';

const orderService = new OrderService();

export class OrderController {
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.createOrder(req.body, req.user!.userId);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getOrder(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.getOrderById(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(order);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getUserOrders(req: AuthRequest, res: Response) {
    try {
      const orders = await orderService.getUserOrders(
        req.user!.userId,
        req.user!.userId,
        req.user!.role
      );

      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getAllOrders(req: AuthRequest, res: Response) {
    try {
      const orders = await orderService.getAllOrders(req.user!.role);
      res.json(orders);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async updateOrderStatus(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.user!.role
      );

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getOrderItems(req: AuthRequest, res: Response) {
    try {
      const items = await orderService.getOrderItems(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );

      res.json(items);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }
}
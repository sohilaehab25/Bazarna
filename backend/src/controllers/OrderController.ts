import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { OrderService } from '../services/OrderService';

const orderService = new OrderService();

export class OrderController {
  async checkout(req: Request, res: Response) {
    try {
      const userId = (req.user as any)._id.toString();
      const { paymentMethod } = req.body;
      const order = await orderService.checkout(userId, paymentMethod);
      res.apiSuccess('Order placed successfully', order, 201);
    } catch (error: any) {
      res.apiError(error.message, 400);
    }
  }

  async createOrder(req: Request, res: Response) {
    try {
      const order = await orderService.createOrder(req.body);
      res.apiSuccess('Order created successfully', order, 201);
    } catch (error: any) {
      res.apiError(error.message, 400);
    }
  }

  async getOrder(req: Request, res: Response) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      if (!order) {
        return res.apiError('Order not found', 404);
      }

      res.apiSuccess('Order retrieved successfully', order);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async getUserOrders(req: Request, res: Response) {
    try {
      const orders = await orderService.getUserOrders((req.user as any)._id.toString());
      res.apiSuccess('Orders retrieved successfully', orders);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async getAllOrders(req: Request, res: Response) {
    try {
      const orders = await orderService.getAllOrders();
      res.apiSuccess('All orders retrieved successfully', orders);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async getOrderItems(req: Request, res: Response) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      if (!order) {
        return res.apiError('Order not found', 404);
      }

      res.apiSuccess('Order items retrieved successfully', order.items);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async updateOrderStatus(req: Request, res: Response) {
    try {
      const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
      if (!order) {
        return res.apiError('Order not found', 404);
      }

      res.apiSuccess('Order status updated successfully', order);
    } catch (error: any) {
      res.apiError(error.message, 400);
    }
  }
}
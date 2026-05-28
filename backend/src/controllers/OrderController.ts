import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { OrderService, OrdersPaginatedQuery } from '../services/OrderService';
import { isValidStatus, WorkflowValidationError } from '../workflow/order-workflow.engine';

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

  async guestCheckout(req: Request, res: Response) {
    try {
      const { items, paymentMethod, customer } = req.body;

      if (!customer?.firstName || !customer?.lastName || !customer?.email || !customer?.address || !customer?.city) {
        return res.apiError('Customer details are required', 400);
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.apiError('Cart is empty', 400);
      }

      const order = await orderService.checkoutGuest(items, paymentMethod, customer);
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
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.apiError('Invalid order ID', 400);
      }

      const order = await orderService.getOrderById(id);
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

  async getAdminOrders(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10) || 1);
      const pageSize = Math.min(
        100,
        Math.max(1, parseInt(String(req.query['pageSize'] ?? '20'), 10) || 20),
      );

      const parseRevenue = (raw: unknown): number | undefined => {
        if (raw === undefined || raw === null || String(raw).trim() === '') return undefined;
        const n = Number(raw);
        return Number.isFinite(n) && n >= 0 ? n : undefined;
      };

      const query: OrdersPaginatedQuery = {
        page,
        pageSize,
        status: String(req.query['status'] ?? 'all'),
        paymentMethod: String(req.query['paymentMethod'] ?? 'all'),
        sortBy: String(req.query['sortBy'] ?? 'createdAt'),
        sortOrder: String(req.query['sortOrder'] ?? 'desc'),
        search: String(req.query['search'] ?? ''),
        dateFrom: req.query['dateFrom'] ? String(req.query['dateFrom']) : undefined,
        dateTo: req.query['dateTo'] ? String(req.query['dateTo']) : undefined,
        minRevenue: parseRevenue(req.query['minRevenue']),
        maxRevenue: parseRevenue(req.query['maxRevenue']),
      };

      const result = await orderService.getOrdersPaginated(query);
      res.apiSuccess('Orders retrieved successfully', result);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async getOrderItems(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.apiError('Invalid order ID', 400);
      }

      const order = await orderService.getOrderById(id);
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
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.apiError('Invalid order ID', 400);
      }

      const newStatus = req.body?.status;
      if (!isValidStatus(newStatus)) {
        return res.apiError('Invalid or missing status value', 400);
      }

      // Optional reason — sanitised and capped
      const reason = req.body?.reason
        ? String(req.body.reason).trim().replace(/<[^>]*>/g, '').slice(0, 500) || undefined
        : undefined;

      const actor = {
        performedBy:     (req.user as any)?.email ?? (req.user as any)?.name ?? 'admin',
        performedByRole: (req.user as any)?.role  ?? 'admin',
        reason,
      };

      const order = await orderService.updateOrderStatus(id, newStatus, actor);

      if (!order) {
        return res.apiError('Order not found', 404);
      }

      res.apiSuccess('Order status updated successfully', order);
    } catch (error: any) {
      // Workflow validation errors are 422; unexpected errors are 500
      const status = error instanceof WorkflowValidationError ? 422 : 500;
      res.apiError(error.message, status);
    }
  }

  async addOrderNote(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.apiError('Invalid order ID', 400);
      }

      const body = String(req.body?.body ?? '').trim();
      if (!body) {
        return res.apiError('Note body is required', 400);
      }

      if (body.length > 1000) {
        return res.apiError('Note body must be 1000 characters or fewer', 400);
      }

      const author: string = (req.user as any)?.email ?? (req.user as any)?.name ?? 'Admin';
      const order = await orderService.addNote(id, body, author);

      if (!order) {
        return res.apiError('Order not found', 404);
      }

      res.apiSuccess('Note added successfully', order);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }
}
import { Request, Response } from 'express';
import { CartService } from '../services/CartService';

const cartService = new CartService();

export class CartController {
  async getCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const cart = await cartService.getCart(userId);
      res.apiSuccess('Cart retrieved successfully', cart);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async addToCart(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { productId, quantity = 1 } = req.body;
      console.log(`Adding to cart: User ${userId}, Product ${productId}, Quantity ${quantity}`);

      if (!productId) {
        return res.apiError('Product ID is required', 400);
      }

      const cart = await cartService.addToCart(userId, productId, quantity);
      res.apiSuccess('Item added to cart', cart);
    } catch (error: any) {
      res.apiError(error.message, 400);
    }
  }

  async updateQuantity(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { productId, quantity } = req.body;

      if (!productId || quantity === undefined) {
        return res.apiError('Product ID and quantity are required', 400);
      }

      const cart = await cartService.updateQuantity(userId, productId, quantity);
      res.apiSuccess('Cart updated', cart);
    } catch (error: any) {
      res.apiError(error.message, 400);
    }
  }

  async removeProduct(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { productId } = req.params;

      if (!productId) {
        return res.apiError('Product ID is required', 400);
      }

      const cart = await cartService.removeItem(userId, productId);
      res.apiSuccess('Item removed from cart', cart);
    } catch (error: any) {
      res.apiError(error.message, 400);
    }
  }
}

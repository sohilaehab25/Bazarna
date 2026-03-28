import { Response } from 'express';
import { ProductService } from '../../services/ProductService';
import { AuthRequest } from '../../middlewares/auth';
import { UserRole } from '../../models/User';

const productService = new ProductService();

export class ProductController {
  async getAllProducts(req: AuthRequest, res: Response) {
    try {
      const { limit = 20, offset = 0, categoryId } = req.query;
      const products = await productService.getAllProducts(
        parseInt(limit as string),
        parseInt(offset as string),
        categoryId as string
      );

      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getProduct(req: AuthRequest, res: Response) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async createProduct(req: AuthRequest, res: Response) {
    try {
      const product = await productService.createProduct(req.body, req.user!.userId);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const product = await productService.updateProduct(
        req.params.id,
        req.body,
        req.user!.userId,
        req.user!.role
      );

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const deleted = await productService.deleteProduct(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );

      if (!deleted) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getStoreProducts(req: AuthRequest, res: Response) {
    try {
      const products = await productService.getProductsByStoreOwner(
        req.params.storeOwnerId,
        req.user!.userId,
        req.user!.role
      );

      res.json(products);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }
}
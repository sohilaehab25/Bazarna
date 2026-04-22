import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProductService } from '../services/ProductService';
import { CreateProductDTO, UpdateProductDTO } from '../dtos/ProductDTOs';
import { validateDTO } from '../utils/validation';

const productService = new ProductService();

export class ProductController {
  async getAllProducts(req: Request, res: Response) {
    try {
      const { limit = 20, offset = 0, categoryId } = req.query;
      const products = await productService.getAllProducts(
        parseInt(limit as string),
        parseInt(offset as string),
        categoryId as string
      );

      res.apiSuccess('Products retrieved successfully', products);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async getProduct(req: Request, res: Response) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        return res.apiError('Product not found', 404);
      }

      res.apiSuccess('Product retrieved successfully', product);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      const createData: CreateProductDTO = req.body;
      await validateDTO(createData, CreateProductDTO);

      const productData = {
        ...createData,
        categoryId: new mongoose.Types.ObjectId(createData.categoryId)
      };

      const product = await productService.createProduct(productData);
      res.apiSuccess('Product created successfully', product, 201);
    } catch (error: any) {
      res.apiError(error.message, 400);
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const updateData: UpdateProductDTO = req.body;
      await validateDTO(updateData, UpdateProductDTO);

      const productData: any = { ...updateData };
      if (updateData.categoryId) {
        productData.categoryId = new mongoose.Types.ObjectId(updateData.categoryId);
      }

      const product = await productService.updateProduct(req.params.id, productData);
      if (!product) {
        return res.apiError('Product not found', 404);
      }

      res.apiSuccess('Product updated successfully', product);
    } catch (error: any) {
      res.apiError(error.message, 400);
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const deleted = await productService.deleteProduct(req.params.id);
      if (!deleted) {
        return res.apiError('Product not found', 404);
      }

      res.apiSuccess('Product deleted successfully');
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }
}
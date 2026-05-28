import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProductService } from '../services/ProductService';
import {
  BulkProductActionDTO,
  CreateProductDTO,
  UpdateProductDTO,
} from '../dtos/ProductDTOs';
import { validateDTO } from '../utils/validation';
import { Product, ProductStatus, computeStockHealth } from '../models/Product';
import {
  AdminProductListQuery,
  AdminProductSortBy,
  AdminProductSortOrder,
  AdminProductStockState,
} from '../repositories/ProductRepository';
import { InventoryService } from '../services/InventoryService';

const productService = new ProductService();
const inventoryService = new InventoryService();

export class ProductController {
  async getAllProducts(req: Request, res: Response) {
    try {
      const limit = this.toPositiveInteger(req.query.limit, 20);
      const offset = this.toPositiveInteger(req.query.offset, 0, true);
      const categoryId = this.toOptionalString(req.query.categoryId);

      const products = await productService.getAllProducts(
        limit,
        offset,
        categoryId ?? undefined
      );

      res.apiSuccess('Products retrieved successfully', products);
    } catch (error: unknown) {
      res.apiError(this.getErrorMessage(error), 500);
    }
  }

  async getAdminProducts(req: Request, res: Response) {
    try {
      const query: AdminProductListQuery = {
        page: this.toPositiveInteger(req.query.page, 1),
        pageSize: Math.min(this.toPositiveInteger(req.query.pageSize, 12), 100),
        search: this.toOptionalString(req.query.search) ?? undefined,
        categoryId: this.toOptionalString(req.query.categoryId) ?? undefined,
        status: this.parseStatus(req.query.status),
        stockState: this.parseStockState(req.query.stockState),
        sortBy: this.parseSortBy(req.query.sortBy),
        sortOrder: this.parseSortOrder(req.query.sortOrder),
      };

      const products = await productService.getAdminProducts(query);
      res.apiSuccess('Admin products retrieved successfully', products);
    } catch (error: unknown) {
      res.apiError(this.getErrorMessage(error), 500);
    }
  }

  async getProduct(req: Request, res: Response) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        return res.apiError('Product not found', 404);
      }

      res.apiSuccess('Product retrieved successfully', product);
    } catch (error: unknown) {
      res.apiError(this.getErrorMessage(error), 500);
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      const createData: CreateProductDTO = req.body;
      await validateDTO(createData, CreateProductDTO);

      const productData: Partial<Product> = {
        name: createData.name,
        description: createData.description,
        price: createData.price,
        categoryId: new mongoose.Types.ObjectId(createData.categoryId),
        imageUrl: createData.imageUrl,
        stock: createData.stock,
        lowStockThreshold: createData.lowStockThreshold ?? 10,
        status: createData.status ?? ProductStatus.ACTIVE,
        tags: createData.tags ?? [],
        seoTitle: createData.seoTitle ?? '',
        seoDescription: createData.seoDescription ?? '',
      };

      const product = await productService.createProduct(productData);

      // Sync inventory: create initial inventory record if stock > 0
      if (createData.stock > 0) {
        const performedBy = (req as any).user?._id?.toString() || 'system';
        try {
          await inventoryService.restock({
            productId: product._id.toString(),
            quantity: createData.stock,
            warehouseId: 'default',
            reason: 'Initial stock on product creation',
            performedBy,
          });
        } catch {
          // Inventory sync is best-effort; product was already created
        }
      }

      const populated = await productService.getProductById(product._id.toString());
      res.apiSuccess('Product created successfully', populated, 201);
    } catch (error: unknown) {
      res.apiError(this.getErrorMessage(error), 400);
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const updateData: UpdateProductDTO = req.body;
      await validateDTO(updateData, UpdateProductDTO);

      const productData: Partial<Product> = {};

      if (updateData.name !== undefined) productData.name = updateData.name;
      if (updateData.description !== undefined) productData.description = updateData.description;
      if (updateData.price !== undefined) productData.price = updateData.price;
      if (updateData.imageUrl !== undefined) productData.imageUrl = updateData.imageUrl;
      if (updateData.stock !== undefined) productData.stock = updateData.stock;
      if (updateData.lowStockThreshold !== undefined) productData.lowStockThreshold = updateData.lowStockThreshold;
      if (updateData.status !== undefined) productData.status = updateData.status;
      if (updateData.tags !== undefined) productData.tags = updateData.tags;
      if (updateData.seoTitle !== undefined) productData.seoTitle = updateData.seoTitle;
      if (updateData.seoDescription !== undefined) productData.seoDescription = updateData.seoDescription;

      if (updateData.categoryId) {
        productData.categoryId = new mongoose.Types.ObjectId(updateData.categoryId);
      }

      const product = await productService.updateProduct(req.params.id, productData);
      if (!product) {
        return res.apiError('Product not found', 404);
      }

      // Sync inventory when stock is explicitly changed
      if (updateData.stock !== undefined) {
        const performedBy = (req as any).user?._id?.toString() || 'system';
        try {
          await inventoryService.adjust({
            productId: req.params.id,
            newAvailableStock: updateData.stock,
            warehouseId: 'default',
            reason: 'Stock adjusted via product update',
            performedBy,
          });
        } catch {
          // Best-effort sync
        }
      }

      res.apiSuccess('Product updated successfully', product);
    } catch (error: unknown) {
      res.apiError(this.getErrorMessage(error), 400);
    }
  }

  async bulkAction(req: Request, res: Response) {
    try {
      const payload: BulkProductActionDTO = req.body;
      await validateDTO(payload, BulkProductActionDTO);

      const result = await productService.runBulkAction(payload.action, payload.productIds);
      res.apiSuccess('Product bulk action completed successfully', result);
    } catch (error: unknown) {
      res.apiError(this.getErrorMessage(error), 400);
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const deleted = await productService.deleteProduct(req.params.id);
      if (!deleted) {
        return res.apiError('Product not found', 404);
      }

      res.apiSuccess('Product deleted successfully');
    } catch (error: unknown) {
      res.apiError(this.getErrorMessage(error), 500);
    }
  }

  private parseSortBy(value: unknown): AdminProductSortBy {
    const rawValue = this.toOptionalString(value);
    const allowedValues: readonly AdminProductSortBy[] = [
      'createdAt',
      'updatedAt',
      'name',
      'price',
      'stock',
      'status',
    ];

    if (rawValue && allowedValues.includes(rawValue as AdminProductSortBy)) {
      return rawValue as AdminProductSortBy;
    }

    return 'updatedAt';
  }

  private parseSortOrder(value: unknown): AdminProductSortOrder {
    const rawValue = this.toOptionalString(value);

    if (rawValue === 'asc' || rawValue === 'desc') {
      return rawValue;
    }

    return 'desc';
  }

  private parseStockState(value: unknown): AdminProductStockState {
    const rawValue = this.toOptionalString(value);
    const allowedValues: readonly AdminProductStockState[] = [
      'all',
      'in-stock',
      'low-stock',
      'out-of-stock',
    ];

    if (rawValue && allowedValues.includes(rawValue as AdminProductStockState)) {
      return rawValue as AdminProductStockState;
    }

    return 'all';
  }

  private parseStatus(value: unknown): ProductStatus | 'all' {
    const rawValue = this.toOptionalString(value);

    if (!rawValue || rawValue === 'all') {
      return 'all';
    }

    if (Object.values(ProductStatus).includes(rawValue as ProductStatus)) {
      return rawValue as ProductStatus;
    }

    return 'all';
  }

  private toPositiveInteger(value: unknown, fallback: number, allowZero = false): number {
    const stringValue = this.toOptionalString(value);
    if (!stringValue) {
      return fallback;
    }

    const parsed = Number.parseInt(stringValue, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    if (allowZero && parsed === 0) {
      return 0;
    }

    return parsed > 0 ? parsed : fallback;
  }

  private toOptionalString(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === 'string') {
        const trimmed = first.trim();
        return trimmed.length > 0 ? trimmed : null;
      }
    }

    return null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unexpected error occurred';
  }
}
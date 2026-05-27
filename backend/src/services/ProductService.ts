import { ProductRepository } from '../repositories/ProductRepository';
import { Product, ProductStatus } from '../models/Product';
import {
  AdminProductListQuery,
  AdminProductSortBy,
  AdminProductSortOrder,
  AdminProductStockState,
} from '../repositories/ProductRepository';
import { ProductBulkAction } from '../dtos/ProductDTOs';

export interface AdminProductListResponse {
  items: Product[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  appliedFilters: {
    search: string;
    categoryId: string | null;
    status: ProductStatus | 'all';
    stockState: AdminProductStockState;
    sortBy: AdminProductSortBy;
    sortOrder: AdminProductSortOrder;
  };
}

export interface ProductBulkActionResponse {
  matchedCount: number;
  modifiedCount: number;
  deletedCount: number;
}

export class ProductService {
  private productRepository = new ProductRepository();

  async createProduct(productData: Partial<Product>): Promise<Product> {
    return await this.productRepository.create(productData);
  }

  async getProductById(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id);
  }

  async getAllProducts(limit: number = 20, offset: number = 0, categoryId?: string): Promise<Product[]> {
    return await this.productRepository.findAll(limit, offset, categoryId);
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
    return await this.productRepository.update(id, productData);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return await this.productRepository.delete(id);
  }

  async getAdminProducts(query: AdminProductListQuery): Promise<AdminProductListResponse> {
    const result = await this.productRepository.findAdminProducts(query);
    const totalPages = Math.max(Math.ceil(result.totalItems / query.pageSize), 1);

    return {
      items: result.items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: result.totalItems,
        totalPages,
        hasPreviousPage: query.page > 1,
        hasNextPage: query.page < totalPages,
      },
      appliedFilters: {
        search: query.search ?? '',
        categoryId: query.categoryId ?? null,
        status: query.status ?? 'all',
        stockState: query.stockState ?? 'all',
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    };
  }

  async runBulkAction(
    action: ProductBulkAction,
    productIds: readonly string[]
  ): Promise<ProductBulkActionResponse> {
    switch (action) {
      case ProductBulkAction.ACTIVATE: {
        const updateResult = await this.productRepository.bulkSetStatus(productIds, ProductStatus.ACTIVE);
        return {
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount,
          deletedCount: 0,
        };
      }
      case ProductBulkAction.MARK_DRAFT: {
        const updateResult = await this.productRepository.bulkSetStatus(productIds, ProductStatus.DRAFT);
        return {
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount,
          deletedCount: 0,
        };
      }
      case ProductBulkAction.ARCHIVE: {
        const updateResult = await this.productRepository.bulkSetStatus(productIds, ProductStatus.ARCHIVED);
        return {
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount,
          deletedCount: 0,
        };
      }
      case ProductBulkAction.DELETE: {
        const deletedCount = await this.productRepository.bulkDelete(productIds);
        return {
          matchedCount: deletedCount,
          modifiedCount: 0,
          deletedCount,
        };
      }
      default:
        return {
          matchedCount: 0,
          modifiedCount: 0,
          deletedCount: 0,
        };
    }
  }
}
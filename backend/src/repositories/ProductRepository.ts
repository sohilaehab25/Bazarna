import { FilterQuery, SortOrder } from 'mongoose';
import ProductModel, { Product, ProductStatus } from '../models/Product';

export type AdminProductSortBy = 'name' | 'price' | 'stock' | 'status' | 'createdAt' | 'updatedAt';
export type AdminProductSortOrder = 'asc' | 'desc';
export type AdminProductStockState = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

export interface AdminProductListQuery {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  status?: ProductStatus | 'all';
  stockState?: AdminProductStockState;
  sortBy: AdminProductSortBy;
  sortOrder: AdminProductSortOrder;
}

export interface AdminProductListResult {
  items: Product[];
  totalItems: number;
}

export class ProductRepository {
  async create(productData: Partial<Product>): Promise<Product> {
    const product = new ProductModel(productData);
    return await product.save();
  }

  async findById(id: string): Promise<Product | null> {
    return await ProductModel.findById(id).populate('categoryId');
  }

  async findAll(limit: number = 20, offset: number = 0, categoryId?: string): Promise<Product[]> {
    const query: FilterQuery<Product> = {};
    if (categoryId) {
      query.categoryId = categoryId as unknown as Product['categoryId'];
    }

    return await ProductModel.find(query)
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  async update(id: string, productData: Partial<Product>): Promise<Product | null> {
    return await ProductModel.findByIdAndUpdate(id, productData, { new: true }).populate('categoryId');
  }

  async findAdminProducts(queryOptions: AdminProductListQuery): Promise<AdminProductListResult> {
    const query = this.buildAdminQuery(queryOptions);
    const skip = (queryOptions.page - 1) * queryOptions.pageSize;
    const sort = this.buildAdminSort(queryOptions.sortBy, queryOptions.sortOrder);

    const [items, totalItems] = await Promise.all([
      ProductModel.find(query)
        .populate('categoryId')
        .sort(sort)
        .skip(skip)
        .limit(queryOptions.pageSize),
      ProductModel.countDocuments(query),
    ]);

    return {
      items,
      totalItems,
    };
  }

  async bulkSetStatus(
    productIds: readonly string[],
    status: ProductStatus
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const result = await ProductModel.updateMany(
      {
        _id: { $in: productIds },
      },
      {
        $set: { status },
      }
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  async bulkDelete(productIds: readonly string[]): Promise<number> {
    const result = await ProductModel.deleteMany({
      _id: { $in: productIds },
    });

    return result.deletedCount ?? 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id);
    return !!result;
  }

  async findByStoreOwner(storeOwnerId: string): Promise<Product[]> {
    // Since we removed storeOwnerId, return all products
    return await ProductModel.find().populate('categoryId');
  }

  private buildAdminQuery(queryOptions: AdminProductListQuery): FilterQuery<Product> {
    const filters: FilterQuery<Product>[] = [];

    if (queryOptions.categoryId) {
      filters.push({ categoryId: queryOptions.categoryId as unknown as Product['categoryId'] });
    }

    if (queryOptions.search) {
      const escaped = this.escapeRegExp(queryOptions.search.trim());
      if (escaped.length > 0) {
        filters.push({
          $or: [
            { name: { $regex: escaped, $options: 'i' } },
            { description: { $regex: escaped, $options: 'i' } },
          ],
        });
      }
    }

    if (queryOptions.status && queryOptions.status !== 'all') {
      if (queryOptions.status === ProductStatus.ACTIVE) {
        filters.push({
          $or: [
            { status: ProductStatus.ACTIVE },
            { status: { $exists: false } },
          ],
        });
      } else {
        filters.push({ status: queryOptions.status });
      }
    }

    switch (queryOptions.stockState) {
      case 'out-of-stock':
        filters.push({ stock: { $lte: 0 } });
        break;
      case 'low-stock':
        filters.push({ stock: { $gt: 0, $lte: 5 } });
        break;
      case 'in-stock':
        filters.push({ stock: { $gt: 5 } });
        break;
      default:
        break;
    }

    if (filters.length === 0) {
      return {};
    }

    if (filters.length === 1) {
      return filters[0];
    }

    return { $and: filters };
  }

  private buildAdminSort(
    sortBy: AdminProductSortBy,
    sortOrder: AdminProductSortOrder
  ): Record<string, SortOrder> {
    const sortFieldMap: Record<AdminProductSortBy, string> = {
      name: 'name',
      price: 'price',
      stock: 'stock',
      status: 'status',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };

    return {
      [sortFieldMap[sortBy]]: sortOrder === 'asc' ? 1 : -1,
    };
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
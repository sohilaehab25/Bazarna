import { FilterQuery, SortOrder } from 'mongoose';
import CategoryModel, { Category } from '../models/Category';

export type AdminCategorySortBy = 'name' | 'createdAt' | 'updatedAt';
export type AdminCategorySortOrder = 'asc' | 'desc';

export interface AdminCategoryListQuery {
  page: number;
  pageSize: number;
  search?: string;
  featured?: boolean;
  sortBy: AdminCategorySortBy;
  sortOrder: AdminCategorySortOrder;
}

export interface AdminCategoryListResult {
  items: Category[];
  totalItems: number;
}

export class CategoryRepository {
  async create(categoryData: Partial<Category>): Promise<Category> {
    const category = new CategoryModel(categoryData);
    return await category.save();
  }

  async findById(id: string): Promise<Category | null> {
    return await CategoryModel.findById(id);
  }

  async findAll(): Promise<Category[]> {
    return await CategoryModel.find().sort({ name: 'asc' });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return await CategoryModel.findOne({ slug });
  }

  async update(id: string, categoryData: Partial<Category>): Promise<Category | null> {
    return await CategoryModel.findByIdAndUpdate(id, categoryData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await CategoryModel.findByIdAndDelete(id);
    return !!result;
  }

  async findAdminCategories(queryOptions: AdminCategoryListQuery): Promise<AdminCategoryListResult> {
    const query = this.buildAdminQuery(queryOptions);
    const skip = (queryOptions.page - 1) * queryOptions.pageSize;
    const sort = this.buildAdminSort(queryOptions.sortBy, queryOptions.sortOrder);

    const [items, totalItems] = await Promise.all([
      CategoryModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(queryOptions.pageSize),
      CategoryModel.countDocuments(query),
    ]);

    return { items, totalItems };
  }

  async countProductsPerCategory(): Promise<Map<string, number>> {
    const ProductModel = (await import('../models/Product')).default;
    const counts = await ProductModel.aggregate([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);
    const map = new Map<string, number>();
    for (const { _id, count } of counts) {
      map.set(_id.toString(), count);
    }
    return map;
  }

  private buildAdminQuery(queryOptions: AdminCategoryListQuery): FilterQuery<Category> {
    const filters: FilterQuery<Category>[] = [];

    if (queryOptions.search) {
      const escaped = queryOptions.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escaped.length > 0) {
        filters.push({
          $or: [
            { name: { $regex: escaped, $options: 'i' } },
            { description: { $regex: escaped, $options: 'i' } },
          ],
        });
      }
    }

    if (queryOptions.featured !== undefined) {
      filters.push({ featured: queryOptions.featured });
    }

    if (filters.length === 0) return {};
    if (filters.length === 1) return filters[0];
    return { $and: filters };
  }

  private buildAdminSort(
    sortBy: AdminCategorySortBy,
    sortOrder: AdminCategorySortOrder
  ): Record<string, SortOrder> {
    return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  }
}
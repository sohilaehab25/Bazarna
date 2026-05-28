import { CategoryRepository, AdminCategoryListQuery } from '../repositories/CategoryRepository';
import { Category, generateSlug } from '../models/Category';

export interface AdminCategoryListResponse {
  items: Category[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export class CategoryService {
  private categoryRepository = new CategoryRepository();

  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = generateSlug(categoryData.name);
    }
    return await this.categoryRepository.create(categoryData);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return await this.categoryRepository.findById(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<Category | null> {
    if (categoryData.name && !categoryData.slug) {
      categoryData.slug = generateSlug(categoryData.name);
    }
    return await this.categoryRepository.update(id, categoryData);
  }

  async deleteCategory(id: string): Promise<boolean> {
    return await this.categoryRepository.delete(id);
  }

  async getAdminCategories(query: AdminCategoryListQuery): Promise<AdminCategoryListResponse> {
    const result = await this.categoryRepository.findAdminCategories(query);
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
    };
  }

  async getProductCounts(): Promise<Map<string, number>> {
    return this.categoryRepository.countProductsPerCategory();
  }
}
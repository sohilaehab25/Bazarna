import { CategoryRepository } from '../repositories/CategoryRepository';
import { Category, CreateCategoryDTO, UpdateCategoryDTO, UserRole } from '../models/Category';

export class CategoryService {
  private categoryRepository = new CategoryRepository();

  async createCategory(categoryData: CreateCategoryDTO, requestingUserRole: UserRole): Promise<Category> {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Only admins can create categories');
    }

    return await this.categoryRepository.create(categoryData);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return await this.categoryRepository.findById(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }

  async updateCategory(id: string, categoryData: UpdateCategoryDTO, requestingUserRole: UserRole): Promise<Category | null> {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Only admins can update categories');
    }

    return await this.categoryRepository.update(id, categoryData);
  }

  async deleteCategory(id: string, requestingUserRole: UserRole): Promise<boolean> {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Only admins can delete categories');
    }

    return await this.categoryRepository.delete(id);
  }
}
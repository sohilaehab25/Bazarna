import { CategoryRepository } from '../repositories/CategoryRepository';
import { Category } from '../models/Category';

export class CategoryService {
  private categoryRepository = new CategoryRepository();

  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    return await this.categoryRepository.create(categoryData);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return await this.categoryRepository.findById(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<Category | null> {
    return await this.categoryRepository.update(id, categoryData);
  }

  async deleteCategory(id: string): Promise<boolean> {
    return await this.categoryRepository.delete(id);
  }
}
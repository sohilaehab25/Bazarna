import CategoryModel, { Category } from '../models/Category';

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

  async update(id: string, categoryData: Partial<Category>): Promise<Category | null> {
    return await CategoryModel.findByIdAndUpdate(id, categoryData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await CategoryModel.findByIdAndDelete(id);
    return !!result;
  }
}
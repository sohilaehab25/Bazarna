import { Repository } from 'typeorm';
import { AppDataSource } from '../config/dataSource';
import { CategoryEntity } from '../models/CategoryEntity';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../models/Category';

export class CategoryRepository {
  private repository: Repository<CategoryEntity> = AppDataSource.getRepository(CategoryEntity);

  async create(categoryData: CreateCategoryDTO): Promise<Category> {
    const category = this.repository.create({
      name: categoryData.name,
      description: categoryData.description,
      image: categoryData.image,
      isActive: true,
    });

    const savedCategory = await this.repository.save(category);
    return this.mapEntityToCategory(savedCategory);
  }

  async findById(id: string): Promise<Category | null> {
    const category = await this.repository.findOne({ where: { id, isActive: true } });
    return category ? this.mapEntityToCategory(category) : null;
  }

  async findAll(): Promise<Category[]> {
    const categories = await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return categories.map(this.mapEntityToCategory);
  }

  async update(id: string, categoryData: UpdateCategoryDTO): Promise<Category | null> {
    const updateData: Partial<CategoryEntity> = {};

    if (categoryData.name !== undefined) updateData.name = categoryData.name;
    if (categoryData.description !== undefined) updateData.description = categoryData.description;
    if (categoryData.image !== undefined) updateData.image = categoryData.image;
    if (categoryData.isActive !== undefined) updateData.isActive = categoryData.isActive;

    if (Object.keys(updateData).length === 0) return null;

    updateData.updatedAt = new Date();

    await this.repository.update(id, updateData);
    const updatedCategory = await this.repository.findOne({ where: { id } });
    return updatedCategory ? this.mapEntityToCategory(updatedCategory) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }

  private mapEntityToCategory(entity: CategoryEntity): Category {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      image: entity.image,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
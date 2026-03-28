import { Repository } from 'typeorm';
import { AppDataSource } from '../config/dataSource';
import { ProductEntity } from '../models/ProductEntity';
import { Product, CreateProductDTO, UpdateProductDTO } from '../models/Product';

export class ProductRepository {
  private repository: Repository<ProductEntity> = AppDataSource.getRepository(ProductEntity);

  async create(productData: CreateProductDTO, storeOwnerId: string): Promise<Product> {
    const product = this.repository.create({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      categoryId: productData.categoryId,
      storeOwnerId,
      images: productData.images || [],
      isActive: true,
    });

    const savedProduct = await this.repository.save(product);
    return this.mapEntityToProduct(savedProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.repository.findOne({
      where: { id, isActive: true },
      relations: ['category', 'storeOwner'],
    });
    return product ? this.mapEntityToProduct(product) : null;
  }

  async findAll(limit: number = 20, offset: number = 0, categoryId?: string): Promise<Product[]> {
    const query = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.storeOwner', 'storeOwner')
      .where('product.isActive = :isActive', { isActive: true });

    if (categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    const products = await query
      .orderBy('product.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return products.map(this.mapEntityToProduct);
  }

  async findByStoreOwner(storeOwnerId: string): Promise<Product[]> {
    const products = await this.repository.find({
      where: { storeOwnerId, isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
    return products.map(this.mapEntityToProduct);
  }

  async update(id: string, productData: UpdateProductDTO): Promise<Product | null> {
    const updateData: Partial<ProductEntity> = {};

    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.price !== undefined) updateData.price = productData.price;
    if (productData.stock !== undefined) updateData.stock = productData.stock;
    if (productData.categoryId !== undefined) updateData.categoryId = productData.categoryId;
    if (productData.images !== undefined) updateData.images = productData.images;
    if (productData.isActive !== undefined) updateData.isActive = productData.isActive;

    if (Object.keys(updateData).length === 0) return null;

    updateData.updatedAt = new Date();

    await this.repository.update(id, updateData);
    const updatedProduct = await this.repository.findOne({
      where: { id },
      relations: ['category', 'storeOwner'],
    });
    return updatedProduct ? this.mapEntityToProduct(updatedProduct) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }

  private mapEntityToProduct(entity: ProductEntity): Product {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      price: entity.price,
      stock: entity.stock,
      categoryId: entity.categoryId,
      storeOwnerId: entity.storeOwnerId,
      images: entity.images,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
import { ProductRepository } from '../repositories/ProductRepository';
import { Product, CreateProductDTO, UpdateProductDTO, UserRole } from '../models/Product';

export class ProductService {
  private productRepository = new ProductRepository();

  async createProduct(productData: CreateProductDTO, storeOwnerId: string): Promise<Product> {
    return await this.productRepository.create(productData, storeOwnerId);
  }

  async getProductById(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id);
  }

  async getAllProducts(limit: number = 20, offset: number = 0, categoryId?: string): Promise<Product[]> {
    return await this.productRepository.findAll(limit, offset, categoryId);
  }

  async getProductsByStoreOwner(storeOwnerId: string, requestingUserId: string, requestingUserRole: UserRole): Promise<Product[]> {
    // Store owners can see their own products, admins can see all
    if (requestingUserId !== storeOwnerId && requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Unauthorized to view these products');
    }

    return await this.productRepository.findByStoreOwner(storeOwnerId);
  }

  async updateProduct(id: string, productData: UpdateProductDTO, requestingUserId: string, requestingUserRole: UserRole): Promise<Product | null> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Only store owner or admin can update
    if (product.storeOwnerId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Unauthorized to update this product');
    }

    return await this.productRepository.update(id, productData);
  }

  async deleteProduct(id: string, requestingUserId: string, requestingUserRole: UserRole): Promise<boolean> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Only store owner or admin can delete
    if (product.storeOwnerId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Unauthorized to delete this product');
    }

    return await this.productRepository.delete(id);
  }
}
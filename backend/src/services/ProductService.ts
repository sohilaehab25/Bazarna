import { ProductRepository } from '../repositories/ProductRepository';
import { Product } from '../models/Product';

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
}
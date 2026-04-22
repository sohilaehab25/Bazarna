import ProductModel, { Product } from '../models/Product';

export class ProductRepository {
  async create(productData: Partial<Product>): Promise<Product> {
    const product = new ProductModel(productData);
    return await product.save();
  }

  async findById(id: string): Promise<Product | null> {
    return await ProductModel.findById(id).populate('categoryId');
  }

  async findAll(limit: number = 20, offset: number = 0, categoryId?: string): Promise<Product[]> {
    const query: any = {};
    if (categoryId) {
      query.categoryId = categoryId;
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

  async delete(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id);
    return !!result;
  }

  async findByStoreOwner(storeOwnerId: string): Promise<Product[]> {
    // Since we removed storeOwnerId, return all products
    return await ProductModel.find().populate('categoryId');
  }
}
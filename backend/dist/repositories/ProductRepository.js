"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = void 0;
const dataSource_1 = require("../config/dataSource");
const ProductEntity_1 = require("../models/ProductEntity");
class ProductRepository {
    constructor() {
        this.repository = dataSource_1.AppDataSource.getRepository(ProductEntity_1.ProductEntity);
    }
    async create(productData, storeOwnerId) {
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
    async findById(id) {
        const product = await this.repository.findOne({
            where: { id, isActive: true },
            relations: ['category', 'storeOwner'],
        });
        return product ? this.mapEntityToProduct(product) : null;
    }
    async findAll(limit = 20, offset = 0, categoryId) {
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
    async findByStoreOwner(storeOwnerId) {
        const products = await this.repository.find({
            where: { storeOwnerId, isActive: true },
            relations: ['category'],
            order: { createdAt: 'DESC' },
        });
        return products.map(this.mapEntityToProduct);
    }
    async update(id, productData) {
        const updateData = {};
        if (productData.name !== undefined)
            updateData.name = productData.name;
        if (productData.description !== undefined)
            updateData.description = productData.description;
        if (productData.price !== undefined)
            updateData.price = productData.price;
        if (productData.stock !== undefined)
            updateData.stock = productData.stock;
        if (productData.categoryId !== undefined)
            updateData.categoryId = productData.categoryId;
        if (productData.images !== undefined)
            updateData.images = productData.images;
        if (productData.isActive !== undefined)
            updateData.isActive = productData.isActive;
        if (Object.keys(updateData).length === 0)
            return null;
        updateData.updatedAt = new Date();
        await this.repository.update(id, updateData);
        const updatedProduct = await this.repository.findOne({
            where: { id },
            relations: ['category', 'storeOwner'],
        });
        return updatedProduct ? this.mapEntityToProduct(updatedProduct) : null;
    }
    async delete(id) {
        const result = await this.repository.update(id, { isActive: false });
        return result.affected > 0;
    }
    mapEntityToProduct(entity) {
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
exports.ProductRepository = ProductRepository;

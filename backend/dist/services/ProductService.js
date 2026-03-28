"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const ProductRepository_1 = require("../repositories/ProductRepository");
const Product_1 = require("../models/Product");
class ProductService {
    constructor() {
        this.productRepository = new ProductRepository_1.ProductRepository();
    }
    async createProduct(productData, storeOwnerId) {
        return await this.productRepository.create(productData, storeOwnerId);
    }
    async getProductById(id) {
        return await this.productRepository.findById(id);
    }
    async getAllProducts(limit = 20, offset = 0, categoryId) {
        return await this.productRepository.findAll(limit, offset, categoryId);
    }
    async getProductsByStoreOwner(storeOwnerId, requestingUserId, requestingUserRole) {
        // Store owners can see their own products, admins can see all
        if (requestingUserId !== storeOwnerId && requestingUserRole !== Product_1.UserRole.ADMIN) {
            throw new Error('Unauthorized to view these products');
        }
        return await this.productRepository.findByStoreOwner(storeOwnerId);
    }
    async updateProduct(id, productData, requestingUserId, requestingUserRole) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        // Only store owner or admin can update
        if (product.storeOwnerId !== requestingUserId && requestingUserRole !== Product_1.UserRole.ADMIN) {
            throw new Error('Unauthorized to update this product');
        }
        return await this.productRepository.update(id, productData);
    }
    async deleteProduct(id, requestingUserId, requestingUserRole) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        // Only store owner or admin can delete
        if (product.storeOwnerId !== requestingUserId && requestingUserRole !== Product_1.UserRole.ADMIN) {
            throw new Error('Unauthorized to delete this product');
        }
        return await this.productRepository.delete(id);
    }
}
exports.ProductService = ProductService;

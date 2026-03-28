"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const ProductService_1 = require("../../services/ProductService");
const productService = new ProductService_1.ProductService();
class ProductController {
    async getAllProducts(req, res) {
        try {
            const { limit = 20, offset = 0, categoryId } = req.query;
            const products = await productService.getAllProducts(parseInt(limit), parseInt(offset), categoryId);
            res.json(products);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async getProduct(req, res) {
        try {
            const product = await productService.getProductById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.json(product);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async createProduct(req, res) {
        try {
            const product = await productService.createProduct(req.body, req.user.userId);
            res.status(201).json(product);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async updateProduct(req, res) {
        try {
            const product = await productService.updateProduct(req.params.id, req.body, req.user.userId, req.user.role);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.json(product);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async deleteProduct(req, res) {
        try {
            const deleted = await productService.deleteProduct(req.params.id, req.user.userId, req.user.role);
            if (!deleted) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.json({ message: 'Product deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async getStoreProducts(req, res) {
        try {
            const products = await productService.getProductsByStoreOwner(req.params.storeOwnerId, req.user.userId, req.user.role);
            res.json(products);
        }
        catch (error) {
            res.status(403).json({ message: error.message });
        }
    }
}
exports.ProductController = ProductController;

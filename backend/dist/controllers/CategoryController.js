"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const CategoryService_1 = require("../../services/CategoryService");
const categoryService = new CategoryService_1.CategoryService();
class CategoryController {
    async getAllCategories(req, res) {
        try {
            const categories = await categoryService.getAllCategories();
            res.json(categories);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async getCategory(req, res) {
        try {
            const category = await categoryService.getCategoryById(req.params.id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.json(category);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async createCategory(req, res) {
        try {
            const category = await categoryService.createCategory(req.body, req.user.role);
            res.status(201).json(category);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async updateCategory(req, res) {
        try {
            const category = await categoryService.updateCategory(req.params.id, req.body, req.user.role);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.json(category);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async deleteCategory(req, res) {
        try {
            const deleted = await categoryService.deleteCategory(req.params.id, req.user.role);
            if (!deleted) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.json({ message: 'Category deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}
exports.CategoryController = CategoryController;

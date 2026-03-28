"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const CategoryRepository_1 = require("../repositories/CategoryRepository");
const Category_1 = require("../models/Category");
class CategoryService {
    constructor() {
        this.categoryRepository = new CategoryRepository_1.CategoryRepository();
    }
    async createCategory(categoryData, requestingUserRole) {
        if (requestingUserRole !== Category_1.UserRole.ADMIN) {
            throw new Error('Only admins can create categories');
        }
        return await this.categoryRepository.create(categoryData);
    }
    async getCategoryById(id) {
        return await this.categoryRepository.findById(id);
    }
    async getAllCategories() {
        return await this.categoryRepository.findAll();
    }
    async updateCategory(id, categoryData, requestingUserRole) {
        if (requestingUserRole !== Category_1.UserRole.ADMIN) {
            throw new Error('Only admins can update categories');
        }
        return await this.categoryRepository.update(id, categoryData);
    }
    async deleteCategory(id, requestingUserRole) {
        if (requestingUserRole !== Category_1.UserRole.ADMIN) {
            throw new Error('Only admins can delete categories');
        }
        return await this.categoryRepository.delete(id);
    }
}
exports.CategoryService = CategoryService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
const dataSource_1 = require("../config/dataSource");
const CategoryEntity_1 = require("../models/CategoryEntity");
class CategoryRepository {
    constructor() {
        this.repository = dataSource_1.AppDataSource.getRepository(CategoryEntity_1.CategoryEntity);
    }
    async create(categoryData) {
        const category = this.repository.create({
            name: categoryData.name,
            description: categoryData.description,
            image: categoryData.image,
            isActive: true,
        });
        const savedCategory = await this.repository.save(category);
        return this.mapEntityToCategory(savedCategory);
    }
    async findById(id) {
        const category = await this.repository.findOne({ where: { id, isActive: true } });
        return category ? this.mapEntityToCategory(category) : null;
    }
    async findAll() {
        const categories = await this.repository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
        return categories.map(this.mapEntityToCategory);
    }
    async update(id, categoryData) {
        const updateData = {};
        if (categoryData.name !== undefined)
            updateData.name = categoryData.name;
        if (categoryData.description !== undefined)
            updateData.description = categoryData.description;
        if (categoryData.image !== undefined)
            updateData.image = categoryData.image;
        if (categoryData.isActive !== undefined)
            updateData.isActive = categoryData.isActive;
        if (Object.keys(updateData).length === 0)
            return null;
        updateData.updatedAt = new Date();
        await this.repository.update(id, updateData);
        const updatedCategory = await this.repository.findOne({ where: { id } });
        return updatedCategory ? this.mapEntityToCategory(updatedCategory) : null;
    }
    async delete(id) {
        const result = await this.repository.update(id, { isActive: false });
        return result.affected > 0;
    }
    mapEntityToCategory(entity) {
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
exports.CategoryRepository = CategoryRepository;

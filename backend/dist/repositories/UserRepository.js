"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const dataSource_1 = require("../config/dataSource");
const UserEntity_1 = require("../models/UserEntity");
class UserRepository {
    constructor() {
        this.repository = dataSource_1.AppDataSource.getRepository(UserEntity_1.UserEntity);
    }
    async create(userData) {
        const user = this.repository.create({
            email: userData.email,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role || UserEntity_1.UserRole.USER,
            isActive: true,
        });
        const savedUser = await this.repository.save(user);
        return this.mapEntityToUser(savedUser);
    }
    async findById(id) {
        const user = await this.repository.findOne({ where: { id } });
        return user ? this.mapEntityToUser(user) : null;
    }
    async findByEmail(email) {
        const user = await this.repository.findOne({ where: { email } });
        return user ? this.mapEntityToUser(user) : null;
    }
    async update(id, userData) {
        const updateData = {};
        if (userData.firstName !== undefined)
            updateData.firstName = userData.firstName;
        if (userData.lastName !== undefined)
            updateData.lastName = userData.lastName;
        if (userData.isActive !== undefined)
            updateData.isActive = userData.isActive;
        if (Object.keys(updateData).length === 0)
            return null;
        updateData.updatedAt = new Date();
        await this.repository.update(id, updateData);
        const updatedUser = await this.repository.findOne({ where: { id } });
        return updatedUser ? this.mapEntityToUser(updatedUser) : null;
    }
    async delete(id) {
        const result = await this.repository.delete(id);
        return result.affected > 0;
    }
    mapEntityToUser(entity) {
        return {
            id: entity.id,
            email: entity.email,
            password: entity.password,
            firstName: entity.firstName,
            lastName: entity.lastName,
            role: entity.role,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
exports.UserRepository = UserRepository;

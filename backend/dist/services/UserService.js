"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const UserRepository_1 = require("../repositories/UserRepository");
const User_1 = require("../models/User");
class UserService {
    constructor() {
        this.userRepository = new UserRepository_1.UserRepository();
    }
    async getUserById(id) {
        return await this.userRepository.findById(id);
    }
    async updateUser(id, userData, requestingUserId, requestingUserRole) {
        // Users can update their own profile, admins can update anyone
        if (requestingUserId !== id && requestingUserRole !== User_1.UserRole.ADMIN) {
            throw new Error('Unauthorized to update this user');
        }
        return await this.userRepository.update(id, userData);
    }
    async deleteUser(id, requestingUserRole) {
        if (requestingUserRole !== User_1.UserRole.ADMIN) {
            throw new Error('Only admins can delete users');
        }
        return await this.userRepository.delete(id);
    }
    async getAllUsers(requestingUserRole) {
        if (requestingUserRole !== User_1.UserRole.ADMIN) {
            throw new Error('Only admins can view all users');
        }
        // This would need a method in repository to get all users
        // For now, return empty array
        return [];
    }
}
exports.UserService = UserService;

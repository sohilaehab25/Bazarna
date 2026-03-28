"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const UserService_1 = require("../../services/UserService");
const userService = new UserService_1.UserService();
class UserController {
    async getProfile(req, res) {
        try {
            const user = await userService.getUserById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                createdAt: user.createdAt,
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async updateProfile(req, res) {
        try {
            const user = await userService.updateUser(req.user.userId, req.body, req.user.userId, req.user.role);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                updatedAt: user.updatedAt,
            });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}
exports.UserController = UserController;

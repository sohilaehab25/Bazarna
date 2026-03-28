"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const AuthDTOs_1 = require("../dtos/AuthDTOs");
const validation_1 = require("../utils/validation");
const authService = new AuthService_1.AuthService();
class AuthController {
    async register(req, res) {
        try {
            const registerData = req.body;
            await (0, validation_1.validateDTO)(registerData, AuthDTOs_1.RegisterDTO);
            const user = await authService.register(registerData);
            const tokens = await authService.login(registerData.email, registerData.password);
            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
                ...tokens,
            });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async login(req, res) {
        try {
            const loginData = req.body;
            await (0, validation_1.validateDTO)(loginData, AuthDTOs_1.LoginDTO);
            const tokens = await authService.login(loginData.email, loginData.password);
            res.json({
                message: 'Login successful',
                ...tokens,
            });
        }
        catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
    async refreshToken(req, res) {
        try {
            const refreshData = req.body;
            await (0, validation_1.validateDTO)(refreshData, AuthDTOs_1.RefreshTokenDTO);
            const tokens = await authService.refreshToken(refreshData.refreshToken);
            res.json({
                message: 'Token refreshed successfully',
                ...tokens,
            });
        }
        catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
}
exports.AuthController = AuthController;

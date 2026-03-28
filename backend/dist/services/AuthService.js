"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserRepository_1 = require("../repositories/UserRepository");
class AuthService {
    constructor() {
        this.userRepository = new UserRepository_1.UserRepository();
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
        this.accessTokenExpiry = '15m';
        this.refreshTokenExpiry = '7d';
    }
    async register(userData) {
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        const hashedPassword = await bcrypt_1.default.hash(userData.password, 12);
        const user = await this.userRepository.create({
            ...userData,
            password: hashedPassword,
        });
        return user;
    }
    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user || !user.isActive) {
            throw new Error('Invalid credentials');
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        return this.generateTokens(user);
    }
    async refreshToken(refreshToken) {
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, this.jwtRefreshSecret);
            const user = await this.userRepository.findById(payload.userId);
            if (!user || !user.isActive) {
                throw new Error('Invalid refresh token');
            }
            return this.generateTokens(user);
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    generateTokens(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, this.jwtSecret, { expiresIn: this.accessTokenExpiry });
        const refreshToken = jsonwebtoken_1.default.sign(payload, this.jwtRefreshSecret, { expiresIn: this.refreshTokenExpiry });
        return { accessToken, refreshToken };
    }
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.jwtSecret);
        }
        catch (error) {
            throw new Error('Invalid access token');
        }
    }
}
exports.AuthService = AuthService;

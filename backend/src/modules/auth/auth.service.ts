import UserModel, { IUser } from './auth.model';
import * as jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../common/errors/AppError';

export class AuthService {
    static async register(data: { name: string; email: string; password: string; role?: string; }) {
        const exists = await UserModel.findOne({ email: data.email });
        if (exists) throw new AppError('Email already in use', 400);
        const user = await UserModel.create(data as Partial<IUser>);
        return user;
    }

    static async login(email: string, password: string) {
        const user = await UserModel.findOne({ email }).select('+password') as IUser | null;
        if (!user) throw new AppError('Invalid credentials', 401);
        const ok = await user.comparePassword(password);
        if (!ok) throw new AppError('Invalid credentials', 401);
        const token = jwt.sign(
            { sub: user.id, role: user.role },
            env.jwtSecret as jwt.Secret,
            { expiresIn: env.jwtExpiresIn } as jwt.SignOptions
        );
        return { user, token };
    }
}

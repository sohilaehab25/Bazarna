import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { User, UserRole } from '../models/User';

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepository = new UserRepository();
  private jwtSecret: string = process.env.JWT_SECRET || 'your-secret-key';
  private jwtRefreshSecret: string = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  private accessTokenExpiry = '15m';
  private refreshTokenExpiry = '7d';

  async register(userData: { email: string; password: string; name: string; role?: UserRole }): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return user;
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as JWTPayload;
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new Error('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  private generateTokens(user: User): AuthTokens {
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret as string, { expiresIn: this.accessTokenExpiry });
    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret as string, { expiresIn: this.refreshTokenExpiry });

    return { accessToken, refreshToken };
  }
}
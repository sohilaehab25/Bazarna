import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRepository } from '../../repositories/UserRepository';
import { User, UserRole } from '../../models/User';

interface JWTPayload {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface AuthResponse extends AuthTokens {}

export class AuthService {
  private userRepository = new UserRepository();
  private jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  private jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
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

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const tokens = this.generateTokens(user);

    return {
      ...tokens,
      user: this.mapUserProfile(user),
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as JWTPayload;
      const user = await this.userRepository.findById(payload._id);

      if (!user) {
        throw new Error('Invalid refresh token');
      }

      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user: this.mapUserProfile(user),
      };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  private generateTokens(user: User): AuthTokens {
    const payload: JWTPayload = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: this.accessTokenExpiry } as SignOptions);
    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, { expiresIn: this.refreshTokenExpiry } as SignOptions);

    return { accessToken, refreshToken, user: this.mapUserProfile(user) };
  }

  private mapUserProfile(user: User) {
    return {
      _id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    };
  }
}
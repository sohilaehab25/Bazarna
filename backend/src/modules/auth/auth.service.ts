import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRepository } from '../../repositories/UserRepository';
import { User, UserRole } from '../../models/User';
import { EmailService } from '../../services/EmailService';
import { RefreshTokenRepository } from '../../repositories/RefreshTokenRepository';


interface JWTPayload {
  sub: string;
  _id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface TokenMeta {
  ip?: string;
  userAgent?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

export class AuthService {
  private userRepository = new UserRepository();
  private refreshTokenRepository = new RefreshTokenRepository();
  private emailService = new EmailService();
  private jwtSecret = process.env.JWT_SECRET;
  private accessTokenExpiry = process.env.ACCESS_TOKEN_TTL || '15m';
  private refreshTokenTtlMs = this.resolveRefreshTokenTtlMs();



  async register(userData: { email: string; password: string; name: string }): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.userRepository.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: UserRole.USER,
      isVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, emailVerificationToken);

    return user;
  }

  async login(email: string, password: string, meta: TokenMeta): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email before signing in');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return await this.issueTokens(user, meta);
  }

  async refreshToken(refreshToken: string, meta: TokenMeta): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new Error('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      if (storedToken.replacedByTokenHash) {
        await this.refreshTokenRepository.revokeAllForUser(storedToken.userId.toString(), 'reuse-detected');
      }
      throw new Error('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    const user = await this.userRepository.findById(storedToken.userId.toString());
    if (!user) {
      throw new Error('Invalid refresh token');
    }

    const tokens = await this.issueTokens(user, meta, storedToken.sessionId);
    const newTokenHash = this.hashToken(tokens.refreshToken);

    await this.refreshTokenRepository.revokeToken(tokenHash, {
      replacedByTokenHash: newTokenHash,
      revokedReason: 'rotated',
      lastUsedAt: new Date(),
    });

    return tokens;
  }

  async revokeSession(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepository.revokeToken(tokenHash, { revokedReason: 'logout' });
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.userRepository.findByEmailVerificationToken(token);
    if (!user) {
      throw new Error('Invalid verification token');
    }

    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new Error('Verification token has expired');
    }

    // Update user as verified and remove token
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return user;
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Prevent email enumeration - don't reveal if email exists
      return;
    }

    if (user.isVerified) {
      // Don't send if already verified
      return;
    }

    // Generate new token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, emailVerificationToken);
  }

  private generateAccessToken(user: User): string {
    const userId = user._id.toString();
    const payload: JWTPayload = {
      sub: userId,
      _id: userId,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.accessTokenExpiry } as SignOptions);
  }

  private async issueTokens(user: User, meta: TokenMeta, existingSessionId?: string): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.createRefreshToken();
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + this.refreshTokenTtlMs);
    const sessionId = existingSessionId ?? (crypto.randomUUID?.() || crypto.randomBytes(16).toString('hex'));

    await this.refreshTokenRepository.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      sessionId,
      expiresAt: refreshTokenExpiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
      user: this.mapUserProfile(user),
    };
  }

  private createRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private resolveRefreshTokenTtlMs(): number {

    const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS);
    if (Number.isFinite(days) && days > 0) {
      return days * 24 * 60 * 60 * 1000;
    }

    return 30 * 24 * 60 * 60 * 1000;
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
import { Request, Response } from 'express';
import crypto from 'crypto';
import { AuthService } from './auth.service';
import { RegisterDTO, LoginDTO } from '../../dtos/AuthDTOs';
import { validateDTO } from '../../utils/validation';

const authService = new AuthService();
const REFRESH_COOKIE_NAME = 'refresh_token';
const CSRF_COOKIE_NAME = 'csrf_token';
const debugAuth = process.env.DEBUG_AUTH === 'true';


const getCookieOptions = (expiresAt: Date) => {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    expires: expiresAt,
    path: '/api/auth',
  };
};

const getCsrfCookieOptions = (expiresAt: Date) => {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax' as const,
    expires: expiresAt,
    path: '/',
  };
};

const getCsrfClearOptions = (path: string) => {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax' as const,
    path,
  };
};

const clearCsrfCookies = (res: Response) => {
  res.clearCookie(CSRF_COOKIE_NAME, getCsrfClearOptions('/api/auth'));
  res.clearCookie(CSRF_COOKIE_NAME, getCsrfClearOptions('/'));
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  clearCsrfCookies(res);
};

const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

const getCookieValues = (req: Request, name: string): string[] => {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return [];

  return rawCookie
    .split(';')
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith(`${name}=`))
    .map((cookie) => decodeURIComponent(cookie.substring(name.length + 1)))
    .filter((value) => value.length > 0);
};

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const registerData: RegisterDTO = req.body;
      await validateDTO(registerData, RegisterDTO);

      const user = await authService.register(registerData);

      res.apiSuccess('User registered successfully. Please check your email to verify your account.', {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        },
      }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.apiError(message, 400);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const loginData: LoginDTO = req.body;
      await validateDTO(loginData, LoginDTO);

      const tokens = await authService.login(loginData.email, loginData.password, {
        ip: req.ip,
        userAgent: (req.get('user-agent') ?? '').slice(0, 512) || undefined,
      });
      clearCsrfCookies(res);
      const csrfToken = createCsrfToken();
      
      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getCookieOptions(tokens.refreshTokenExpiresAt));
      res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions(tokens.refreshTokenExpiresAt));

      res.apiSuccess('Login successful', {
        accessToken: tokens.accessToken,
        user: tokens.user,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.apiError(message, 401);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      const csrfHeader = typeof req.headers['x-csrf-token'] === 'string'
        ? req.headers['x-csrf-token']
        : undefined;
      const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
      const csrfCookieValues = new Set([csrfCookie, ...getCookieValues(req, CSRF_COOKIE_NAME)].filter(Boolean));
      if (!refreshToken) {
        return res.apiError('Refresh token is missing', 401);
      }

      if (!csrfHeader || csrfCookieValues.size === 0 || !csrfCookieValues.has(csrfHeader)) {
        return res.apiError('Invalid CSRF token', 403);
      }

      const tokens = await authService.refreshToken(refreshToken, {
        ip: req.ip,
        userAgent: (req.get('user-agent') ?? '').slice(0, 512) || undefined,
      });

      const nextCsrfToken = createCsrfToken();
      clearCsrfCookies(res);
      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getCookieOptions(tokens.refreshTokenExpiresAt));
      res.cookie(CSRF_COOKIE_NAME, nextCsrfToken, getCsrfCookieOptions(tokens.refreshTokenExpiresAt));

      res.apiSuccess('Token refreshed successfully', {
        accessToken: tokens.accessToken,
        user: tokens.user,
      });
    } catch (error: unknown) {
      clearAuthCookies(res);
      const message = error instanceof Error ? error.message : 'Invalid refresh token';
      res.apiError(message, 401);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const csrfHeader = typeof req.headers['x-csrf-token'] === 'string'
        ? req.headers['x-csrf-token']
        : undefined;
      const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
      const csrfCookieValues = new Set([csrfCookie, ...getCookieValues(req, CSRF_COOKIE_NAME)].filter(Boolean));

      if (!csrfHeader || csrfCookieValues.size === 0 || !csrfCookieValues.has(csrfHeader)) {
        return res.apiError('Invalid CSRF token', 403);
      }

      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      await authService.revokeSession(refreshToken);

      clearAuthCookies(res);
      res.apiSuccess('Logged out successfully');
    } catch (error: unknown) {
      clearAuthCookies(res);
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.apiError(message, 500);
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.apiError('Verification token is required', 400);
      }

      const user = await authService.verifyEmail(token);
      res.apiSuccess('Email verified successfully', {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Email verification failed';
      res.apiError(message, 400);
    }
  }

  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.apiError('Email is required', 400);
      }

      await authService.resendVerification(email);
      res.apiSuccess('If an account with that email exists and is not verified, a verification email has been sent.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to resend verification email';
      res.apiError(message, 500);
    }
  }
}
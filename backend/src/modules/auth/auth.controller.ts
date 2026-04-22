import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDTO, LoginDTO, RefreshTokenDTO } from '../../dtos/AuthDTOs';
import { validateDTO } from '../../utils/validation';

const authService = new AuthService();

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

      const tokens = await authService.login(loginData.email, loginData.password);
      res.apiSuccess('Login successful', tokens);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.apiError(message, 401);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshData: RefreshTokenDTO = req.body;
      await validateDTO(refreshData, RefreshTokenDTO);

      const tokens = await authService.refreshToken(refreshData.refreshToken);
      res.apiSuccess('Token refreshed successfully', tokens);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid refresh token';
      res.apiError(message, 401);
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
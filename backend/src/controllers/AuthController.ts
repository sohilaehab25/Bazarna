import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { RegisterDTO, LoginDTO, RefreshTokenDTO } from '../dtos/AuthDTOs';
import { validateDTO } from '../utils/validation';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const registerData: RegisterDTO = req.body;
      await validateDTO(registerData, RegisterDTO);

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
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const loginData: LoginDTO = req.body;
      await validateDTO(loginData, LoginDTO);

      const tokens = await authService.login(loginData.email, loginData.password);

      res.json({
        message: 'Login successful',
        ...tokens,
      });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshData: RefreshTokenDTO = req.body;
      await validateDTO(refreshData, RefreshTokenDTO);

      const tokens = await authService.refreshToken(refreshData.refreshToken);

      res.json({
        message: 'Token refreshed successfully',
        ...tokens,
      });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }
}
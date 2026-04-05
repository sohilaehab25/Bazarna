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
      const tokens = await authService.login(registerData.email, registerData.password);

      res.apiSuccess('User registered successfully', {
        ...tokens,
      }, 201);
    } catch (error: any) {
      console.log("🚀 ~ AuthController ~ register ~ error:", error)
      res.apiError(error.message, 400);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const loginData: LoginDTO = req.body;
      await validateDTO(loginData, LoginDTO);

      const tokens = await authService.login(loginData.email, loginData.password);
      res.apiSuccess('Login successful', tokens);
    } catch (error: any) {
      console.log("🚀 ~ AuthController ~ login ~ error:", error)
      res.apiError(error.message, 401);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshData: RefreshTokenDTO = req.body;
      await validateDTO(refreshData, RefreshTokenDTO);

      const tokens = await authService.refreshToken(refreshData.refreshToken);
      res.apiSuccess('Token refreshed successfully', tokens);
    } catch (error: any) {
      console.log("🚀 ~ AuthController ~ refreshToken ~ error:", error)
      res.apiError(error.message, 401);
    }
  }
}
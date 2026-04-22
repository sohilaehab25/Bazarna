import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { UserService } from '../services/UserService';

const userService = new UserService();

export class UserController {
  async getProfile(req: Request, res: Response) {
    console.log("🚀 ~ UserController ~ getProfile ~ req:", req)
    try {
      const user = await userService.getUserById((req.user as any)._id.toString());
      if (!user) {
        return res.apiError('User not found', 404);
      }

      res.apiSuccess('Profile retrieved successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        }
      });
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const user = await userService.updateUser((req.user as any)._id.toString(), req.body);
      if (!user) {
        return res.apiError('User not found', 404);
      }

      res.apiSuccess('Profile updated successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          updatedAt: user.updatedAt,
        }
      });
    } catch (error: any) {
      res.apiError(error.message, 400);
    }
  }
}
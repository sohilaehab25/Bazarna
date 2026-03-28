import { Response } from 'express';
import { UserService } from '../../services/UserService';
import { AuthRequest } from '../../middlewares/auth';

const userService = new UserService();

export class UserController {
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await userService.getUserById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const user = await userService.updateUser(
        req.user!.userId,
        req.body,
        req.user!.userId,
        req.user!.role
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        updatedAt: user.updatedAt,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { asyncHandler } from '../../common/utils/asyncHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.register(req.body);
  // Do not return password
  const { password: _pwd, ...userObj } = user.toObject();
  res.status(201).json({ status: 'success', data: userObj });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, token } = await AuthService.login(email, password);
  const raw = (user as any).toObject?.() ?? (user as any);
  const { password: _pwd, ...userObj } = raw;
  res.json({ status: 'success', data: { user: userObj, token } });
});

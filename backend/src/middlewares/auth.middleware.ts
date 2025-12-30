import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../common/errors/AppError';

export interface AuthRequest extends Request {
  user?: { sub: string; role?: string } | null;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return next(new AppError('Authorization required', 401));
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as any;
    req.user = { sub: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401));
  }
};

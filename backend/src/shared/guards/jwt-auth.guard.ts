import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const jwtAuthGuard = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: User) => {
    if (err) {
      return res.apiError('Authentication failed', 401);
    }

    if (!user) {
      return res.apiError('Invalid token', 401);
    }

    req.user = user;
    next();
  })(req, res, next);
};
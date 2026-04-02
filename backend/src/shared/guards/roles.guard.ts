import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../models/User';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthRequest } from '../../middlewares/auth';

export const rolesGuard = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

// Metadata-based roles guard for use with @Roles decorator
export const rolesGuardFromMetadata = (req: Request, res: Response, next: NextFunction) => {
  // This would check metadata on the route handler
  // For now, we'll use the parameter-based approach
  next();
};
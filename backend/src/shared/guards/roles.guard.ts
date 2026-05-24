import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../models/User';
import { ROLES_KEY } from '../decorators/roles.decorator';

export const rolesGuard = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.apiError('Authentication required', 401);
    }

    if (!allowedRoles.includes((req.user as any).role)) {
      return res.apiError('Insufficient permissions', 403);
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
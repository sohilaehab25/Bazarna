import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error.statusCode || 500;

  logger.error('unhandled_error', {
    method:     req.method,
    path:       req.path,
    statusCode,
    message:    error.message,
    stack:      process.env.NODE_ENV !== 'production' ? error.stack : undefined,
  });

  const message = error.message || 'Internal Server Error';
  res.apiError(message, statusCode, process.env.NODE_ENV === 'development' ? error.stack : undefined);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.apiError('Route not found', 404);
};
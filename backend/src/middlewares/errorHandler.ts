import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.apiError(message, statusCode, process.env.NODE_ENV === 'development' ? error.stack : undefined);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.apiError('Route not found', 404);
};
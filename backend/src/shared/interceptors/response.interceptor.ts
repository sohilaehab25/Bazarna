import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response.util';

declare global {
  namespace Express {
    interface Response {
      apiSuccess: <T>(message: string, data?: T, statusCode?: number, meta?: Record<string, unknown>) => void;
      apiError: (message: string, statusCode?: number, error?: string) => void;
    }
  }
}

export const responseInterceptor = (req: Request, res: Response, next: NextFunction) => {
  res.apiSuccess = <T>(message: string, data?: T, statusCode: number = 200, meta?: Record<string, unknown>) => {
    sendSuccess(res, message, data, statusCode, meta);
  };

  res.apiError = (message: string, statusCode: number = 500, error?: string) => {
    sendError(res, message, statusCode, error);
  };

  next();
};
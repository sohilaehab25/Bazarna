import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response.util';

declare global {
  namespace Express {
    interface Response {
      apiSuccess: <T>(message: string, data?: T, statusCode?: number) => void;
      apiError: (message: string, statusCode?: number, error?: any) => void;
    }
  }
}

export const responseInterceptor = (req: Request, res: Response, next: NextFunction) => {
  res.apiSuccess = <T>(message: string, data?: T, statusCode: number = 200) => {
    sendSuccess(res, message, data, statusCode);
  };

  res.apiError = (message: string, statusCode: number = 500, error?: any) => {
    sendError(res, message, statusCode, error);
  };

  next();
};
import mongoose from 'mongoose';

/**
 * Validates if a string is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware to validate ObjectId parameters
 */
export const validateObjectId = (paramName: string = 'id') => {
  return (req: any, res: any, next: any) => {
    const id = req.params[paramName];
    if (!isValidObjectId(id)) {
      return res.apiError(`Invalid ${paramName} format`, 400);
    }
    next();
  };
};
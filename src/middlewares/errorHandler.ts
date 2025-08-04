import { type Request, type Response, type NextFunction, type ErrorRequestHandler } from 'express';

import { AppError } from '@/errors/AppError.js';
import { ERRORS } from '@/errors/errors.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (error: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    const statusCode = ERRORS[error.type] || 500;
    return res.status(statusCode).send({ message: error.message });
  }

  console.error(error);
  return res.status(500).send({ message: 'Internal Server Error' });
};

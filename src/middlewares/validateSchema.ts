import { type Request, type Response, type NextFunction } from 'express';
import { type ObjectSchema } from 'joi';

import { AppError } from '@/errors/AppError.js';

export function validateSchema(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;

    const { error } = schema.validate(data, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((err) => err.message).join(', ');
      throw new AppError(errorMessages, 'unprocessable_entity');
    }

    next();
  };
}

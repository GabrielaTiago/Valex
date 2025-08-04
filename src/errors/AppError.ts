import { ErrorType } from './errors.js';

export class AppError extends Error {
  public readonly type: ErrorType;

  constructor(message: string, type: ErrorType) {
    super(message);
    this.type = type;

    Error.captureStackTrace(this, this.constructor);
  }
}

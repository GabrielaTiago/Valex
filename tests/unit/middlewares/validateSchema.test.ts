import { type Request, type Response, type NextFunction } from 'express';
import Joi from 'joi';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AppError } from '@/errors/AppError.js';
import { validateSchema } from '@/middlewares/validateSchema.js';

const testSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().min(18).required().messages({
    'any.required': 'Age is required',
    'number.base': 'Age must be a number',
    'number.min': 'Age must be greater than 18',
  }),
});

const mockRequest = {} as Request;
const mockResponse = {} as Response;
const mockNext = vi.fn() as NextFunction;

describe('Schema Validation Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar next() sem erros quando o body é válido', () => {
    mockRequest.body = {
      name: 'John Doe',
      age: 30,
    };
    const middleware = validateSchema(testSchema);

    middleware(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledOnce();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('deve lançar um AppError quando um campo obrigatório falta no body', () => {
    mockRequest.body = {
      age: 20,
    };
    const middleware = validateSchema(testSchema);

    const executeMiddleware = () => middleware(mockRequest, mockResponse, mockNext);

    expect(executeMiddleware).toThrow(AppError);
    expect(executeMiddleware).toThrow('"name" is required');
  });

  it('deve lançar um AppError quando um campo tem o tipo errado', () => {
    mockRequest.body = {
      name: 'Jane Doe',
      age: 'vinte',
    };
    const middleware = validateSchema(testSchema);

    const executeMiddleware = () => middleware(mockRequest, mockResponse, mockNext);

    expect(executeMiddleware).toThrow(AppError);
    expect(executeMiddleware).toThrow('Age must be a number');
  });

  it('deve lançar um AppError quando o body está vazio', () => {
    mockRequest.body = {};
    const middleware = validateSchema(testSchema);

    const executeMiddleware = () => middleware(mockRequest, mockResponse, mockNext);

    expect(executeMiddleware).toThrow('"name" is required, Age is required');
  });
});

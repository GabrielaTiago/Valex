import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AppError } from '@/errors/AppError.js';
import { ErrorType } from '@/errors/errors.js';
import { errorHandler } from '@/middlewares/errorHandler.js';

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = {
      url: '/test',
      method: 'GET',
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle AppError with correct status code', () => {
      const appError = new AppError('Test error', 'unauthorized');

      errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: 'Test error' });
    });

    it('should handle AppError with unknown type', () => {
      const appError = new AppError('Unknown error', 'unknown_type' as ErrorType);

      errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: 'Unknown error' });
    });

    it('should handle generic Error with 500 status', () => {
      const genericError = new Error('Generic error');

      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });

    it('should handle different AppError types', () => {
      const testCases = [
        { error: new AppError('Bad request', 'bad_request'), expectedStatus: 400 },
        { error: new AppError('Unauthorized', 'unauthorized'), expectedStatus: 401 },
        { error: new AppError('Forbidden', 'forbidden'), expectedStatus: 403 },
        { error: new AppError('Not found', 'not_found'), expectedStatus: 404 },
        { error: new AppError('Conflict', 'conflict'), expectedStatus: 409 },
        { error: new AppError('Unprocessable', 'unprocessable_entity'), expectedStatus: 422 },
      ];

      testCases.forEach(({ error, expectedStatus }) => {
        vi.clearAllMocks();

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
        expect(mockResponse.send).toHaveBeenCalledWith({ message: error.message });
      });
    });

    it('should log error in console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const genericError = new Error('Test error');

      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(genericError);
      consoleSpy.mockRestore();
    });
  });
});

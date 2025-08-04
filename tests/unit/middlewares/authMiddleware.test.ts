import { Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { validateApiKey, AuthenticatedRequest } from '@/middlewares/authMiddleware.js';
import { companyService } from '@/services/companyService.js';

vi.mock('@/services/companyService.js', () => ({
  companyService: {
    getCompanyByApiKey: vi.fn(),
  },
}));

describe('AuthMiddleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = { headers: {} };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('should return 401 when x-api-key header is missing', async () => {
      await validateApiKey(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: 'API key is required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when x-api-key header is empty', async () => {
      mockRequest.headers = { 'x-api-key': '' };

      await validateApiKey(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: 'API key is required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when company is not found', async () => {
      mockRequest.headers = { 'x-api-key': 'invalid-api-key' };
      vi.mocked(companyService.getCompanyByApiKey).mockRejectedValue(new Error('Company not found'));

      await validateApiKey(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'Invalid API key',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() when valid API key is provided with company data set in request', async () => {
      const mockCompany = {
        id: 1,
        name: 'Test Company',
        apiKey: 'valid-api-key',
      };

      mockRequest.headers = { 'x-api-key': 'valid-api-key' };
      vi.mocked(companyService.getCompanyByApiKey).mockResolvedValue(mockCompany);

      await validateApiKey(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(companyService.getCompanyByApiKey).toHaveBeenCalledWith('valid-api-key');
      expect(mockRequest.company).toBeDefined();
      expect(mockRequest.company).toEqual(mockCompany);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.send).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors', async () => {
      mockRequest.headers = { 'x-api-key': 'valid-api-key' };
      vi.mocked(companyService.getCompanyByApiKey).mockRejectedValue(new Error('Database connection error'));

      await validateApiKey(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'Invalid API key',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

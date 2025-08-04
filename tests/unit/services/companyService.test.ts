import { expect, beforeEach, describe, it, vi } from 'vitest';

import type { Company } from '@/repositories/companyRepository.js';
import * as companyRepository from '@/repositories/companyRepository.js';
import { companyService } from '@/services/companyService.js';

describe('Company Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCompanyByApiKey', () => {
    it('should retrieve a company by API key when company exists', async () => {
      const mockCompany: Company = { id: 1, name: 'Test Company', apiKey: 'test-api-key' };
      vi.spyOn(companyRepository, 'findByApiKey').mockResolvedValue(mockCompany);

      const result = await companyService.getCompanyByApiKey('test-api-key');

      expect(result).toEqual(mockCompany);
      expect(companyRepository.findByApiKey).toHaveBeenCalledWith('test-api-key');
      expect(companyRepository.findByApiKey).toHaveBeenCalledOnce();
    });

    it('should throw an error when company is not found', async () => {
      vi.spyOn(companyRepository, 'findByApiKey').mockResolvedValue(null);

      await expect(companyService.getCompanyByApiKey('invalid-key')).rejects.toThrow('Company not found');
      expect(companyRepository.findByApiKey).toHaveBeenCalledWith('invalid-key');
      expect(companyRepository.findByApiKey).toHaveBeenCalledTimes(1);
    });
  });
});

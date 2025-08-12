import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AppError } from '@/errors/AppError.js';
import { findById } from '@/repositories/businessRepository.js';
import { TransactionTypes } from '@/repositories/cardRepository.js';
import { businessService } from '@/services/businessService.js';

vi.mock('@/repositories/businessRepository.js');

describe('Business Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find a business by id', async () => {
    const businessId = 1;
    const business = { id: businessId, name: 'Business 1', type: 'restaurant' as TransactionTypes };

    vi.mocked(findById).mockResolvedValue(business);

    const result = await businessService.findBusinessById(businessId);

    expect(result).toEqual(business);
    expect(findById).toHaveBeenCalledWith(businessId);
  });

  it('should throw an error if the business is not found', async () => {
    const businessId = 1;
    vi.mocked(findById).mockResolvedValue(undefined);

    await expect(businessService.findBusinessById(businessId)).rejects.toThrow(AppError);
  });
});

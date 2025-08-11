import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Recharge } from '@/repositories/rechargeRepository.js';
import * as rechargeRepository from '@/repositories/rechargeRepository.js';
import { rechargeService } from '@/services/rechargesService.js';

const MOCK_CARD_ID = 1;

describe('Recharges Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRechargesByCardId', () => {
    it('should retrieve the recharges by card id when it exists', async () => {
      const mockRecharges: Recharge[] = [
        { id: 1, cardId: 1, amount: 100, timestamp: new Date() },
        { id: 2, cardId: 1, amount: 200, timestamp: new Date() },
      ];
      vi.spyOn(rechargeRepository, 'findByCardId').mockResolvedValue(mockRecharges);

      const result = await rechargeService.getRechargesByCardId(MOCK_CARD_ID);

      expect(result).toEqual(mockRecharges);
      expect(rechargeRepository.findByCardId).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(rechargeRepository.findByCardId).toHaveBeenCalledOnce();
    });
  });

  it('should return a empty list when recharges are not found', async () => {
    const mockRecharges: Recharge[] = [];
    vi.spyOn(rechargeRepository, 'findByCardId').mockResolvedValue(mockRecharges);

    const result = await rechargeService.getRechargesByCardId(MOCK_CARD_ID);

    expect(result).toEqual(mockRecharges);
  });
});

import { expect, beforeEach, describe, it, vi } from 'vitest';

import { PaymentWithBusinessName } from '@/repositories/paymentRepository.js';
import * as paymentRepository from '@/repositories/paymentRepository.js';
import { paymentService } from '@/services/paymentService.js';

const MOCK_CARD_ID = 1;

describe('Payment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPaymentByCardId', () => {
    it('should retrieve the payments by card id when it exists', async () => {
      const mockTransactions: PaymentWithBusinessName[] = [
        { id: 1, cardId: 1, businessId: 1, timestamp: new Date(), amount: 50, businessName: 'Test1' },
        { id: 2, cardId: 1, businessId: 2, timestamp: new Date(), amount: 30, businessName: 'Test2' },
      ];
      vi.spyOn(paymentRepository, 'findByCardId').mockResolvedValue(mockTransactions);

      const result = await paymentService.getPaymentsByCardId(MOCK_CARD_ID);

      expect(result).toEqual(mockTransactions);
      expect(paymentRepository.findByCardId).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(paymentRepository.findByCardId).toHaveBeenCalledOnce();
    });

    it('should return a empty list when payments are not found', async () => {
      const mockTransactions: PaymentWithBusinessName[] = [];
      vi.spyOn(paymentRepository, 'findByCardId').mockResolvedValue(mockTransactions);

      const result = await paymentService.getPaymentsByCardId(MOCK_CARD_ID);

      expect(result).toEqual(mockTransactions);
      expect(paymentRepository.findByCardId).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(paymentRepository.findByCardId).toHaveBeenCalledOnce();
    });
  });
});

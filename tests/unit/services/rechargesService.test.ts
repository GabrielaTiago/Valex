import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AppError } from '@/errors/AppError.js';
import { TransactionTypes } from '@/repositories/cardRepository.js';
import { Recharge } from '@/repositories/rechargeRepository.js';
import * as rechargeRepository from '@/repositories/rechargeRepository.js';
import { cardService } from '@/services/cardService.js';
import { rechargeService } from '@/services/rechargesService.js';

const MOCK_CARD_ID = 1;

const MOCK_CARD = {
  id: MOCK_CARD_ID,
  password: '1234',
  expirationDate: cardService.generateExpirationDate(),
  isBlocked: false,
  isVirtual: false,
  type: 'groceries' as TransactionTypes,
  employeeId: 1,
  number: '1234567890123456',
  cardholderName: 'John Doe',
  securityCode: '123',
};

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

    it('should return a empty list when recharges are not found', async () => {
      const mockRecharges: Recharge[] = [];
      vi.spyOn(rechargeRepository, 'findByCardId').mockResolvedValue(mockRecharges);

      const result = await rechargeService.getRechargesByCardId(MOCK_CARD_ID);

      expect(result).toEqual(mockRecharges);
    });
  });

  describe('createRecharge', () => {
    it('should create a recharge when card is active', async () => {
      vi.spyOn(cardService, 'findCardById').mockResolvedValue(MOCK_CARD);
      vi.spyOn(cardService, 'validateCardExpirationDate').mockResolvedValue(undefined);
      vi.spyOn(rechargeRepository, 'insert').mockResolvedValue(undefined);

      await rechargeService.createRecharge(MOCK_CARD_ID, 100);

      expect(cardService.findCardById).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(cardService.validateCardExpirationDate).toHaveBeenCalledWith(MOCK_CARD.expirationDate);
      expect(rechargeRepository.insert).toHaveBeenCalledWith({ cardId: MOCK_CARD_ID, amount: 100 });
    });

    it('should throw an error when card is not found', async () => {
      vi.spyOn(cardService, 'findCardById').mockRejectedValue(new AppError('Card not found', 'not_found'));

      await expect(rechargeService.createRecharge(MOCK_CARD_ID, 100)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(cardService.validateCardExpirationDate).not.toHaveBeenCalled();
      expect(rechargeRepository.insert).not.toHaveBeenCalled();
    });

    it('should throw an error when card is inactive', async () => {
      vi.spyOn(cardService, 'findCardById').mockResolvedValue({ ...MOCK_CARD, password: undefined });

      await expect(rechargeService.createRecharge(MOCK_CARD_ID, 100)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(cardService.validateCardExpirationDate).not.toHaveBeenCalled();
      expect(rechargeRepository.insert).not.toHaveBeenCalled();
    });

    it('should throw an error when card is expired', async () => {
      vi.spyOn(cardService, 'findCardById').mockResolvedValue(MOCK_CARD);
      vi.spyOn(cardService, 'validateCardExpirationDate').mockRejectedValue(new AppError('Card is expired', 'conflict'));

      await expect(rechargeService.createRecharge(MOCK_CARD_ID, 100)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(cardService.validateCardExpirationDate).toHaveBeenCalledWith(MOCK_CARD.expirationDate);
      expect(rechargeRepository.insert).not.toHaveBeenCalled();
    });
  });
});

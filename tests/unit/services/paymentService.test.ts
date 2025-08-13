import { expect, beforeEach, describe, it, vi } from 'vitest';

import { AppError } from '@/errors/AppError.js';
import { TransactionTypes } from '@/repositories/cardRepository.js';
import { PaymentWithBusinessName } from '@/repositories/paymentRepository.js';
import * as paymentRepository from '@/repositories/paymentRepository.js';
import { businessService } from '@/services/businessService.js';
import { cardService } from '@/services/cardService.js';
import { paymentService } from '@/services/paymentService.js';

vi.mock('@/services/cardService.js', () => ({
  cardService: {
    findCardById: vi.fn(),
    validateCardExpirationDate: vi.fn(),
    decryptPassword: vi.fn(),
    getBalance: vi.fn(),
  },
}));

vi.mock('@/services/businessService.js', () => ({
  businessService: {
    findBusinessById: vi.fn(),
  },
}));

vi.mock('@/repositories/paymentRepository.js');

const MOCK_CARD_ID = 1;

const MOCK_CARD = {
  id: 1,
  employeeId: 1,
  type: 'groceries' as TransactionTypes,
  number: '1234567890123456',
  cardholderName: 'Test Employee',
  securityCode: '123',
  expirationDate: '12/30',
  isVirtual: false,
  isBlocked: false,
  password: '1234',
};

const MOCK_BUSINESS = {
  id: 1,
  name: 'Test1',
  type: 'groceries' as TransactionTypes,
};

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

      vi.mocked(paymentRepository.findByCardId).mockResolvedValue(mockTransactions);

      const result = await paymentService.getPaymentsByCardId(MOCK_CARD_ID);

      expect(result).toEqual(mockTransactions);
      expect(paymentRepository.findByCardId).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(paymentRepository.findByCardId).toHaveBeenCalledOnce();
    });

    it('should return a empty list when payments are not found', async () => {
      const mockTransactions: PaymentWithBusinessName[] = [];

      vi.mocked(paymentRepository.findByCardId).mockResolvedValue(mockTransactions);

      const result = await paymentService.getPaymentsByCardId(MOCK_CARD_ID);

      expect(result).toEqual(mockTransactions);
      expect(paymentRepository.findByCardId).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(paymentRepository.findByCardId).toHaveBeenCalledOnce();
    });
  });

  describe('createPayment', () => {
    it('should create a payment when card is active', async () => {
      const paymentData = { cardId: MOCK_CARD_ID, amount: 100, businessId: MOCK_BUSINESS.id, password: '1234' };

      vi.mocked(cardService.findCardById).mockResolvedValue(MOCK_CARD);
      vi.mocked(cardService.validateCardExpirationDate).mockResolvedValue(undefined);
      vi.mocked(cardService.decryptPassword).mockReturnValue('1234');
      vi.mocked(cardService.getBalance).mockResolvedValue({
        balance: 100,
        transactions: [{ id: 1, cardId: 1, businessId: 1, timestamp: new Date(), amount: 50, businessName: 'Test1' }],
        recharges: [{ id: 1, cardId: 1, timestamp: new Date(), amount: 150 }],
      });
      vi.mocked(businessService.findBusinessById).mockResolvedValue(MOCK_BUSINESS);
      vi.mocked(paymentRepository.insert).mockResolvedValue(undefined);

      await paymentService.createPayment(paymentData);

      expect(cardService.findCardById).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(cardService.validateCardExpirationDate).toHaveBeenCalledWith(MOCK_CARD.expirationDate);
      expect(cardService.decryptPassword).toHaveBeenCalledWith(MOCK_CARD.password);
      expect(businessService.findBusinessById).toHaveBeenCalledWith(MOCK_BUSINESS.id);
      expect(paymentRepository.insert).toHaveBeenCalledWith({ cardId: paymentData.cardId, amount: paymentData.amount, businessId: paymentData.businessId });
      expect(paymentRepository.insert).toHaveBeenCalledOnce();
    });

    it('should throw an error when card not found', async () => {
      const paymentData = { cardId: 999, amount: 100, businessId: MOCK_BUSINESS.id, password: '1234' };

      vi.mocked(cardService.findCardById).mockRejectedValue(new AppError('Card not found', 'not_found'));

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(paymentData.cardId);
      expect(cardService.validateCardExpirationDate).not.toHaveBeenCalled();
      expect(cardService.decryptPassword).not.toHaveBeenCalled();
      expect(cardService.getBalance).not.toHaveBeenCalled();
      expect(businessService.findBusinessById).not.toHaveBeenCalled();
      expect(paymentRepository.insert).not.toHaveBeenCalled();
    });

    it('should throw an error when card is blocked', async () => {
      const mockCard = { ...MOCK_CARD, isBlocked: true };
      const paymentData = { cardId: MOCK_CARD_ID, amount: 100, businessId: MOCK_BUSINESS.id, password: '1234' };

      vi.mocked(cardService.findCardById).mockResolvedValue(mockCard);

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(paymentData.cardId);
      expect(cardService.validateCardExpirationDate).not.toHaveBeenCalled();
      expect(cardService.decryptPassword).not.toHaveBeenCalled();
      expect(cardService.getBalance).not.toHaveBeenCalled();
      expect(businessService.findBusinessById).not.toHaveBeenCalled();
      expect(paymentRepository.insert).not.toHaveBeenCalled();
    });

    it('should throw an error when card is not active', async () => {
      const inactiveCard = { ...MOCK_CARD, password: undefined };
      const paymentData = { cardId: MOCK_CARD_ID, amount: 100, businessId: MOCK_BUSINESS.id, password: '1234' };

      vi.mocked(cardService.findCardById).mockResolvedValue(inactiveCard);

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(paymentData.cardId);
      expect(cardService.findCardById).toHaveBeenCalledOnce();
      expect(cardService.validateCardExpirationDate).not.toHaveBeenCalled();
      expect(cardService.decryptPassword).not.toHaveBeenCalled();
      expect(cardService.getBalance).not.toHaveBeenCalled();
      expect(businessService.findBusinessById).not.toHaveBeenCalled();
      expect(paymentRepository.insert).not.toHaveBeenCalled();
    });

    it('should throw an error when card is expired', async () => {
      const mockCard = { ...MOCK_CARD, expirationDate: '01/20' };
      const paymentData = { cardId: MOCK_CARD_ID, amount: 100, businessId: MOCK_BUSINESS.id, password: '1234' };

      vi.mocked(cardService.findCardById).mockResolvedValue(mockCard);
      vi.mocked(cardService.validateCardExpirationDate).mockRejectedValue(new AppError('Card expired', 'conflict'));

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(paymentData.cardId);
      expect(cardService.validateCardExpirationDate).toHaveBeenCalledWith(mockCard.expirationDate);
      expect(cardService.decryptPassword).not.toHaveBeenCalled();
      expect(cardService.getBalance).not.toHaveBeenCalled();
      expect(businessService.findBusinessById).not.toHaveBeenCalled();
      expect(paymentRepository.insert).not.toHaveBeenCalled();
    });

    it('should throw an error when card is invalid password', async () => {
      const paymentData = { cardId: MOCK_CARD_ID, amount: 100, businessId: MOCK_BUSINESS.id, password: '12345' };

      vi.mocked(cardService.findCardById).mockResolvedValue(MOCK_CARD);
      vi.mocked(cardService.validateCardExpirationDate).mockResolvedValue(undefined);
      vi.mocked(cardService.decryptPassword).mockReturnValue('1234');

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(paymentData.cardId);
      expect(cardService.decryptPassword).toHaveBeenCalledWith(MOCK_CARD.password);
      expect(cardService.validateCardExpirationDate).toHaveBeenCalledWith(MOCK_CARD.expirationDate);
      expect(cardService.getBalance).not.toHaveBeenCalled();
      expect(businessService.findBusinessById).not.toHaveBeenCalled();
      expect(paymentRepository.insert).not.toHaveBeenCalled();
    });

    it('should throw an error when card is insufficient balance', async () => {
      const paymentData = { cardId: MOCK_CARD_ID, amount: 500, businessId: MOCK_BUSINESS.id, password: '1234' };

      vi.mocked(cardService.findCardById).mockResolvedValue(MOCK_CARD);
      vi.mocked(cardService.validateCardExpirationDate).mockResolvedValue(undefined);
      vi.mocked(cardService.decryptPassword).mockReturnValue('1234');
      vi.mocked(cardService.getBalance).mockResolvedValue({ balance: 100, transactions: [], recharges: [] });

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(paymentData.cardId);
      expect(cardService.findCardById).toHaveBeenCalledOnce();
      expect(cardService.decryptPassword).toHaveBeenCalledWith(MOCK_CARD.password);
      expect(cardService.getBalance).toHaveBeenCalledWith(paymentData.cardId);
    });

    it('should throw an error when business is not found', async () => {
      const paymentData = { cardId: MOCK_CARD_ID, amount: 100, businessId: 999, password: '1234' };

      vi.mocked(cardService.findCardById).mockResolvedValue(MOCK_CARD);
      vi.mocked(cardService.validateCardExpirationDate).mockResolvedValue(undefined);
      vi.mocked(cardService.decryptPassword).mockReturnValue('1234');
      vi.mocked(businessService.findBusinessById).mockRejectedValue(new AppError('Business not found', 'not_found'));

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(paymentData.cardId);
      expect(cardService.decryptPassword).toHaveBeenCalledWith(MOCK_CARD.password);
      expect(businessService.findBusinessById).toHaveBeenCalledWith(paymentData.businessId);
      expect(paymentRepository.insert).not.toHaveBeenCalled();
    });

    it('should throw an error when business is not the same type as card', async () => {
      const paymentData = { cardId: MOCK_CARD_ID, amount: 100, businessId: MOCK_BUSINESS.id, password: '1234' };

      vi.mocked(cardService.findCardById).mockResolvedValue(MOCK_CARD);
      vi.mocked(cardService.validateCardExpirationDate).mockResolvedValue(undefined);
      vi.mocked(cardService.decryptPassword).mockReturnValue('1234');
      vi.mocked(businessService.findBusinessById).mockResolvedValue({ ...MOCK_BUSINESS, type: 'restaurant' as TransactionTypes });

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(AppError);
      expect(cardService.findCardById).toHaveBeenCalledWith(paymentData.cardId);
      expect(cardService.decryptPassword).toHaveBeenCalledWith(MOCK_CARD.password);
      expect(businessService.findBusinessById).toHaveBeenCalledWith(paymentData.businessId);
      expect(paymentRepository.insert).not.toHaveBeenCalled();
    });
  });
});

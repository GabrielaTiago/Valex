import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AppError } from '@/errors/AppError.js';
import { findByTypeAndEmployeeId } from '@/repositories/cardRepository.js';
import { cardService } from '@/services/cardService.js';

vi.mock('@/repositories/cardRepository.js');

describe('CardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateUniqueCardNumber()', () => {
    it('should generate a unique card number with only digits', () => {
      const cardNumber = cardService.generateUniqueCardNumber();

      expect(cardNumber).toBeDefined();
      expect(cardNumber).toHaveLength(16);
      expect(cardNumber).toMatch(/^\d+$/);
    });
  });

  describe('generateSecurityCode()', () => {
    it('should generate a security code with only digits', () => {
      const securityCode = cardService.generateSecurityCode();

      expect(securityCode).toBeDefined();
      expect(securityCode).toHaveLength(3);
      expect(securityCode).toMatch(/^\d+$/);
    });
  });

  describe('generateExpirationDate()', () => {
    it('should generate a expiration date 5 years from now in format MM/YY', () => {
      const expirationDate = cardService.generateExpirationDate();

      expect(expirationDate).toBeDefined();
      expect(expirationDate).toHaveLength(5);
      expect(expirationDate).toMatch(/^\d{2}\/\d{2}$/);
    });
  });

  // describe('createCard()', () => {});

  describe('validateEmployeeCardExists()', () => {
    it('should throw an error if the employee already has a card of the same type', async () => {
      vi.mocked(findByTypeAndEmployeeId).mockResolvedValue({
        id: 1,
        employeeId: 1,
        type: 'groceries',
        number: '1234567890123456',
        cardholderName: 'Test Employee',
        securityCode: '123',
        expirationDate: '12/25',
        isVirtual: false,
        isBlocked: false,
      });

      await expect(cardService.validateEmployeeCardExists('groceries', 1)).rejects.toThrow(AppError);
      expect(findByTypeAndEmployeeId).toHaveBeenCalledWith('groceries', 1);
      expect(findByTypeAndEmployeeId).toHaveBeenCalledOnce();
    });

    it('should not throw an error if the employee does not have a card of the same type', async () => {
      vi.mocked(findByTypeAndEmployeeId).mockResolvedValue(undefined);

      await expect(cardService.validateEmployeeCardExists('groceries', 1)).resolves.toBeUndefined();
      expect(findByTypeAndEmployeeId).toHaveBeenCalledWith('groceries', 1);
      expect(findByTypeAndEmployeeId).toHaveBeenCalledOnce();
    });
  });
});

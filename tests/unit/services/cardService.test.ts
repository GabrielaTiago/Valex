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
    it('should generate an encrypted security code', () => {
      const base64Pattern = /^[A-Za-z0-9+/=]+$/;
      const securityCode = cardService.generateSecurityCode();

      expect(securityCode).toBeDefined();
      expect(securityCode).toHaveLength(198); // Cryptr encrypted string length
      expect(securityCode).toMatch(base64Pattern);
    });

    it('should generate different encrypted codes on each call', () => {
      const securityCode1 = cardService.generateSecurityCode();
      const securityCode2 = cardService.generateSecurityCode();

      expect(securityCode1).not.toBe(securityCode2);
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

  describe('generateCardHolderName()', () => {
    it('should generate a card holder name with first and last name in uppercase', () => {
      const cardHolderName = cardService.generateCardHolderName('John Doe');
      expect(cardHolderName).toBe('JOHN DOE');
    });

    it('should generate a card holder name with middle name initials (3+ letters)', () => {
      const cardHolderName = cardService.generateCardHolderName('John Doe Test');
      expect(cardHolderName).toBe('JOHN D TEST');
    });

    it('should ignore middle names with less than 3 letters', () => {
      const cardHolderName = cardService.generateCardHolderName('João da Silva');
      expect(cardHolderName).toBe('JOÃO SILVA');
    });

    it('should handle multiple middle names with 3+ letters', () => {
      const cardHolderName = cardService.generateCardHolderName('José da Silva Rodrigues');
      expect(cardHolderName).toBe('JOSÉ S RODRIGUES');
    });

    it('should handle single name', () => {
      const cardHolderName = cardService.generateCardHolderName('João');
      expect(cardHolderName).toBe('JOÃO');
    });

    it('should handle names with multiple short middle names', () => {
      const cardHolderName = cardService.generateCardHolderName('João da Silva Oliveira do Santos');
      expect(cardHolderName).toBe('JOÃO S O SANTOS');
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

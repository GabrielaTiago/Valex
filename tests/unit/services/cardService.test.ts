import { describe, it, expect, vi } from 'vitest';

import { cardService } from '@/services/cardService.js';

// Mock do cardRepository
vi.mock('@/repositories/cardRepository.js', () => ({
  insert: vi.fn().mockResolvedValue(null),
}));

describe('CardService', () => {
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
});

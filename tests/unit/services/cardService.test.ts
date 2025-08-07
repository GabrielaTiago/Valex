import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { AppError } from '@/errors/AppError.js';
import { findById, findByTypeAndEmployeeId, insert, TransactionTypes } from '@/repositories/cardRepository.js';
import { CardService } from '@/services/cardService.js';
import { EmployeeService } from '@/services/employeeService.js';

vi.mock('@/services/employeeService.js');
vi.mock('@/repositories/cardRepository.js');

const MOCK_CARD = {
  id: 1,
  employeeId: 1,
  type: 'groceries' as TransactionTypes,
  number: '1234567890123456',
  cardholderName: 'Test Employee',
  securityCode: '123',
  expirationDate: '12/25',
  isVirtual: false,
  isBlocked: false,
};

const originalEnv = process.env;
let cardService: CardService;

describe('CardService', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, CRYPTR_SECRET: 'test-secret-key-for-cryptr' };
    cardService = new CardService();
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

  describe('validateEmployeeCardExists()', () => {
    it('should throw an error if the employee already has a card of the same type', async () => {
      vi.mocked(findByTypeAndEmployeeId).mockResolvedValue(MOCK_CARD);

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

  describe('createCard()', () => {
    it('should create a card for an employee', async () => {
      const employee = { id: 1, fullName: 'John Doe', cpf: '12345678901', email: 'john.doe@example.com', companyId: 1 };

      vi.mocked(EmployeeService.prototype.getEmployeeById).mockResolvedValue(employee);
      vi.mocked(findByTypeAndEmployeeId).mockResolvedValue(undefined);
      vi.mocked(insert).mockResolvedValue();

      await expect(cardService.createCard(employee.id, 'groceries')).resolves.toBeUndefined();
      expect(findByTypeAndEmployeeId).toHaveBeenCalledWith('groceries', employee.id);
      expect(findByTypeAndEmployeeId).toHaveBeenCalledOnce();
      expect(insert).toHaveBeenCalledWith({
        employeeId: employee.id,
        number: expect.any(String),
        cardholderName: expect.any(String),
        securityCode: expect.any(String),
        expirationDate: expect.any(String),
        isVirtual: false,
        isBlocked: false,
        type: 'groceries',
      });
      expect(insert).toHaveBeenCalledOnce();
    });

    it('should throw an error if the employee does not exist', async () => {
      vi.mocked(EmployeeService.prototype.getEmployeeById).mockRejectedValue(new AppError('Employee not found', 'not_found'));

      await expect(cardService.createCard(1, 'groceries')).rejects.toThrow(AppError);
      expect(EmployeeService.prototype.getEmployeeById).toHaveBeenCalledWith(1);
      expect(EmployeeService.prototype.getEmployeeById).toHaveBeenCalledOnce();
      expect(findByTypeAndEmployeeId).not.toHaveBeenCalled();
      expect(insert).not.toHaveBeenCalled();
    });

    it('should throw an error if the employee already has a card of the same type', async () => {
      vi.mocked(EmployeeService.prototype.getEmployeeById).mockResolvedValue({
        id: 1,
        fullName: 'John Doe',
        cpf: '12345678901',
        email: 'john.doe@example.com',
        companyId: 1,
      });
      vi.mocked(findByTypeAndEmployeeId).mockResolvedValue(MOCK_CARD);

      await expect(cardService.createCard(1, 'groceries')).rejects.toThrow(AppError);
      expect(findByTypeAndEmployeeId).toHaveBeenCalledWith('groceries', 1);
      expect(findByTypeAndEmployeeId).toHaveBeenCalledOnce();
      expect(insert).not.toHaveBeenCalled();
    });
  });

  describe('findCardById()', () => {
    const cardId = 1;

    it('should find a card by id', async () => {
      vi.mocked(findById).mockResolvedValue(MOCK_CARD);

      await expect(cardService.findCardById(cardId)).resolves.toEqual(MOCK_CARD);
      expect(findById).toHaveBeenCalledWith(cardId);
      expect(findById).toHaveBeenCalledOnce();
    });

    it('should throw an error if the card is not found', async () => {
      vi.mocked(findById).mockResolvedValue(undefined);

      await expect(cardService.findCardById(cardId)).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
      expect(findById).toHaveBeenCalledOnce();
    });
  });

  describe('validateCardExpirationDate()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throw an error if the card is expired (year is in the past)', async () => {
      const expirationDate = '12/24';
      const card = { ...MOCK_CARD, expirationDate };
      const mockDate = new Date('2025-01-01T12:00:00.000Z');

      vi.setSystemTime(mockDate);
      vi.mocked(findById).mockResolvedValue(card);

      await expect(cardService.validateCardExpirationDate(expirationDate)).rejects.toThrow(AppError);
    });

    it('should throw an error if the card is expired (month is in the past)', async () => {
      const expirationDate = '11/24';
      const card = { ...MOCK_CARD, expirationDate };
      const mockDate = new Date('2024-12-01T12:00:00.000Z');

      vi.setSystemTime(mockDate);
      vi.mocked(findById).mockResolvedValue(card);

      await expect(cardService.validateCardExpirationDate(expirationDate)).rejects.toThrow(AppError);
    });

    it('should not throw an error if the card is not expired', async () => {
      const expirationDate = '12/25';
      const card = { ...MOCK_CARD, expirationDate };
      const mockDate = new Date('2024-11-01T00:00:00.000Z');

      vi.setSystemTime(mockDate);
      vi.mocked(findById).mockResolvedValue(card);

      await expect(cardService.validateCardExpirationDate(expirationDate)).resolves.toBeUndefined();
    });
  });

  describe('validateCardSecurityCode()', () => {
    it('should throw an error if the security code is invalid', async () => {
      const encryptedCode = cardService.generateSecurityCode();
      const invalidCode = '456';

      await expect(cardService.validateCardSecurityCode(encryptedCode, invalidCode)).rejects.toThrow(AppError);
    });

    it('should not throw an error if the security code is valid', async () => {
      const originalCode = '123';
      const mockEncryptedCode = 'encrypted_123';

      vi.spyOn(cardService['cryptr'], 'encrypt').mockReturnValue(mockEncryptedCode);
      vi.spyOn(cardService['cryptr'], 'decrypt').mockReturnValue(originalCode);

      await expect(cardService.validateCardSecurityCode(mockEncryptedCode, originalCode)).resolves.toBeUndefined();
    });
  });

  describe('validateCardPassword()', () => {
    it('should throw an error if the password has less than 4 digits', async () => {
      const password = '123';

      await expect(cardService.validateCardPassword(password)).rejects.toThrow(AppError);
    });

    it('should throw an error if the password is not a number', async () => {
      const password = 'test';

      await expect(cardService.validateCardPassword(password)).rejects.toThrow(AppError);
    });

    it('should not throw an error if the password is valid', async () => {
      const password = '1234';

      await expect(cardService.validateCardPassword(password)).resolves.toBeUndefined();
    });
  });

  describe('encryptPassword()', () => {
    it('should encrypt the password', () => {
      const password = '1234';
      const encryptedPassword = cardService.encryptPassword(password);

      expect(encryptedPassword).toBeDefined();
      expect(encryptedPassword).toBeTypeOf('string');
      expect(encryptedPassword.length).toBeGreaterThan(password.length);
      expect(encryptedPassword).not.toBe(password);
    });
  });

  describe('decryptPassword()', () => {
    it('should decrypt the password', () => {
      const password = '1234';
      const encryptedPassword = cardService.encryptPassword(password);
      const decryptedPassword = cardService.decryptPassword(encryptedPassword);

      expect(decryptedPassword).toBe(password);
      expect(decryptedPassword).toBeTypeOf('string');
      expect(decryptedPassword).toHaveLength(4);
    });
  });
});

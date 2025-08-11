import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { AppError } from '@/errors/AppError.js';
import { findById, findByTypeAndEmployeeId, insert, update, TransactionTypes } from '@/repositories/cardRepository.js';
import { CardService } from '@/services/cardService.js';
import { employeeService } from '@/services/employeeService.js';
import { paymentService } from '@/services/paymentService.js';
import { rechargeService } from '@/services/rechargesService.js';

vi.mock('@/services/employeeService.js');
vi.mock('@/services/paymentService.js');
vi.mock('@/services/rechargesService.js');
vi.mock('@/repositories/cardRepository.js');

const MOCK_EMPLOYEE = {
  id: 1,
  fullName: 'John Doe',
  cpf: '12345678901',
  email: 'john.doe@example.com',
  companyId: 1,
};

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

      vi.mocked(employeeService.getEmployeeById).mockResolvedValue(employee);
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
      vi.mocked(employeeService.getEmployeeById).mockRejectedValue(new AppError('Employee not found', 'not_found'));

      await expect(cardService.createCard(1, 'groceries')).rejects.toThrow(AppError);
      expect(employeeService.getEmployeeById).toHaveBeenCalledWith(1);
      expect(employeeService.getEmployeeById).toHaveBeenCalledOnce();
      expect(findByTypeAndEmployeeId).not.toHaveBeenCalled();
      expect(insert).not.toHaveBeenCalled();
    });

    it('should throw an error if the employee already has a card of the same type', async () => {
      vi.mocked(employeeService.getEmployeeById).mockResolvedValue({
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

  describe('activateCard()', () => {
    it('should activate a card', async () => {
      const password = '1234';
      const securityCode = '123';
      const encryptedSecurityCode = 'encrypted_123';
      const card = { ...MOCK_CARD, isBlocked: true, securityCode: encryptedSecurityCode };

      vi.mocked(findById).mockResolvedValue(card);
      vi.mocked(update).mockResolvedValue();
      vi.spyOn(cardService['cryptr'], 'decrypt').mockReturnValue(securityCode);

      await expect(cardService.activateCard(card.id, password, securityCode)).resolves.toBeUndefined();
      expect(findById).toHaveBeenCalledWith(card.id);
      expect(findById).toHaveBeenCalledOnce();
      expect(update).toHaveBeenCalledWith(card.id, { isBlocked: false, password: expect.any(String) });
    });

    it('should throw an error if the card is not found', async () => {
      const cardId = 1;
      const password = '1234';
      const securityCode = '123';

      vi.mocked(findById).mockResolvedValue(undefined);

      await expect(cardService.activateCard(cardId, password, securityCode)).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
      expect(findById).toHaveBeenCalledOnce();
      expect(update).not.toHaveBeenCalled();
    });

    it('should throw an error if the security code is invalid', async () => {
      const cardId = 1;
      const password = '1234';
      const securityCode = '123';
      const encryptedSecurityCode = 'encrypted_123';
      const card = { ...MOCK_CARD, securityCode: encryptedSecurityCode };
      const invalidSecurityCode = '456';

      vi.mocked(findById).mockResolvedValue(card);
      vi.spyOn(cardService['cryptr'], 'decrypt').mockReturnValue(invalidSecurityCode);

      await expect(cardService.activateCard(cardId, password, securityCode)).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
      expect(findById).toHaveBeenCalledOnce();
      expect(update).not.toHaveBeenCalled();
    });

    it('should throw an error if the password is invalid', async () => {
      const cardId = 1;
      const password = '123';
      const securityCode = '123';
      const encryptedSecurityCode = 'encrypted_123';
      const card = { ...MOCK_CARD, securityCode: encryptedSecurityCode };

      vi.mocked(findById).mockResolvedValue(card);
      vi.spyOn(cardService['cryptr'], 'decrypt').mockReturnValue(securityCode);

      await expect(cardService.activateCard(cardId, password, securityCode)).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
      expect(findById).toHaveBeenCalledOnce();
      expect(update).not.toHaveBeenCalled();
    });

    it('should throw an error if the card is already activated', async () => {
      const cardId = 1;
      const password = '1234';
      const securityCode = '123';
      const encryptedPassword = cardService.encryptPassword(password);
      const card = { ...MOCK_CARD, password: encryptedPassword };

      vi.mocked(findById).mockResolvedValue(card);
      vi.spyOn(cardService['cryptr'], 'decrypt').mockReturnValue(securityCode);

      await expect(cardService.activateCard(cardId, password, securityCode)).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
      expect(findById).toHaveBeenCalledOnce();
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('viewEmployeeCard()', () => {
    it('should view an employee card', async () => {
      const employeeId = 1;
      const cardId = 1;
      const password = '1234';
      const securityCode = '123';
      const encryptedPassword = cardService.encryptPassword(password);
      const card = { ...MOCK_CARD, password: encryptedPassword };

      vi.mocked(employeeService.getEmployeeById).mockResolvedValue(MOCK_EMPLOYEE);
      vi.mocked(findById).mockResolvedValue(card);
      vi.spyOn(cardService['cryptr'], 'decrypt').mockReturnValueOnce(password).mockReturnValueOnce(securityCode);

      const result = await cardService.viewEmployeeCard(employeeId, cardId, password);
      expect(employeeService.getEmployeeById).toHaveBeenCalledWith(employeeId);
      expect(findById).toHaveBeenCalledWith(cardId);
      expect(cardService['cryptr'].decrypt).toHaveBeenCalledWith(card.password);
      expect(result).toEqual({
        cardholderName: card.cardholderName,
        number: card.number,
        securityCode: securityCode,
        expirationDate: card.expirationDate,
        isVirtual: card.isVirtual,
        type: card.type,
      });
    });

    it('should throw an error if the employee does not exist', async () => {
      const employeeId = 1;
      const cardId = 1;
      const password = '1234';

      vi.mocked(employeeService.getEmployeeById).mockRejectedValue(new AppError('Employee not found', 'not_found'));

      await expect(cardService.viewEmployeeCard(employeeId, cardId, password)).rejects.toThrow(AppError);
      expect(employeeService.getEmployeeById).toHaveBeenCalledWith(employeeId);
      expect(findById).not.toHaveBeenCalled();
    });

    it('should throw an error if the card is not found', async () => {
      const employeeId = 1;
      const cardId = 1;
      const password = '1234';

      vi.mocked(employeeService.getEmployeeById).mockResolvedValue(MOCK_EMPLOYEE);
      vi.mocked(findById).mockResolvedValue(undefined);

      await expect(cardService.viewEmployeeCard(employeeId, cardId, password)).rejects.toThrow(AppError);
      expect(employeeService.getEmployeeById).toHaveBeenCalledWith(employeeId);
      expect(findById).toHaveBeenCalledWith(cardId);
    });

    it('should throw an error if the card is not active', async () => {
      const employeeId = 1;
      const cardId = 1;
      const password = '1234';

      vi.mocked(employeeService.getEmployeeById).mockResolvedValue(MOCK_EMPLOYEE);
      vi.mocked(findById).mockResolvedValue({ ...MOCK_CARD, password: undefined });

      await expect(cardService.viewEmployeeCard(employeeId, cardId, password)).rejects.toThrow(AppError);
      expect(employeeService.getEmployeeById).toHaveBeenCalledWith(employeeId);
      expect(findById).toHaveBeenCalledWith(cardId);
    });

    it('should throw an error if the password is invalid', async () => {
      const employeeId = 1;
      const cardId = 1;
      const password = '1234';
      const encryptedPassword = cardService.encryptPassword(password);

      vi.mocked(employeeService.getEmployeeById).mockResolvedValue(MOCK_EMPLOYEE);
      vi.mocked(findById).mockResolvedValue({ ...MOCK_CARD, password: encryptedPassword });

      await expect(cardService.viewEmployeeCard(employeeId, cardId, '123')).rejects.toThrow(AppError);
      expect(employeeService.getEmployeeById).toHaveBeenCalledWith(employeeId);
      expect(findById).toHaveBeenCalledWith(cardId);
    });
  });

  describe('getBalance()', () => {
    it('should get the balance of a card', async () => {
      const cardId = 1;
      const recharges = [
        { amount: 100, id: 1, cardId: 1, timestamp: new Date() },
        { amount: 200, id: 2, cardId: 1, timestamp: new Date() },
      ];
      const payments = [
        { amount: 50, id: 1, cardId: 1, businessId: 1, timestamp: new Date(), businessName: 'Business 1' },
        { amount: 30, id: 2, cardId: 1, businessId: 2, timestamp: new Date(), businessName: 'Business 2' },
      ];

      vi.mocked(findById).mockResolvedValue(MOCK_CARD);
      vi.mocked(rechargeService.getRechargesByCardId).mockResolvedValue(recharges);
      vi.mocked(paymentService.getPaymentsByCardId).mockResolvedValue(payments);

      const result = await cardService.getBalance(cardId);

      expect(findById).toHaveBeenCalledWith(cardId);
      expect(rechargeService.getRechargesByCardId).toHaveBeenCalledWith(cardId);
      expect(paymentService.getPaymentsByCardId).toHaveBeenCalledWith(cardId);
      expect(result).toEqual({ balance: 220, transactions: payments, recharges });
    });

    it('should return 0 when there are no recharges or payments', async () => {
      const cardId = 1;

      vi.mocked(findById).mockResolvedValue(MOCK_CARD);
      vi.mocked(rechargeService.getRechargesByCardId).mockResolvedValue([]);
      vi.mocked(paymentService.getPaymentsByCardId).mockResolvedValue([]);

      const result = await cardService.getBalance(cardId);

      expect(findById).toHaveBeenCalledWith(cardId);
      expect(result).toEqual({ balance: 0, transactions: [], recharges: [] });
    });

    it('should throw an error when the card is not found', async () => {
      const cardId = 1;

      vi.mocked(findById).mockResolvedValue(undefined);

      await expect(cardService.getBalance(cardId)).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
      expect(paymentService.getPaymentsByCardId).not.toHaveBeenCalled();
      expect(rechargeService.getRechargesByCardId).not.toHaveBeenCalled();
    });
  });

  describe('getSum()', () => {
    it('should return the sum of the list', () => {
      const list = [{ amount: 100 }, { amount: 200 }];

      const result = cardService.getSum(list);

      expect(result).toBe(300);
    });

    it('should return 0 when the list is empty', () => {
      const list: { amount: number }[] = [];
      const result = cardService.getSum(list);
      expect(result).toBe(0);
    });
  });

  describe('blockCard()', () => {
    it('should block a card', async () => {
      const cardId = 1;
      const password = '1234';
      const card = { ...MOCK_CARD, password: cardService.encryptPassword(password) };

      vi.mocked(findById).mockResolvedValue(card);
      vi.mocked(update).mockResolvedValue();

      await expect(cardService.blockCard(cardId, password)).resolves.toBeUndefined();
      expect(findById).toHaveBeenCalledWith(cardId);
      expect(update).toHaveBeenCalledWith(cardId, { isBlocked: true });
    });

    it('should throw an error if the card is not found', async () => {
      const cardId = 1;
      const password = '1234';

      vi.mocked(findById).mockResolvedValue(undefined);

      await expect(cardService.blockCard(cardId, password)).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
    });

    it('should throw an error if the card is already blocked', async () => {
      const cardId = 1;
      const password = '1234';
      const card = { ...MOCK_CARD, password: cardService.encryptPassword(password), isBlocked: true };

      vi.mocked(findById).mockResolvedValue(card);

      await expect(cardService.blockCard(cardId, password)).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
    });

    it('should throw an error if the card is not active', async () => {
      const cardId = 1;
      const password = '1234';
      const card = { ...MOCK_CARD, password: undefined };

      vi.mocked(findById).mockResolvedValue(card);

      await expect(cardService.blockCard(cardId, password)).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
    });

    it('should throw an error if the password is invalid', async () => {
      const cardId = 1;
      const password = '1234';
      const card = { ...MOCK_CARD, password: cardService.encryptPassword(password) };

      vi.mocked(findById).mockResolvedValue(card);

      await expect(cardService.blockCard(cardId, '12345')).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
    });

    it('should throw an error if the card is expired', async () => {
      const cardId = 1;
      const password = '1234';
      const card = { ...MOCK_CARD, password: cardService.encryptPassword(password), expirationDate: '01/25' };

      vi.mocked(findById).mockResolvedValue(card);

      await expect(cardService.blockCard(cardId, password)).rejects.toThrow(AppError);
      expect(findById).toHaveBeenCalledWith(cardId);
    });
  });
});

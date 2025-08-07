import 'dotenv/config';
import Chance from 'chance';
import Cryptr from 'cryptr';

import { AppError } from '@/errors/AppError.js';
import { findById, findByTypeAndEmployeeId, insert, TransactionTypes, update } from '@/repositories/cardRepository.js';
import { EmployeeService } from '@/services/employeeService.js';
import { createApiValidator } from '@/utils/envValidator.js';

export class CardService {
  private readonly chance = new Chance();
  private readonly employeeService = new EmployeeService();
  private readonly apiValidator = createApiValidator();
  private readonly cryptr: Cryptr;

  constructor() {
    this.apiValidator.validate();
    this.cryptr = new Cryptr(this.apiValidator.getString('CRYPTR_SECRET'));
  }

  generateUniqueCardNumber(): string {
    const cardNumber = this.chance.cc();
    return cardNumber.replace(/\D/g, '').padEnd(16, '0').slice(0, 16);
  }

  generateSecurityCode(): string {
    const securityCode = this.chance.string({ length: 3, pool: '0123456789' });
    const encryptedSecurityCode = this.cryptr.encrypt(securityCode);
    return encryptedSecurityCode;
  }

  generateExpirationDate(): string {
    const actualDate = new Date();
    const expirationDate = new Date(actualDate.setFullYear(actualDate.getFullYear() + 5));
    const date = expirationDate.toISOString().split('T')[0];
    const month = date.split('-')[1];
    const year = date.split('-')[0].slice(-2);
    return `${month}/${year}`;
  }

  generateCardHolderName(name: string) {
    const nameParts: string[] = name.split(' ').filter((part) => part.length > 0);

    // single name
    if (nameParts.length === 1) return nameParts[0].toUpperCase();

    // first and last name
    const firstName = nameParts[0].toUpperCase();
    const lastName = nameParts[nameParts.length - 1].toUpperCase();

    // middle names, excluding first and last
    const middleNames = nameParts.slice(1, -1);

    // middle names with 3+ letters
    const middleInitials = middleNames.filter((name) => name.length >= 3).map((name) => name[0].toUpperCase());

    const cardholderName = middleInitials.length > 0 ? `${firstName} ${middleInitials.join(' ')} ${lastName}` : `${firstName} ${lastName}`;
    return cardholderName;
  }

  async createCard(employeeId: number, type: TransactionTypes) {
    const employee = await this.employeeService.getEmployeeById(employeeId);
    await this.validateEmployeeCardExists(type, employeeId);

    const cardData = {
      employeeId,
      cardholderName: this.generateCardHolderName(employee.fullName),
      number: this.generateUniqueCardNumber(),
      securityCode: this.generateSecurityCode(),
      expirationDate: this.generateExpirationDate(),
      isVirtual: false,
      isBlocked: false,
      type,
    };

    await insert(cardData);
  }

  async validateEmployeeCardExists(type: TransactionTypes, employeeId: number) {
    const existingCard = await findByTypeAndEmployeeId(type, employeeId);
    if (existingCard) throw new AppError('Employee already has a card of this type', 'conflict');
  }

  async activateCard(cardId: number, password: string, securityCode: string) {
    const card = await this.findCardById(cardId);
    if (card.password) throw new AppError('Card is already active', 'conflict');
    await this.validateCardExpirationDate(card.expirationDate);
    await this.validateCardSecurityCode(securityCode);
    await update(cardId, { isBlocked: false, password, securityCode });
  }

  async findCardById(cardId: number) {
    const card = await findById(cardId);
    if (!card) throw new AppError('Card not found', 'not_found');
    return card;
  }

  async validateCardExpirationDate(expirationDate: string) {
    const expirationDateParts = expirationDate.split('/');
    const month = parseInt(expirationDateParts[0]);
    const year = parseInt(expirationDateParts[1]);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (year < currentYear) throw new AppError('Card is expired', 'conflict');
    if (year === currentYear && month < currentMonth) throw new AppError('Card is expired', 'conflict');
  }

  async validateCardSecurityCode(securityCode: string) {
    const decryptedSecurityCode = this.cryptr.decrypt(securityCode);
    if (decryptedSecurityCode !== securityCode) throw new AppError('Invalid security code', 'unauthorized');
  }
}

export const cardService = new CardService();

import Chance from 'chance';

import { AppError } from '@/errors/AppError.js';
import { findByTypeAndEmployeeId, insert, TransactionTypes } from '@/repositories/cardRepository.js';
import { EmployeeService } from '@/services/employeeService.js';

export class CardService {
  private readonly chance = new Chance();
  private readonly employeeService = new EmployeeService();

  generateUniqueCardNumber(): string {
    const cardNumber = this.chance.cc();
    return cardNumber;
  }

  generateSecurityCode(): string {
    const securityCode = this.chance.string({ length: 3, pool: '0123456789' });
    return securityCode;
  }

  generateExpirationDate(): string {
    const actualDate = new Date();
    const expirationDate = new Date(actualDate.setFullYear(actualDate.getFullYear() + 5));
    const date = expirationDate.toISOString().split('T')[0];
    const month = date.split('-')[1];
    const year = date.split('-')[0].slice(-2);
    return `${month}/${year}`;
  }

  async createCard(employeeId: number, type: TransactionTypes) {
    await this.employeeService.getEmployeeById(employeeId);
    await this.validateEmployeeCardExists(type, employeeId);

    const cardData = {
      employeeId,
      cardholderName: '',
      number: this.generateUniqueCardNumber(),
      securityCode: this.generateSecurityCode(),
      expirationDate: this.generateExpirationDate(),
      isVirtual: false,
      isBlocked: false,
      type,
    };

    return insert(cardData);
  }

  async validateEmployeeCardExists(type: TransactionTypes, employeeId: number) {
    const existingCard = await findByTypeAndEmployeeId(type, employeeId);
    if (existingCard) throw new AppError('Employee already has a card of this type', 'conflict');
  }
}

export const cardService = new CardService();

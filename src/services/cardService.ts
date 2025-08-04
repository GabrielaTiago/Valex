import Chance from 'chance';

import * as cardRepository from '@/repositories/cardRepository.js';
import { Company } from '@/repositories/companyRepository.js';

export class CardService {
  private readonly chance = new Chance();

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

  async createCard(company: Company, employeeId: number, type: string) {
    const cardData = {
      employeeId,
      cardholderName: '',
      number: this.generateUniqueCardNumber(),
      securityCode: this.generateSecurityCode(),
      expirationDate: this.generateExpirationDate(),
      isVirtual: false,
      isBlocked: false,
      type: type as cardRepository.TransactionTypes,
    };

    return cardRepository.insert(cardData);
  }
}

export const cardService = new CardService();

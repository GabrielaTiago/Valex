import * as cardRepository from '@/repositories/cardRepository.js';
import { Company } from '@/repositories/companyRepository.js';

export class CardService {
  private generateUniqueCardNumber() {
    // TODO: Implementar lógica para gerar número de cartão único
  }

  private generateSecurityCode() {
    // TODO: Implementar lógica para gerar código de segurança
  }

  private generateExpirationDate() {
    // TODO: Implementar lógica para gerar data de expiração
  }

  async createCard(company: Company, employeeId: number, type: string) {
    const cardData = {
      employeeId,
      number: '',
      cardholderName: '',
      securityCode: '',
      expirationDate: '',
      isVirtual: false,
      isBlocked: false,
      type: type as cardRepository.TransactionTypes,
    };

    return cardRepository.insert(cardData);
  }
}

export const cardService = new CardService();

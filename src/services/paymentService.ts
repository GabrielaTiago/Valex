import { AppError } from '@/errors/AppError.js';
import { findByCardId, insert } from '@/repositories/paymentRepository.js';
import { businessService } from '@/services/businessService.js';
import { cardService } from '@/services/cardService.js';

export class PaymentService {
  async getPaymentsByCardId(cardId: number) {
    const payments = await findByCardId(cardId);
    return payments;
  }

  async createPayment(data: { cardId: number; amount: number; businessId: number; password: string }) {
    const { cardId, amount, businessId, password } = data;

    const card = await cardService.findCardById(cardId);
    if (card.isBlocked) throw new AppError('Card is blocked', 'forbidden');
    if (!card.password) throw new AppError('Card is not active', 'forbidden');

    await cardService.validateCardExpirationDate(card.expirationDate);

    const decryptedPassword = cardService.decryptPassword(card.password);
    if (decryptedPassword !== password) throw new AppError('Invalid password', 'unauthorized');

    const { type: businessType } = await businessService.findBusinessById(businessId);
    if (card.type !== businessType) throw new AppError('Invalid business type', 'forbidden');

    const { balance } = await cardService.getBalance(cardId);
    if (amount > balance) throw new AppError('Insufficient balance', 'forbidden');

    await insert({ cardId, amount, businessId });
  }
}

export const paymentService = new PaymentService();

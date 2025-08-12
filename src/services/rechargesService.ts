import { AppError } from '@/errors/AppError.js';
import { insert, findByCardId } from '@/repositories/rechargeRepository.js';
import { cardService } from '@/services/cardService.js';

export class RechargesService {
  async getRechargesByCardId(cardId: number) {
    const recharges = await findByCardId(cardId);
    return recharges;
  }

  async createRecharge(cardId: number, amount: number) {
    const card = await cardService.findCardById(cardId);
    if (!card.password) throw new AppError('Card is inactive', 'conflict');
    await cardService.validateCardExpirationDate(card.expirationDate);
    await insert({ cardId, amount });
  }
}

export const rechargeService = new RechargesService();

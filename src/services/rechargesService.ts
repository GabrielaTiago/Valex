import { findByCardId } from '@/repositories/rechargeRepository.js';

export class RechargesService {
  async getRechargesByCardId(cardId: number) {
    const recharges = await findByCardId(cardId);
    return recharges;
  }
}

export const rechargeService = new RechargesService();

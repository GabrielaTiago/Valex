import { findByCardId } from '@/repositories/paymentRepository.js';

export class PaymentService {
  async getPaymentsByCardId(cardId: number) {
    const payments = await findByCardId(cardId);
    return payments;
  }
}

export const paymentService = new PaymentService();

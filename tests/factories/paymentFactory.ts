import { connection } from '@/config/postgres.js';
import { Payment } from '@/repositories/paymentRepository.js';

/**
 * Creates a payment for a card.
 * @param cardId The ID of the card to pay.
 * @param amount The amount to pay.
 * @param businessId The ID of the business. Defaults to 1.
 * @returns The payment created in the database.
 */
export async function createPayment(cardId: number, amount: number, businessId: number = 1) {
  const payment = await connection.query<Payment>(`INSERT INTO payments ("cardId", "businessId", amount) VALUES ($1, $2, $3) RETURNING *`, [
    cardId,
    businessId,
    amount,
  ]);
  return payment.rows[0];
}

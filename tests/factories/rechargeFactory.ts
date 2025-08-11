import { connection } from '@/config/postgres.js';
import { Recharge } from '@/repositories/rechargeRepository.js';

/**
 * Creates a recharge for a card.
 * @param cardId The ID of the card to recharge.
 * @param amount The amount to recharge.
 * @returns The recharge created in the database.
 */
export async function createRecharge(cardId: number, amount: number) {
  const recharge = await connection.query<Recharge>(`INSERT INTO recharges ("cardId", amount) VALUES ($1, $2) RETURNING *`, [cardId, amount]);
  return recharge.rows[0];
}

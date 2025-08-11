import { connection } from '@/config/postgres.js';
import { type Card } from '@/repositories/cardRepository.js';
import { cardService } from '@/services/cardService.js';

/**
 * Create an inactive card directly in the database with a known security code.
 * This is useful to prepare the scenario for testing activation.
 * @param employeeId The ID of the employee to associate with the card.
 * @param securityCode The security code in plain text (e.g., '123').
 * @returns The card created in the database.
 */
export async function createInactiveCard(employeeId: number, securityCode: string): Promise<Card> {
  const encryptedSecurityCode = cardService.encryptPassword(securityCode);
  const expirationDate = cardService.generateExpirationDate();

  const result = await connection.query<Card>(
    `
      INSERT INTO cards 
        ("employeeId", number, "cardholderName", "securityCode", "expirationDate", "isVirtual", "isBlocked", type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [employeeId, '1234567890123456', 'TEST EMPLOYEE', encryptedSecurityCode, expirationDate, false, false, 'groceries']
  );

  return result.rows[0];
}

/**
 * Create an active card directly in the database.
 * This is useful for testing activation scenarios.
 * @param employeeId The ID of the employee to associate with the card.
 * @param securityCode The security code in plain text (e.g., '123').
 * @param password The password in plain text (e.g., '1234').
 * @returns The active card created in the database.
 */
export async function createActiveCard(password: string): Promise<Card> {
  const encryptedSecurityCode = cardService.encryptPassword('123');
  const encryptedPassword = cardService.encryptPassword(password);
  const expirationDate = cardService.generateExpirationDate();

  const result = await connection.query<Card>(
    `
      INSERT INTO cards 
        ("employeeId", number, "cardholderName", "securityCode", "expirationDate", "isVirtual", "isBlocked", type, password)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
    [1, '1234567890123456', 'TEST EMPLOYEE', encryptedSecurityCode, expirationDate, false, false, 'groceries', encryptedPassword]
  );

  return result.rows[0];
}

/**
 * Create an expired active card directly in the database.
 * This is useful for testing expiration scenarios.
 * @param employeeId The ID of the employee to associate with the card.
 * @param securityCode The security code in plain text (e.g., '123').
 * @param password The password in plain text (e.g., '1234').
 * @returns The expired card created in the database.
 */
export async function createExpiredActiveCard(password: string): Promise<Card> {
  const encryptedSecurityCode = cardService.encryptPassword('123');
  const encryptedPassword = cardService.encryptPassword(password);

  const result = await connection.query<Card>(
    `
      INSERT INTO cards 
        ("employeeId", number, "cardholderName", "securityCode", "expirationDate", "isVirtual", "isBlocked", type, password)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
    [1, '1234567890123456', 'TEST EMPLOYEE', encryptedSecurityCode, '01/20', false, false, 'groceries', encryptedPassword]
  );

  return result.rows[0];
}

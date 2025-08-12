import { Chance } from 'chance';

import { connection } from '@/config/postgres.js';
import { TransactionTypes, type Card, type CardInsertData } from '@/repositories/cardRepository.js';
import { cardService } from '@/services/cardService.js';

interface CardCreationOptions {
  employeeId?: number;
  password?: string;
  isBlocked?: boolean;
  isExpired?: boolean;
  securityCode?: string;
  type?: TransactionTypes;
}

export class CardFactory {
  /**
   * Create and insert a card into the database with customizable options.
   * @param options - Define the state of the card to be created.
   * @returns The created card.
   */
  async create(options: CardCreationOptions = {}): Promise<Card> {
    const defaultOptions = {
      employeeId: 1,
      password: '1234',
      isBlocked: false,
      isExpired: false,
      securityCode: '123',
      type: 'groceries',
    };

    const finalOptions = { ...defaultOptions, ...options };

    const cardData: Partial<CardInsertData> = {
      employeeId: finalOptions.employeeId,
      number: new Chance().cc({ type: 'visa' }).replace(/-/g, ''),
      cardholderName: 'TEST EMPLOYEE',
      securityCode: cardService.encryptPassword(finalOptions.securityCode),
      expirationDate: finalOptions.isExpired ? '01/20' : cardService.generateExpirationDate(),
      isVirtual: false,
      isBlocked: finalOptions.isBlocked,
      type: finalOptions.type as TransactionTypes,
    };

    // Add password only if it is provided in the options
    if (options.password) {
      cardData.password = cardService.encryptPassword(finalOptions.password);
    }

    // Build the query dynamically
    const columns = Object.keys(cardData)
      .map((c) => `"${c}"`)
      .join(', ');
    const valuesClause = Object.keys(cardData)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(cardData);

    const result = await connection.query<Card>(`INSERT INTO cards (${columns}) VALUES (${valuesClause}) RETURNING *`, values);

    return result.rows[0];
  }
}

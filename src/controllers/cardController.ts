import { Response } from 'express';

import { AuthenticatedRequest } from '@/middlewares/authMiddleware.js';
import { TransactionTypes } from '@/repositories/cardRepository.js';
import { cardService } from '@/services/cardService.js';

class CardController {
  async createCard(req: AuthenticatedRequest, res: Response) {
    const { employeeId, type } = req.body;

    await cardService.createCard(employeeId, type as TransactionTypes);
    res.status(201).send({ message: 'Card created successfully' });
  }
}

export const cardController = new CardController();

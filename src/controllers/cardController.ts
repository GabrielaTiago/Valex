import { Request, Response } from 'express';

import { AuthenticatedRequest } from '@/middlewares/authMiddleware.js';
import { TransactionTypes } from '@/repositories/cardRepository.js';
import { cardService } from '@/services/cardService.js';

class CardController {
  async createCard(req: AuthenticatedRequest, res: Response) {
    const { employeeId, type } = req.body;

    await cardService.createCard(employeeId, type as TransactionTypes);
    res.status(201).send({ message: 'Card created successfully' });
  }

  async activateCard(req: Request, res: Response) {
    const { cardId, password, securityCode } = req.body;
    await cardService.activateCard(cardId, password, securityCode);
    res.status(200).send({ message: 'Card activated successfully' });
  }

  async viewEmployeeCard(req: Request, res: Response) {
    const { employeeId, cardId, password } = req.body;
    const card = await cardService.viewEmployeeCard(employeeId, cardId, password);
    res.status(200).send(card);
  }

  async getBalance(req: Request, res: Response) {
    const { cardId } = req.params;
    const balance = await cardService.getBalance(Number(cardId));
    res.status(200).send(balance);
  }
}

export const cardController = new CardController();

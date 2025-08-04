import { Response } from 'express';

import { AuthenticatedRequest } from '@/middlewares/authMiddleware.js';
import { Company } from '@/repositories/companyRepository.js';
import { cardService } from '@/services/cardService.js';

class CardController {
  async createCard(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId, type } = req.body;
      const company = req.company as Company;

      await cardService.createCard(company, employeeId, type);
      res.status(201).send({ message: 'Card created successfully' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const cardController = new CardController();

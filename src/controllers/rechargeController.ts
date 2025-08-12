import { Request, Response } from 'express';

import { rechargeService } from '@/services/rechargesService.js';

class RechargeController {
  async createRecharge(req: Request, res: Response) {
    const { cardId, amount } = req.body;
    await rechargeService.createRecharge(Number(cardId), amount);
    res.status(201).send({ message: 'Recharge created successfully' });
  }
}

export const rechargeController = new RechargeController();

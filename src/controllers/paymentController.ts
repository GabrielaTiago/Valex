import { Request, Response } from 'express';

import { paymentService } from '@/services/paymentService.js';

export class PaymentController {
  async createPayment(req: Request, res: Response) {
    const { cardId, amount, businessId, password } = req.body;
    await paymentService.createPayment({ cardId, amount, businessId, password });
    res.status(201).send({ message: 'Payment created successfully' });
  }
}

export const paymentController = new PaymentController();

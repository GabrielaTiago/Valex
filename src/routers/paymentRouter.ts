import { Router } from 'express';

import { paymentController } from '@/controllers/paymentController.js';
import { validateSchema } from '@/middlewares/validateSchema.js';
import { SCHEMAS } from '@/schemas/schemas.js';

const paymentRouter = Router();

paymentRouter.post('/', validateSchema(SCHEMAS.payment), paymentController.createPayment);

export { paymentRouter };

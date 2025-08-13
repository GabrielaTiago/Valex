import { readFileSync } from 'fs';
import { join } from 'path';

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = JSON.parse(readFileSync(join(process.cwd(), 'swagger.json'), 'utf-8'));

import { cardRouter } from '@/routers/cardRouter.js';
import { paymentRouter } from '@/routers/paymentRouter.js';
import { rechargeRouter } from '@/routers/rechargeRouter.js';
const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).send('OK - API is running');
});
router.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/cards', cardRouter);
router.use('/recharges', rechargeRouter);
router.use('/payments', paymentRouter);

export { router };

import { Router } from 'express';

import { cardRouter } from '@/routers/cardRouter.js';
import { rechargeRouter } from '@/routers/rechargeRouter.js';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).send('OK - API is running');
});

router.use('/cards', cardRouter);
router.use('/recharges', rechargeRouter);

export { router };

import { Router } from 'express';

import { rechargeController } from '@/controllers/rechargeController.js';
import { validateApiKey } from '@/middlewares/authMiddleware.js';
import { validateSchema } from '@/middlewares/validateSchema.js';
import { SCHEMAS } from '@/schemas/schemas.js';

const rechargeRouter = Router();

rechargeRouter.post('/', validateApiKey, validateSchema(SCHEMAS.recharge), rechargeController.createRecharge.bind(rechargeController));

export { rechargeRouter };

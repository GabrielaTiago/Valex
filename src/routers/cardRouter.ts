import { Router } from 'express';

import { cardController } from '@/controllers/cardController.js';
import { validateApiKey } from '@/middlewares/authMiddleware.js';
import { validateSchema } from '@/middlewares/validateSchema.js';
import { SCHEMAS } from '@/schemas/schemas.js';

const cardRouter = Router();

cardRouter.post('/', validateApiKey, validateSchema(SCHEMAS.createCard), cardController.createCard.bind(cardController));
cardRouter.post('/activate', validateSchema(SCHEMAS.activateCard), cardController.activateCard.bind(cardController));
cardRouter.post('/view', validateSchema(SCHEMAS.viewCard), cardController.viewEmployeeCard.bind(cardController));
cardRouter.get('/balance/:cardId', cardController.getBalance.bind(cardController));
cardRouter.post('/block', validateSchema(SCHEMAS.blockCard), cardController.blockCard.bind(cardController));

export { cardRouter };

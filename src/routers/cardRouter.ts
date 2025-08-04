import { Router } from 'express';

import { cardController } from '@/controllers/cardController.js';
import { validateApiKey } from '@/middlewares/authMiddleware.js';

const cardRouter = Router();

cardRouter.post('/', validateApiKey, cardController.createCard.bind(cardController));

export { cardRouter };

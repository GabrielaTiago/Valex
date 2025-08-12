import { activateCardSchema, blockCardSchema, createCardSchema, viewCardSchema } from './cardSchemas.js';
import { rechargeSchema } from './rechargeSchemas.js';

export const SCHEMAS = {
  createCard: createCardSchema,
  activateCard: activateCardSchema,
  viewCard: viewCardSchema,
  blockCard: blockCardSchema,
  recharge: rechargeSchema,
};

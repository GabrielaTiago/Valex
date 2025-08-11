import { activateCardSchema, blockCardSchema, createCardSchema, viewCardSchema } from './cardSchemas.js';

export const SCHEMAS = {
  createCard: createCardSchema,
  activateCard: activateCardSchema,
  viewCard: viewCardSchema,
  blockCard: blockCardSchema,
};

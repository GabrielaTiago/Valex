import { activateCardSchema, createCardSchema, viewCardSchema } from './cardSchemas.js';

export const SCHEMAS = {
  createCard: createCardSchema,
  activateCard: activateCardSchema,
  viewCard: viewCardSchema,
};

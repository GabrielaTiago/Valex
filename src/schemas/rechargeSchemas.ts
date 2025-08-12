import Joi from 'joi';

export const rechargeSchema = Joi.object({
  cardId: Joi.number().integer().positive().required().messages({
    'any.required': 'Card ID is required',
    'number.base': 'Card ID must be a number',
    'number.integer': 'Card ID must be an integer',
    'number.positive': 'Card ID must be a positive number',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'Amount is required',
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be a positive number',
  }),
});

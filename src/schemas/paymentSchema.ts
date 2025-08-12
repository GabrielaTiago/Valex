import Joi from 'joi';

export const paymentSchema = Joi.object({
  cardId: Joi.number().required().messages({
    'any.required': 'Card ID is required',
    'number.base': 'Card ID must be a number',
    'number.integer': 'Card ID must be an integer',
    'number.positive': 'Card ID must be a positive number',
  }),
  amount: Joi.number().required().messages({
    'any.required': 'Amount is required',
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be a positive number',
  }),
  businessId: Joi.number().required().messages({
    'any.required': 'Business ID is required',
    'number.base': 'Business ID must be a number',
    'number.integer': 'Business ID must be an integer',
    'number.positive': 'Business ID must be a positive number',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
    'string.base': 'Password must be a string',
  }),
});

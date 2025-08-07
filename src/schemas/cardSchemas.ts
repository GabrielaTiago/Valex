import Joi from 'joi';

export const createCardSchema = Joi.object({
  employeeId: Joi.number().integer().positive().required().messages({
    'any.required': 'Employee ID is required',
    'number.base': 'Employee ID must be a number',
    'number.integer': 'Employee ID must be an integer',
    'number.positive': 'Employee ID must be a positive number',
  }),
  type: Joi.string().valid('groceries', 'restaurant', 'transport', 'education', 'health').required().messages({
    'any.required': 'Type is required',
    'any.only': 'Type must be one of: groceries, restaurant, transport, education, health',
  }),
});

export const activateCardSchema = Joi.object({
  cardId: Joi.number().integer().positive().required().messages({
    'any.required': 'Card ID is required',
    'number.base': 'Card ID must be a number',
    'number.integer': 'Card ID must be an integer',
    'number.positive': 'Card ID must be a positive number',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
  securityCode: Joi.string().required().messages({
    'any.required': 'Security code is required',
  }),
});

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

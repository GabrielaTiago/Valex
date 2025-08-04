import { Request, Response, NextFunction } from 'express';

import { AppError } from '@/errors/AppError.js';
import { companyService } from '@/services/companyService.js';

export interface AuthenticatedRequest extends Request {
  company?: {
    id: number;
    name: string;
    apiKey?: string;
  };
}

export async function validateApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) throw new AppError('API key is required', 'unauthorized');

    const company = await companyService.getCompanyByApiKey(apiKey);
    if (!company) throw new AppError('Invalid API key', 'unauthorized');
    req.company = company;

    next();
  } catch (error) {
    console.error(error);
    throw new AppError('Invalid API key', 'unauthorized');
  }
}

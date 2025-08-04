import { Request, Response, NextFunction } from 'express';

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
    if (!apiKey) return res.status(401).send({ message: 'API key is required' });

    const company = await companyService.getCompanyByApiKey(apiKey);
    if (!company) return res.status(401).send({ message: 'Invalid API key' });
    req.company = company;

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).send({ message: 'Invalid API key' });
  }
}

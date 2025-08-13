import { AppError } from '@/errors/AppError.js';
import { findById } from '@/repositories/businessRepository.js';

export class BusinessService {
  async findBusinessById(id: number) {
    const business = await findById(id);
    if (!business) throw new AppError('Business not found', 'not_found');
    return business;
  }
}

export const businessService = new BusinessService();

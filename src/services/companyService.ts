import { AppError } from '@/errors/AppError.js';
import { findByApiKey } from '@/repositories/companyRepository.js';

class CompanyService {
  async getCompanyByApiKey(apiKey: string) {
    const company = await findByApiKey(apiKey);
    if (!company) throw new AppError('Company not found', 'not_found');

    return company;
  }
}

export const companyService = new CompanyService();

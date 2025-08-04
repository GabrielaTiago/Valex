import { findByApiKey } from '@/repositories/companyRepository.js';

class CompanyService {
  async getCompanyByApiKey(apiKey: string) {
    const company = await findByApiKey(apiKey);
    if (!company) {
      throw new Error('Company not found');
    }
    return company;
  }
}

export const companyService = new CompanyService();

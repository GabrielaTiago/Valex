import { AppError } from '@/errors/AppError.js';
import { findById } from '@/repositories/employeeRepository.js';

export class EmployeeService {
  async getEmployeeById(id: number) {
    const employee = await findById(id);
    if (!employee) throw new AppError('Employee not found', 'not_found');
    return employee;
  }
}

export const employeeService = new EmployeeService();

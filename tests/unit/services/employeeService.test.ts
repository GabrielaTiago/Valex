import { expect, beforeEach, describe, it, vi } from 'vitest';

import type { Employee } from '@/repositories/employeeRepository.js';
import * as employeeRepository from '@/repositories/employeeRepository.js';
import { employeeService } from '@/services/employeeService.js';

const mockEmployeeId = 1;

describe('Employee Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmployeeById', () => {
    it('should retrieve a employee by id when employee exists', async () => {
      const mockEmployee: Employee = { id: 1, fullName: 'Test Employee', cpf: '1234567890', email: 'test-email', companyId: 1 };
      vi.spyOn(employeeRepository, 'findById').mockResolvedValue(mockEmployee);

      const result = await employeeService.getEmployeeById(mockEmployeeId);

      expect(result).toEqual(mockEmployee);
      expect(employeeRepository.findById).toHaveBeenCalledWith(mockEmployeeId);
      expect(employeeRepository.findById).toHaveBeenCalledOnce();
    });

    it('should throw an error when employee is not found', async () => {
      vi.spyOn(employeeRepository, 'findById').mockResolvedValue(undefined);

      await expect(employeeService.getEmployeeById(mockEmployeeId)).rejects.toThrow('Employee not found');
      expect(employeeRepository.findById).toHaveBeenCalledWith(mockEmployeeId);
      expect(employeeRepository.findById).toHaveBeenCalledOnce();
    });
  });
});

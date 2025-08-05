import { connection } from '@/config/postgres.js';

export interface Employee {
  id: number;
  fullName: string;
  cpf: string;
  email: string;
  companyId: number;
}

export async function findById(id: number): Promise<Employee | undefined> {
  const result = await connection.query<Employee, [number]>('SELECT * FROM employees WHERE id=$1', [id]);

  return result.rows[0];
}

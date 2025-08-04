import { connection } from '@/config/postgres.js';

export interface Company {
  id: number;
  name: string;
  apiKey?: string;
}

export async function findByApiKey(apiKey: string): Promise<Company | null> {
  const result = await connection.query<Company, [string]>(`SELECT * FROM companies WHERE "apiKey"=$1`, [apiKey]);

  return result.rows.length > 0 ? result.rows[0] : null;
}

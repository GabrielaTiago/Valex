import fs from 'fs';
import path from 'path';

import { connection } from '@/config/postgres.js';

export async function seedDb() {
  const seedQuery = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf-8');
  await connection.query(seedQuery);
}

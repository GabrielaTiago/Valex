import dotenv from 'dotenv';
import pg from 'pg';

import { createDatabaseValidator, type EnvironmentValidator } from '@/utils/envValidator.js';

dotenv.config();

interface DatabaseConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

interface ConnectionTestResult {
  current_user: string;
  current_database: string;
}

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
}

enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

const createDatabaseConfig = (envValidator: EnvironmentValidator): DatabaseConfig => {
  const isProduction = process.env.NODE_ENV === Environment.PRODUCTION;

  const config: DatabaseConfig = {
    user: envValidator.getString('POSTGRES_USER'),
    password: envValidator.getString('POSTGRES_PASSWORD'),
    host: envValidator.getString('POSTGRES_HOST'),
    port: envValidator.getNumber('POSTGRES_PORT'),
    database: envValidator.getString('POSTGRES_DB'),
  };

  if (isProduction) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
};

export class DatabaseConnection {
  private readonly pool: pg.Pool;
  private isConnected = false;
  private readonly envValidator: EnvironmentValidator;

  constructor() {
    // Validate environment variables
    this.envValidator = createDatabaseValidator();
    this.envValidator.validate();

    const config = createDatabaseConfig(this.envValidator);
    this.pool = new pg.Pool(config);
  }

  async connect(): Promise<void> {
    await this.testConnection();
  }

  async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      const result = await client.query<ConnectionTestResult>('SELECT current_user, current_database();');

      console.log('Database connected successfully:', {
        user: result.rows[0].current_user,
        database: result.rows[0].current_database,
      });

      this.isConnected = true;
      client.release();
    } catch (err) {
      const error = err as DatabaseError;
      console.error('Database connection error:', {
        message: error.message,
        code: error.code,
        detail: error.detail || 'No additional details',
      });
      process.exit(1);
    }
  }

  getPool(): pg.Pool {
    return this.pool;
  }

  isConnectionEstablished(): boolean {
    return this.isConnected;
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.isConnected = false;
  }
}

// Create and initialize database connection
const databaseConnection = new DatabaseConnection();

export const connection = databaseConnection.getPool();

export { databaseConnection };

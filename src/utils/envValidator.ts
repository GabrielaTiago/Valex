export type EnvironmentValue = string | number | boolean | string[];

export interface EnvironmentConfig {
  [key: string]: EnvironmentValue;
}

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean';
  default?: EnvironmentValue;
  validator?: (value: string) => boolean;
  transform?: (value: string) => EnvironmentValue;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export class EnvironmentValidator {
  private readonly schema: ValidationSchema;
  private validatedEnv: EnvironmentConfig = {};

  constructor(schema: ValidationSchema) {
    this.schema = schema;
  }

  /**
   * Validates all environment variables according to the schema
   */
  validate(): EnvironmentConfig {
    const errors: string[] = [];

    for (const [key, rule] of Object.entries(this.schema)) {
      try {
        const value = this.validateSingle(key, rule);
        if (value !== undefined) {
          this.validatedEnv[key] = value;
        }
      } catch (error) {
        errors.push(error as string);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    }

    return this.validatedEnv;
  }

  /**
   * Validates a single environment variable
   */
  private validateSingle(key: string, rule: ValidationRule): EnvironmentValue | undefined {
    const value = process.env[key];

    // Handle required variables
    if (rule.required && !value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }

    // Handle optional variables with default
    if (!value && rule.default !== undefined) {
      return rule.default;
    }

    // Handle optional variables without value
    if (!value) {
      return undefined;
    }

    // Apply custom validator if provided
    if (rule.validator && !rule.validator(value)) {
      throw new Error(`Invalid value for environment variable ${key}: ${value}`);
    }

    // Apply transformation if provided
    if (rule.transform) {
      return rule.transform(value);
    }

    // Apply type conversion
    return this.convertType(value, rule.type || 'string');
  }

  /**
   * Converts string value to specified type
   */
  private convertType(value: string, type: 'string' | 'number' | 'boolean'): EnvironmentValue {
    switch (type) {
      case 'number': {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
          throw new Error(`Invalid number value: ${value}`);
        }
        return num;
      }
      case 'boolean':
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        throw new Error(`Invalid boolean value: ${value}`);
      default:
        return value;
    }
  }

  /**
   * Gets a validated environment variable
   */
  get(key: string): EnvironmentValue {
    if (!(key in this.validatedEnv)) {
      throw new Error(`Environment variable ${key} not found in validated config`);
    }
    return this.validatedEnv[key];
  }

  /**
   * Gets a validated environment variable as string
   */
  getString(key: string): string {
    const value = this.get(key);
    if (typeof value !== 'string') {
      throw new Error(`Environment variable ${key} is not a string`);
    }
    return value;
  }

  /**
   * Gets a validated environment variable as number
   */
  getNumber(key: string): number {
    const value = this.get(key);
    if (typeof value !== 'number') {
      throw new Error(`Environment variable ${key} is not a number`);
    }
    return value;
  }

  /**
   * Gets a validated environment variable as boolean
   */
  getBoolean(key: string): boolean {
    const value = this.get(key);
    if (typeof value !== 'boolean') {
      throw new Error(`Environment variable ${key} is not a boolean`);
    }
    return value;
  }
}

export const DATABASE_ENV_SCHEMA: ValidationSchema = {
  POSTGRES_USER: { required: true, type: 'string' },
  POSTGRES_PASSWORD: { required: true, type: 'string' },
  POSTGRES_HOST: { required: true, type: 'string' },
  POSTGRES_PORT: {
    required: true,
    type: 'number',
    validator: (value) => {
      const port = parseInt(value, 10);
      return port > 0 && port <= 65535;
    },
  },
  POSTGRES_DB: { required: true, type: 'string' },
};

export const SERVER_ENV_SCHEMA: ValidationSchema = {
  PORT: {
    required: false,
    type: 'number',
    default: 4000,
    validator: (value) => {
      const port = parseInt(value, 10);
      return port > 0 && port <= 65535;
    },
  },
  NODE_ENV: {
    required: false,
    type: 'string',
    default: 'development',
    validator: (value) => ['development', 'production', 'test'].includes(value),
  },
};

// Convenience function to create database validator
export const createDatabaseValidator = (): EnvironmentValidator => {
  return new EnvironmentValidator(DATABASE_ENV_SCHEMA);
};

// Convenience function to create server validator
export const createServerValidator = (): EnvironmentValidator => {
  return new EnvironmentValidator(SERVER_ENV_SCHEMA);
};

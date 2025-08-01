import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { EnvironmentValidator, ValidationSchema, DATABASE_ENV_SCHEMA, SERVER_ENV_SCHEMA } from '@/utils/envValidator.js';

describe('EnvironmentValidator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validate', () => {
    it('should return a valid configuration when all variables are valid', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'testdb';

      const schema: ValidationSchema = {
        DB_HOST: { required: true, type: 'string' },
        DB_PORT: { required: true, type: 'number' },
        DB_NAME: { required: true, type: 'string' },
      };

      const validator = new EnvironmentValidator(schema);
      const config = validator.validate();

      expect(config).toEqual({ DB_HOST: 'localhost', DB_PORT: 5432, DB_NAME: 'testdb' });
    });

    it('deve lançar erro quando múltiplas variáveis são inválidas', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = 'invalid-port';
      process.env.DB_NAME = 'testdb';

      const schema: ValidationSchema = {
        DB_HOST: { required: true, type: 'string' },
        DB_PORT: {
          required: true,
          type: 'number',
          validator: (value) => !isNaN(parseInt(value, 10)),
        },
        DB_NAME: { required: true, type: 'string' },
      };

      const validator = new EnvironmentValidator(schema);

      expect(() => validator.validate()).toThrow('Environment validation failed:\nError: Invalid value for environment variable DB_PORT: invalid-port');
    });

    it('should include optional variables with default values in the result', () => {
      process.env.REQUIRED_VAR = 'value';

      const schema: ValidationSchema = {
        REQUIRED_VAR: { required: true, type: 'string' },
        OPTIONAL_VAR: { required: false, default: 'default-value' },
      };

      const validator = new EnvironmentValidator(schema);
      const config = validator.validate();

      expect(config).toEqual({ REQUIRED_VAR: 'value', OPTIONAL_VAR: 'default-value' });
    });

    it('should exclude optional variables with no value and no default from the result', () => {
      process.env.REQUIRED_VAR = 'value';

      const schema: ValidationSchema = {
        REQUIRED_VAR: { required: true, type: 'string' },
        OPTIONAL_VAR: { required: false }, // without default
      };

      const validator = new EnvironmentValidator(schema);
      const config = validator.validate();

      expect(config).toEqual({
        REQUIRED_VAR: 'value',
      });
      expect(config.OPTIONAL_VAR).toBeUndefined();
    });

    it('should process all variables in the schema even if some are invalid', () => {
      process.env.VAR1 = 'valid1';
      process.env.VAR2 = 'invalid';
      process.env.VAR3 = 'valid3';

      const schema: ValidationSchema = {
        VAR1: { required: true, type: 'string' },
        VAR2: {
          required: true,
          type: 'number',
          validator: (value) => !isNaN(parseInt(value, 10)),
        },
        VAR3: { required: true, type: 'string' },
      };

      const validator = new EnvironmentValidator(schema);

      expect(() => validator.validate()).toThrow('Environment validation failed:\nError: Invalid value for environment variable VAR2: invalid');
    });
  });
  describe('validateSingle', () => {
    it('should throw an error when a required variable is missing', () => {
      const schema: ValidationSchema = {
        API_KEY: { required: true },
      };

      const validator = new EnvironmentValidator(schema);

      expect(() => validator.validate()).toThrow('Missing required environment variable: API_KEY');
    });

    it('should apply the default value when an optional variable is missing', () => {
      const schema: ValidationSchema = {
        NODE_ENV: { required: false, default: 'development' },
      };

      const validator = new EnvironmentValidator(schema);
      const config = validator.validate();

      expect(config.NODE_ENV).toBe('development');
    });

    it('should return undefined for optional variables with no value and no default', () => {
      const schema: ValidationSchema = {
        OPTIONAL_VAR: { required: false },
      };

      const validator = new EnvironmentValidator(schema);
      const config = validator.validate();

      expect(config.OPTIONAL_VAR).toBeUndefined();
    });

    it('should throw an error when a custom validator fails', () => {
      process.env.NODE_ENV = 'staging';

      const schema: ValidationSchema = {
        NODE_ENV: { validator: (value) => ['development', 'production'].includes(value) },
      };

      const validator = new EnvironmentValidator(schema);

      expect(() => validator.validate()).toThrow('Invalid value for environment variable NODE_ENV: staging');
    });

    it('should use the transform function when provided', () => {
      process.env.ALLOWED_ORIGINS = 'http://a.com,http://b.com';

      const schema: ValidationSchema = {
        ALLOWED_ORIGINS: {
          transform: (value) => value.split(','),
        },
      };

      const validator = new EnvironmentValidator(schema);
      const config = validator.validate();

      expect(config.ALLOWED_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
    });
  });

  describe('convertType', () => {
    it('should convert types correctly', () => {
      process.env.USE_SSL = 'true';

      const schema: ValidationSchema = {
        USE_SSL: { type: 'boolean' },
      };

      const validator = new EnvironmentValidator(schema);
      const config = validator.validate();

      expect(config.USE_SSL).toBe(true);
    });

    it('should throw an error for invalid type conversion - number', () => {
      process.env.DB_PORT = 'not-a-number';

      const schema: ValidationSchema = {
        DB_PORT: { type: 'number' },
      };

      const validator = new EnvironmentValidator(schema);

      expect(() => validator.validate()).toThrow('Invalid number value: not-a-number');
    });

    it('should throw an error for invalid type conversion - boolean', () => {
      process.env.USE_SSL = 'not-a-boolean';

      const schema: ValidationSchema = {
        USE_SSL: { type: 'boolean' },
      };

      const validator = new EnvironmentValidator(schema);
      expect(() => validator.validate()).toThrow('Invalid boolean value: not-a-boolean');
    });
  });

  describe('get', () => {
    it('should return the value of the environment variable', () => {
      process.env.TEST_VAR = 'test-value';

      const schema: ValidationSchema = {
        TEST_VAR: { required: true, type: 'string' },
      };

      const validator = new EnvironmentValidator(schema);
      validator.validate();

      expect(validator.get('TEST_VAR')).toBe('test-value');
    });

    it('should throw an error when trying to access an unvalidated variable', () => {
      const schema: ValidationSchema = {
        MISSING_VAR: { required: true, type: 'string' },
      };

      const validator = new EnvironmentValidator(schema);
      expect(() => validator.get('MISSING_VAR')).toThrow('Environment variable MISSING_VAR not found in validated config');
    });
  });

  describe('getString', () => {
    it('should return the string correctly', () => {
      process.env.STRING_VAR = 'hello';

      const schema: ValidationSchema = {
        STRING_VAR: { type: 'string' },
      };

      const validator = new EnvironmentValidator(schema);
      validator.validate();

      expect(validator.getString('STRING_VAR')).toBe('hello');
    });

    it('should throw an error when trying to access number as string', () => {
      process.env.NUM_VAR = '42';

      const schema: ValidationSchema = {
        NUM_VAR: { type: 'number' },
      };

      const validator = new EnvironmentValidator(schema);
      validator.validate();

      expect(() => validator.getString('NUM_VAR')).toThrow('Environment variable NUM_VAR is not a string');
    });
  });

  describe('getNumber', () => {
    it('should return the number correctly', () => {
      process.env.NUM_VAR = '42';

      const schema: ValidationSchema = {
        NUM_VAR: { type: 'number' },
      };

      const validator = new EnvironmentValidator(schema);
      validator.validate();

      expect(validator.getNumber('NUM_VAR')).toBe(42);
    });

    it('should throw an error when trying to access string as number', () => {
      process.env.STRING_VAR = 'hello';

      const schema: ValidationSchema = {
        STRING_VAR: { type: 'string' },
      };

      const validator = new EnvironmentValidator(schema);
      validator.validate();

      expect(() => validator.getNumber('STRING_VAR')).toThrow('Environment variable STRING_VAR is not a number');
    });
  });

  describe('getBoolean', () => {
    it('should return boolean correctly', () => {
      process.env.BOOL_VAR = 'true';

      const schema: ValidationSchema = {
        BOOL_VAR: { type: 'boolean' },
      };

      const validator = new EnvironmentValidator(schema);
      validator.validate();

      expect(validator.getBoolean('BOOL_VAR')).toBe(true);
    });

    it('should throw an error when trying to access string as boolean', () => {
      process.env.STRING_VAR = 'hello';

      const schema: ValidationSchema = {
        STRING_VAR: { type: 'string' },
      };

      const validator = new EnvironmentValidator(schema);
      validator.validate();

      expect(() => validator.getBoolean('STRING_VAR')).toThrow('Environment variable STRING_VAR is not a boolean');
    });
  });

  describe('DATABASE_ENV_SCHEMA', () => {
    it('should validate DATABASE_ENV_SCHEMA correctly with provided values', () => {
      process.env.POSTGRES_USER = 'testuser';
      process.env.POSTGRES_PASSWORD = 'testpass';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'testdb';

      const validator = new EnvironmentValidator(DATABASE_ENV_SCHEMA);
      const config = validator.validate();

      expect(config.POSTGRES_USER).toBe('testuser');
      expect(config.POSTGRES_PASSWORD).toBe('testpass');
      expect(config.POSTGRES_HOST).toBe('localhost');
      expect(config.POSTGRES_PORT).toBe(5432);
      expect(config.POSTGRES_DB).toBe('testdb');
    });

    it('should throw an error for invalid port in DATABASE_ENV_SCHEMA', () => {
      process.env.POSTGRES_USER = 'testuser';
      process.env.POSTGRES_PASSWORD = 'testpass';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '70000'; // invalid (> 65535)
      process.env.POSTGRES_DB = 'testdb';

      const validator = new EnvironmentValidator(DATABASE_ENV_SCHEMA);

      expect(() => validator.validate()).toThrow('Invalid value for environment variable POSTGRES_PORT: 70000');
    });
  });

  describe('SERVER_ENV_SCHEMA', () => {
    it('should validate SERVER_ENV_SCHEMA correctly with provided values', () => {
      process.env.PORT = '3000';
      process.env.NODE_ENV = 'production';

      const validator = new EnvironmentValidator(SERVER_ENV_SCHEMA);
      const config = validator.validate();

      expect(config.PORT).toBe(3000);
      expect(config.NODE_ENV).toBe('production');
    });

    it('should use default values when variables are not provided', () => {
      const validator = new EnvironmentValidator(SERVER_ENV_SCHEMA);
      const config = validator.validate();

      expect(config.PORT).toBe(4000); // default
      expect(config.NODE_ENV).toBe('development'); // default
    });

    it('should throw an error for invalid port in SERVER_ENV_SCHEMA', () => {
      process.env.PORT = '70000'; // Porta inválida (> 65535)
      process.env.NODE_ENV = 'development';

      const validator = new EnvironmentValidator(SERVER_ENV_SCHEMA);

      expect(() => validator.validate()).toThrow('Invalid value for environment variable PORT: 70000');
    });

    it('should throw an error for invalid NODE_ENV', () => {
      process.env.PORT = '3000';
      process.env.NODE_ENV = 'staging'; // Valor inválido

      const validator = new EnvironmentValidator(SERVER_ENV_SCHEMA);

      expect(() => validator.validate()).toThrow('Invalid value for environment variable NODE_ENV: staging');
    });

    it('should accept all valid values for NODE_ENV', () => {
      const validEnvs = ['development', 'production', 'test'];

      validEnvs.forEach((env) => {
        process.env.PORT = '3000';
        process.env.NODE_ENV = env;

        const validator = new EnvironmentValidator(SERVER_ENV_SCHEMA);
        const config = validator.validate();

        expect(config.NODE_ENV).toBe(env);
      });
    });
  });
});

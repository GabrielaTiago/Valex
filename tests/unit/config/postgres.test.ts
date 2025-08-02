import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockPool, mockPoolConnect, mockPoolEnd, mockClient, mockValidate, mockGetString, mockGetNumber } = vi.hoisted(() => {
  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [{ current_user: 'test', current_database: 'test' }] }),
    release: vi.fn(),
  };
  const mockPoolConnect = vi.fn().mockResolvedValue(mockClient);
  const mockPoolEnd = vi.fn().mockResolvedValue(undefined);
  const mockPool = vi.fn(() => ({
    connect: mockPoolConnect,
    end: mockPoolEnd,
  }));
  const mockValidate = vi.fn();
  const mockGetString = vi.fn();
  const mockGetNumber = vi.fn();

  return { mockPool, mockPoolConnect, mockPoolEnd, mockClient, mockValidate, mockGetString, mockGetNumber };
});

const setupMockEnv = (overrides: Record<string, string | undefined> = {}) => {
  const defaultEnv = {
    POSTGRES_USER: 'testuser',
    POSTGRES_PASSWORD: 'password',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
    POSTGRES_DB: 'testdb',
    NODE_ENV: 'test',
  };
  process.env = { ...process.env, ...defaultEnv, ...overrides };
};

vi.mock('pg', () => ({ default: { Pool: mockPool } }));
vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));
vi.mock('@/utils/envValidator.js', () => ({
  createDatabaseValidator: vi.fn().mockReturnValue({
    validate: mockValidate,
    getString: mockGetString,
    getNumber: mockGetNumber,
  }),
}));

describe('DatabaseConnection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    setupMockEnv();
    mockValidate.mockReturnValue({});
    mockGetString.mockImplementation((key) => process.env[key] as string);
    mockGetNumber.mockImplementation((key) => parseInt(process.env[key] as string, 10));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    it('should call validate from envValidator when instantiated', async () => {
      await import('@/config/postgres.js');
      expect(mockValidate).toHaveBeenCalledOnce();
    });

    it('should create a Pool with the correct configuration', async () => {
      await import('@/config/postgres.js');
      expect(mockPool).toHaveBeenCalledWith({
        user: 'testuser',
        password: 'password',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
      });
    });

    it('should add SSL configuration when NODE_ENV is production', async () => {
      setupMockEnv({ NODE_ENV: 'production' });
      await import('@/config/postgres.js');
      expect(mockPool).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: { rejectUnauthorized: false },
        })
      );
    });

    it('should throw an error if envValidator.validate() fails', async () => {
      mockValidate.mockImplementation(() => {
        throw new Error('Missing required variable');
      });
      const importPromise = import('@/config/postgres.js');
      await expect(importPromise).rejects.toThrow('Missing required variable');
    });
  });

  describe('connect()', () => {
    it('should call the connect method of the pool', async () => {
      const { DatabaseConnection } = await import('@/config/postgres.js');
      const dbConnection = new DatabaseConnection();
      await dbConnection.connect();
      expect(mockPoolConnect).toHaveBeenCalledOnce();
    });
  });

  describe('isConnectionEstablished()', () => {
    it('should return false when the class is instantiated for the first time', async () => {
      const { DatabaseConnection } = await import('@/config/postgres.js');
      const dbConnection = new DatabaseConnection();
      expect(dbConnection.isConnectionEstablished()).toBe(false);
    });

    it('should return true after a successful connection', async () => {
      mockPoolConnect.mockResolvedValue(mockClient);
      const { DatabaseConnection } = await import('@/config/postgres.js');
      const dbConnection = new DatabaseConnection();
      await dbConnection.connect();
      expect(dbConnection.isConnectionEstablished()).toBe(true);
    });

    it('should return false after a connection failure', async () => {
      mockPoolConnect.mockRejectedValue(new Error('Connection failed'));
      const { DatabaseConnection } = await import('@/config/postgres.js');
      const dbConnection = new DatabaseConnection();
      try {
        await dbConnection.connect();
      } catch {
        /* Ignore the error, testing the connection state */
      }
      expect(dbConnection.isConnectionEstablished()).toBe(false);
    });
  });

  describe('close()', () => {
    it('should call the end method of the pool to close the connection', async () => {
      const { DatabaseConnection } = await import('@/config/postgres.js');
      const dbConnection = new DatabaseConnection();

      await dbConnection.close();

      expect(mockPoolEnd).toHaveBeenCalledOnce();
    });
  });
});

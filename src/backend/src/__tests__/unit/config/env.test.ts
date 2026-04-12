import * as dotenv from 'dotenv';

// Mock dotenv.config() to prevent it from loading the real .env file during tests
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should have a default PORT of 3001', () => {
    delete process.env.PORT;
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.JWT_SECRET = 'test-secret';
    // Re-import to trigger re-parsing with new env
    const { env } = require('../../../config/env');
    expect(env.PORT).toBe(3001);
  });

  it('should throw an error if DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    process.env.JWT_SECRET = 'test-secret';
    expect(() => {
      require('../../../config/env');
    }).toThrow();
  });

  it('should throw an error if JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    expect(() => {
      require('../../../config/env');
    }).toThrow();
  });
});

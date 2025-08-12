import request from 'supertest';
import { describe, it, expect } from 'vitest';

import { BASE_URL } from './setup.e2e.js';

describe('Server Test', () => {
  it('should respond with 200 and the correct message', async () => {
    const response = await request(BASE_URL).get('/health');

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK - API is running');
  });
});

import request from 'supertest';
import { describe, it, expect } from 'vitest';

import { app } from '@/app.js';

describe('GET /health', () => {
  it('deve responder com status 200 e a mensagem correta', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK - API is running');
  });
});

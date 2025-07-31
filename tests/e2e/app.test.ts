import type { Server } from 'http';

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { app } from '@/app.js';

let server: Server;
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

describe('Server Test', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`Test server running on ${BASE_URL}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          return reject(err);
        }
        console.log('Test server stopped.');
        resolve();
      });
    });
  });

  it('deve responder com status 200 OK no endpoint /health', async () => {
    const response = await request(BASE_URL).get('/health');

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});

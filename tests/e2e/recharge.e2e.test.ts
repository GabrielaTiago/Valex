import request from 'supertest';
import { describe, it, expect } from 'vitest';

import { apiKey, cardFactory, BASE_URL } from './setup.e2e.js';

import { connection } from '@/config/postgres.js';

describe('Recharge E2E Tests', () => {
  describe('POST /recharges', () => {
    it('should create a recharge and return status 201 for a valid request', async () => {
      const card = await cardFactory.create({ password: '1234' });
      const rechargeData = { cardId: card.id, amount: 100 };

      const response = await request(BASE_URL).post('/recharges').set('x-api-key', apiKey).send(rechargeData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'Recharge created successfully' });

      const result = await connection.query(`SELECT * FROM recharges WHERE "cardId" = $1 AND amount = $2`, [rechargeData.cardId, rechargeData.amount]);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].amount).toBe(rechargeData.amount);
    });

    it('should return status 401 for a request without api key', async () => {
      const card = await cardFactory.create({ password: '1234' });
      const rechargeData = { cardId: card.id, amount: 100 };

      const response = await request(BASE_URL).post('/recharges').send(rechargeData);

      expect(response.status).toBe(401);
    });

    it('should return status 422 for a request with invalid cardId', async () => {
      const rechargeData = { cardId: 'invalid', amount: 100 };

      const response = await request(BASE_URL).post('/recharges').set('x-api-key', apiKey).send(rechargeData);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ message: 'Card ID must be a number' });
    });

    it('should return status 422 for a request with invalid amount', async () => {
      const rechargeData = { cardId: 1, amount: -70 };

      const response = await request(BASE_URL).post('/recharges').set('x-api-key', apiKey).send(rechargeData);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ message: 'Amount must be a positive number' });
    });

    it('should return status 404 for a request with invalid cardId', async () => {
      const rechargeData = { cardId: 999, amount: 100 };

      const response = await request(BASE_URL).post('/recharges').set('x-api-key', apiKey).send(rechargeData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Card not found' });
    });

    it('should return status 409 for a request for a card that is inactive', async () => {
      const card = await cardFactory.create();
      const rechargeData = { cardId: card.id, amount: 100 };

      const response = await request(BASE_URL).post('/recharges').set('x-api-key', apiKey).send(rechargeData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Card is inactive' });
    });
  });
});

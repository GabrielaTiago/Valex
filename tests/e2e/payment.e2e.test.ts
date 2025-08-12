import request from 'supertest';
import { describe, it, expect } from 'vitest';

import { cardFactory, BASE_URL } from './setup.e2e.js';
import { createRecharge } from '../factories/rechargeFactory.js';

import { connection } from '@/config/postgres.js';

describe('Payment E2E Tests', () => {
  describe('POST /payments', () => {
    it('should create a payment and return status 201 for a valid request', async () => {
      const card = await cardFactory.create({ password: '1234' });
      await createRecharge(card.id, 200);
      const paymentData = { cardId: card.id, amount: 100, businessId: 2, password: '1234' };

      const response = await request(BASE_URL).post('/payments').send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'Payment created successfully' });

      const payment = await connection.query(`SELECT * FROM payments WHERE "cardId" = $1 AND amount = $2 AND "businessId" = $3`, [card.id, 100, 2]);

      expect(payment.rows.length).toBe(1);
      expect(payment.rows[0].amount).toBe(100);
    });

    it('should return status 422 for a request with invalid data', async () => {
      const paymentData = { cardId: 1, businessId: 1, password: '1234' };

      const response = await request(BASE_URL).post('/payments').send(paymentData);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ message: 'Amount is required' });
    });

    it('should return status 404 for a request with invalid cardId', async () => {
      const paymentData = { cardId: 999, amount: 100, businessId: 1, password: '1234' };

      const response = await request(BASE_URL).post('/payments').send(paymentData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Card not found' });
    });

    it('should return status 403 for a request with blocked card', async () => {
      const card = await cardFactory.create({ isBlocked: true });
      const paymentData = { cardId: card.id, amount: 100, businessId: 1, password: '1234' };

      const response = await request(BASE_URL).post('/payments').send(paymentData);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Card is blocked' });
    });

    it('should return status 403 for a request with inactive card', async () => {
      const card = await cardFactory.create();
      const paymentData = { cardId: card.id, amount: 100, businessId: 1, password: '1234' };

      const response = await request(BASE_URL).post('/payments').send(paymentData);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Card is not active' });
    });

    it('should return 409 for a request with expired card', async () => {
      const card = await cardFactory.create({ isExpired: true, password: '1234' });
      const paymentData = { cardId: card.id, amount: 100, businessId: 1, password: '1234' };

      const response = await request(BASE_URL).post('/payments').send(paymentData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Card is expired' });
    });

    it('should return status 401 for a request with invalid password', async () => {
      const card = await cardFactory.create({ password: '1234' });
      const paymentData = { cardId: card.id, amount: 100, businessId: 1, password: '12345' };

      const response = await request(BASE_URL).post('/payments').send(paymentData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid password' });
    });

    it('should return 403 for a request with invalid business type', async () => {
      const card = await cardFactory.create({ password: '1234', type: 'transport' });
      await createRecharge(card.id, 100);
      const paymentData = { cardId: card.id, amount: 100, businessId: 1, password: '1234' };

      const response = await request(BASE_URL).post('/payments').send(paymentData);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Invalid business type' });
    });

    it('should return 403 for a request with insufficient balance', async () => {
      const card = await cardFactory.create({ password: '1234' });
      await createRecharge(card.id, 100);
      const paymentData = { cardId: card.id, amount: 200, businessId: 2, password: '1234' };

      const response = await request(BASE_URL).post('/payments').send(paymentData);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Insufficient balance' });
    });
  });
});

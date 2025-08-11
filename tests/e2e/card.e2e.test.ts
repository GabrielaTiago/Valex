import type { Server } from 'http';

import request from 'supertest';
import { CardFactory } from 'tests/factories/cardFactory.js';
import { createPayment } from 'tests/factories/paymentFactory.js';
import { createRecharge } from 'tests/factories/rechargeFactory.js';
import { seedDb } from 'tests/factories/scenarioFactory.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { app } from '@/app.js';
import { connection, databaseConnection } from '@/config/postgres.js';

describe('Card E2E Tests', () => {
  let server: Server;
  const PORT = 4006;
  const apiKey = 'zadKLNx.DzvOVjQH01TumGl2urPjPQSxUbf67vs0';
  const cardFactory = new CardFactory();

  beforeAll(async () => {
    await databaseConnection.connect();
    await new Promise<void>((resolve) => {
      server = app.listen(PORT, resolve);
    });
  });

  beforeEach(async () => {
    await seedDb();
  });

  afterAll(async () => {
    server.close();
    await databaseConnection.close();
  });

  describe('POST /cards', () => {
    it('should create a card and return status 201 for a valid request', async () => {
      const cardData = { employeeId: 1, type: 'groceries' };

      const response = await request(app).post('/cards').set('x-api-key', apiKey).send(cardData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'Card created successfully' });

      const createdCard = await connection.query('SELECT * FROM cards WHERE "employeeId" = $1', [1]);
      expect(createdCard.rowCount).toBe(1);
      expect(createdCard.rows[0].type).toBe('groceries');
    });

    it('should return status 401 if the API key is invalid', async () => {
      const cardData = { employeeId: 1, type: 'groceries' };

      const response = await request(app).post('/cards').set('x-api-key', 'invalid-api-key').send(cardData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid API key' });
    });

    it('should return status 404 if the employee does not exist', async () => {
      const cardData = { employeeId: 999, type: 'groceries' };

      const response = await request(app).post('/cards').set('x-api-key', apiKey).send(cardData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Employee not found' });
    });

    it('should return status 409 if the employee already has a card of that type', async () => {
      const cardData = { employeeId: 2, type: 'restaurant' };

      await request(app).post('/cards').set('x-api-key', apiKey).send(cardData);
      const response = await request(app).post('/cards').set('x-api-key', apiKey).send(cardData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Employee already has a card of this type' });
    });

    it('should return status 422 if the request body is invalid', async () => {
      const cardData = { employeeId: 1, type: 'invalid-type' };

      const response = await request(app).post('/cards').set('x-api-key', apiKey).send(cardData);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ message: 'Type must be one of: groceries, restaurant, transport, education, health' });
    });

    it('should return status 422 if the request body is missing', async () => {
      const cardData = {};

      const response = await request(app).post('/cards').set('x-api-key', apiKey).send(cardData);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ message: 'Employee ID is required, Type is required' });
    });
  });

  describe('POST /cards/activate', () => {
    it('should activate a card and return status 200 for a valid request', async () => {
      const card = await cardFactory.create();

      const activateData = { cardId: card.id, password: '1234', securityCode: '123' };
      const response = await request(app).post('/cards/activate').send(activateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Card activated successfully' });

      const activatedCard = await connection.query('SELECT * FROM cards WHERE id = $1', [card.id]);
      expect(activatedCard.rows[0].password).toBeDefined();
      expect(activatedCard.rows[0].isBlocked).toBe(false);
    });

    it('should return status 404 if the card does not exist', async () => {
      const activateData = { cardId: 999, password: '1234', securityCode: '123' };
      const response = await request(app).post('/cards/activate').send(activateData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Card not found' });
    });

    it('should return status 422 if the request body is invalid', async () => {
      const activateData = { cardId: 1 }; // Missing password and securityCode
      const response = await request(app).post('/cards/activate').send(activateData);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ message: 'Password is required, Security code is required' });
    });

    it('should return status 409 if the card is already activated', async () => {
      const card = await cardFactory.create();
      const activateData = { cardId: card.id, password: '1234', securityCode: '123' };
      await request(app).post('/cards/activate').send(activateData);

      const response = await request(app).post('/cards/activate').send(activateData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Card is already active' });
    });
  });

  describe('POST /cards/view', () => {
    it('should view an employee card and return status 200 for a valid request', async () => {
      const card = await cardFactory.create({ password: '1234' });
      const viewData = { employeeId: 1, cardId: card.id, password: '1234' };

      const response = await request(app).post('/cards/view').send(viewData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        cardholderName: card.cardholderName,
        number: card.number,
        securityCode: '123',
        expirationDate: card.expirationDate,
        isVirtual: card.isVirtual,
        type: card.type,
      });
    });

    it('should return status 404 if the employee does not exist', async () => {
      const viewData = { employeeId: 999, cardId: 1, password: '1234' };

      const response = await request(app).post('/cards/view').send(viewData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Employee not found' });
    });

    it('should return status 404 if the card does not exist', async () => {
      const viewData = { employeeId: 1, cardId: 999, password: '1234' };

      const response = await request(app).post('/cards/view').send(viewData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Card not found' });
    });

    it('should return status 403 if the card is not active', async () => {
      const card = await cardFactory.create();
      const viewData = { employeeId: 1, cardId: card.id, password: '1234' };

      const response = await request(app).post('/cards/view').send(viewData);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Card is not active' });
    });

    it('should return status 401 if the password is incorrect', async () => {
      const card = await cardFactory.create({ password: '1234' });
      const viewData = { employeeId: 1, cardId: card.id, password: '1235' };

      const response = await request(app).post('/cards/view').send(viewData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid password' });
    });
  });

  describe('GET /cards/balance/:cardId', () => {
    it('should get the balance of a card and return status 200 for a valid request', async () => {
      const card = await cardFactory.create({ password: '1234' });
      const recharge = await createRecharge(card.id, 100);
      const payment = await createPayment(card.id, 50);

      const response = await request(app).get(`/cards/balance/${card.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        balance: 50,
        transactions: [
          {
            id: payment.id,
            cardId: payment.cardId,
            businessId: payment.businessId,
            amount: payment.amount,
            businessName: expect.any(String),
            timestamp: expect.any(String),
          },
        ],
        recharges: [
          {
            id: recharge.id,
            cardId: recharge.cardId,
            amount: recharge.amount,
            timestamp: expect.any(String),
          },
        ],
      });
    });

    it('should return status 404 if the card does not exist', async () => {
      const cardId = 999;
      const response = await request(app).get(`/cards/balance/${cardId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Card not found' });
    });
  });

  describe('POST /cards/block', () => {
    it('should block a card and return status 200 for a valid request', async () => {
      const card = await cardFactory.create({ password: '1234' });
      const blockData = { cardId: card.id, password: '1234' };

      const response = await request(app).post('/cards/block').send(blockData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Card blocked successfully' });

      const blockedCard = await connection.query('SELECT * FROM cards WHERE id = $1', [card.id]);
      expect(blockedCard.rows[0].isBlocked).toBe(true);
    });

    it('should return status 404 if the card does not exist', async () => {
      const blockData = { cardId: 999, password: '1234' };

      const response = await request(app).post('/cards/block').send(blockData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Card not found' });
    });

    it('should return status 403 if the card is not active', async () => {
      const card = await cardFactory.create();
      const blockData = { cardId: card.id, password: '1234' };

      const response = await request(app).post('/cards/block').send(blockData);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Card is not active' });
    });

    it('should return status 409 if the card is already blocked', async () => {
      const card = await cardFactory.create({ isBlocked: true });
      const blockData = { cardId: card.id, password: '1234' };

      const response = await request(app).post('/cards/block').send(blockData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Card is already blocked' });
    });

    it('should return status 401 if the password is incorrect', async () => {
      const card = await cardFactory.create({ password: '1234' });
      const blockData = { cardId: card.id, password: '1235' };

      const response = await request(app).post('/cards/block').send(blockData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid password' });
    });

    it('should return status 409 if the card is expired', async () => {
      const card = await cardFactory.create({ password: '1234', isExpired: true });
      const blockData = { cardId: card.id, password: '1234' };

      const response = await request(app).post('/cards/block').send(blockData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Card is expired' });
    });

    it('should return status 422 if the request body is invalid', async () => {
      const blockData = { cardId: 1 }; // Missing password
      const response = await request(app).post('/cards/block').send(blockData);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ message: 'Password is required' });
    });
  });

  describe('POST /cards/unblock', () => {
    it('should unblock a card and return status 200 for a valid request', async () => {
      const card = await cardFactory.create({ isBlocked: true, password: '1234' });
      const unblockData = { cardId: card.id, password: '1234' };

      const response = await request(app).post('/cards/unblock').send(unblockData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Card unblocked successfully' });

      const unblockedCard = await connection.query('SELECT * FROM cards WHERE id = $1', [card.id]);
      expect(unblockedCard.rows[0].isBlocked).toBe(false);
    });

    it('should return status 404 if the card does not exist', async () => {
      const unblockData = { cardId: 999, password: '1234' };
      const response = await request(app).post('/cards/unblock').send(unblockData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Card not found' });
    });

    it('should return status 409 if the card is not blocked', async () => {
      const card = await cardFactory.create({ password: '1234' });
      const unblockData = { cardId: card.id, password: '1234' };

      const response = await request(app).post('/cards/unblock').send(unblockData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Card is not blocked' });
    });

    it('should return status 403 if the card is not active', async () => {
      const card = await cardFactory.create({ isBlocked: true });
      const unblockData = { cardId: card.id, password: '1234' };

      const response = await request(app).post('/cards/unblock').send(unblockData);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Card is not active' });
    });

    it('should return status 401 if the password is incorrect', async () => {
      const card = await cardFactory.create({ isBlocked: true, password: '1234' });
      const unblockData = { cardId: card.id, password: '1235' };

      const response = await request(app).post('/cards/unblock').send(unblockData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid password' });
    });

    it('should return status 409 if the card is expired', async () => {
      const card = await cardFactory.create({ isBlocked: true, password: '1234', isExpired: true });
      const unblockData = { cardId: card.id, password: '1234' };

      const response = await request(app).post('/cards/unblock').send(unblockData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Card is expired' });
    });

    it('should return status 422 if the request body is invalid', async () => {
      const unblockData = { cardId: 1 }; // Missing password
      const response = await request(app).post('/cards/unblock').send(unblockData);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ message: 'Password is required' });
    });
  });
});

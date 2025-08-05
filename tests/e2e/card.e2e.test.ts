import type { Server } from 'http';

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { seedDb } from '../factories/scenarioFactory.js';

import { app } from '@/app.js';
import { connection, databaseConnection } from '@/config/postgres.js';

describe('POST /cards', () => {
  let server: Server;
  const PORT = 4006;
  const apiKey = 'zadKLNx.DzvOVjQH01TumGl2urPjPQSxUbf67vs0';

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
    await databaseConnection.close();
    server.close();
  });

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

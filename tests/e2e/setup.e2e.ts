import type { Server } from 'http';

import { beforeAll, beforeEach, afterAll } from 'vitest';

import { CardFactory } from '../factories/cardFactory.js';
import { seedDb } from '../factories/scenarioFactory.js';

import { app } from '@/app.js';
import { databaseConnection } from '@/config/postgres.js';

// Global variables
let server: Server;
export const PORT = 4008;
export const BASE_URL = `http://localhost:${PORT}`;
export const apiKey = 'zadKLNx.DzvOVjQH01TumGl2urPjPQSxUbf67vs0';
export const cardFactory = new CardFactory();

// Setup
beforeAll(async () => {
  console.log('Starting E2E test server and database connection...');
  await databaseConnection.connect();
  server = app.listen(PORT);
});

// Seed database before each test
beforeEach(async () => {
  await seedDb();
});

// Close server and database connection after all tests
afterAll(async () => {
  console.log('Stopping E2E test server and database connection...');
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await databaseConnection.close();
});

import 'express-async-errors';
import cors from 'cors';
import express, { json } from 'express';

import { errorHandler } from '@/middlewares/errorHandler.js';
import { router } from '@/routers/router.js';

const app = express();

app.use(cors());
app.use(json());

app.use(router);
app.use(errorHandler);

export { app };

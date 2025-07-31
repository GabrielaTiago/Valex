import cors from 'cors';
import express, { json } from 'express';

const app = express();

app.use(cors());
app.use(json());

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

export { app };

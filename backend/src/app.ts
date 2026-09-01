import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import apiRoutes from './routes';


const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS.split(','), credentials: false }));
app.use(express.json({ limit: '1mb' }));

app.use(
  pinoHttp({
    level: env.LOG_LEVEL,
  }),
);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

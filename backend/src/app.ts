import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { json, urlencoded } from 'express';
import authRoutes from './modules/auth/auth.routes';
import { errorMiddleware } from './common/errors/errorMiddleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API prefix
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'bazarna-backend' }));

app.use('/api/auth', authRoutes);

// global error handler (last middleware)
app.use(errorMiddleware);

export default app;

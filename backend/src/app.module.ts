import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { responseInterceptor } from './shared/interceptors/response.interceptor';
import { jwtStrategy } from './shared/strategies/jwt.strategy';
import { UserRepository } from './repositories/UserRepository';
import routes from './routes';

export const createApp = () => {
  const app = express();

  // Initialize database
  connectDatabase();

  // Initialize Passport
  app.use(passport.initialize());
  const userRepository = new UserRepository();
  passport.use('jwt', jwtStrategy(userRepository));

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Logging
  app.use(morgan('combined'));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Response interceptor
  app.use(responseInterceptor);

  // Routes
  app.use('/api', routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
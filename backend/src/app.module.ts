import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import cookieParser from 'cookie-parser';
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
    // CSP is intentionally omitted here — this server only handles API (JSON) responses.
    // Browsers enforce CSP from the HTML document response (Angular SSR server), not from API responses.
    // The other Helmet headers (HSTS, X-Content-Type-Options, etc.) still protect the API.
    app.use(
        helmet({
            contentSecurityPolicy: false,
        })
    );

    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:4200',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    }));

    // Logging
    app.use(morgan('combined'));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // Response interceptor
    app.use(responseInterceptor);

    // Routes
    app.use('/api', routes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { responseInterceptor } from './shared/interceptors/response.interceptor';
import { requestLogger } from './middlewares/requestLogger';
import { jwtStrategy } from './shared/strategies/jwt.strategy';
import { UserRepository } from './repositories/UserRepository';
import routes from './routes';
import healthRoutes from './routes/health.routes';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
    skipSuccessfulRequests: false,
});

// Strip Authorization header from access logs to prevent token leakage
const morganFormat = ':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

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

    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:4200')
        .split(',')
        .map((o) => o.trim());

    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    }));

    // Structured request logging with requestId + userId correlation
    app.use(requestLogger);

    // Legacy Morgan access log (dev only — requestLogger covers prod)
    if (process.env.NODE_ENV !== 'production') {
      app.use(morgan(morganFormat));
    }

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // Response interceptor
    app.use(responseInterceptor);

    // Health & readiness probes (no auth, no rate-limiting)
    app.use('/health', healthRoutes);

    // Rate limiting on auth endpoints
    app.use('/api/auth', authLimiter);

    // Routes
    app.use('/api', routes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};
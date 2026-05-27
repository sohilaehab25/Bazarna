import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

// ─── Correlation context ────────────────────────────────────────────────────
export interface LogContext {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

export const logContextStorage = new AsyncLocalStorage<LogContext>();

// Winston format that merges the current ALS context into every log entry
const alsContextFormat = winston.format((info) => {
  const ctx = logContextStorage.getStore();
  if (ctx) {
    if (ctx.requestId) info['requestId'] = ctx.requestId;
    if (ctx.userId)    info['userId']    = ctx.userId;
  }
  return info;
})();

const isProd = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    alsContextFormat,
    winston.format.json()
  ),
  defaultMeta: { service: 'bazarna-api' },
  transports: [
    new winston.transports.Console({
      format: isProd
        ? winston.format.json()                                          // structured JSON in prod
        : winston.format.combine(winston.format.colorize(), winston.format.simple()), // human-readable in dev
    }),
    new winston.transports.File({ filename: 'logs/error.log',    level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log'                 }),
  ],
});
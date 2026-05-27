import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger, logContextStorage } from '../utils/logger';

/**
 * requestLogger middleware
 *
 * 1. Reads or generates an X-Request-ID header (so Nginx/load-balancer IDs flow through).
 * 2. Establishes an AsyncLocalStorage context for the lifetime of the request.
 *    Every logger call within the request handler (including nested service calls)
 *    automatically carries requestId + userId without manual threading.
 * 3. Logs structured access entries on response finish.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  const start     = Date.now();

  // Echo the ID back so clients / Nginx can correlate
  res.setHeader('X-Request-ID', requestId);

  logContextStorage.run({ requestId }, () => {
    res.on('finish', () => {
      // Enrich context with userId if auth middleware has set req.user
      const userId = (req as Request & { user?: { id?: string } }).user?.id;

      logger.info('http_request', {
        method:      req.method,
        path:        req.path,
        statusCode:  res.statusCode,
        durationMs:  Date.now() - start,
        ip:          req.ip,
        userAgent:   req.get('user-agent'),
        ...(userId ? { userId } : {}),
      });
    });

    next();
  });
};

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { version } from '../../package.json';

const router = Router();

/**
 * GET /health
 * Liveness probe — answers "is the process alive?".
 * Should always return 200 unless the Node process itself is broken.
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'bazarna-api',
    version,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /ready
 * Readiness probe — answers "can this instance serve traffic?".
 * Returns 503 if any critical dependency (MongoDB) is unavailable.
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting
  const mongoOk = mongoState === 1;

  const checks = {
    mongo: mongoOk ? 'ok' : `degraded (state=${mongoState})`,
  };

  const allOk = Object.values(checks).every((v) => v === 'ok');

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;

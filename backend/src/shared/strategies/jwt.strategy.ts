import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { UserRepository } from '../../repositories/UserRepository';
import { User } from '../../models/User';

const debugAuth = process.env.DEBUG_AUTH === 'true';

const logAuthDebug = (message: string, details?: Record<string, unknown>): void => {
  if (!debugAuth) return;
  if (details) {
    console.info(`[auth] ${message}`, details);
    return;
  }
  console.info(`[auth] ${message}`);
};

export interface JwtPayload {
  sub?: string;
  _id?: string;
  userId?: string;
  username?: string;
  email?: string;
  role?: string;
}

export const jwtStrategy = (userRepository: UserRepository) => {
  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
  };

  return new Strategy(options, async (payload: JwtPayload, done) => {
    try {
      const userId = payload.userId ?? payload._id ?? payload.sub;
      if (!userId) {
        logAuthDebug('jwt payload missing user id');
        return done(null, false);
      }

      logAuthDebug('jwt payload received', { userId });

      const user = await userRepository.findById(userId);
      if (!user) {
        logAuthDebug('jwt user not found', { userId });
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      console.error('[auth] jwt strategy error', error);
      return done(error, false);
    }
  });
};
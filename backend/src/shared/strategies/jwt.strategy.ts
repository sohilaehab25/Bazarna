import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { UserRepository } from '../../repositories/UserRepository';
import { User } from '../../models/User';

export interface JwtPayload {
  sub?: string;
  _id?: string;
  userId?: string;
  username?: string;
  email?: string;
  role?: string;
}

export const jwtStrategy = (userRepository: UserRepository) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret,
  };

  return new Strategy(options, async (payload: JwtPayload, done) => {
    try {
      const userId = payload.userId ?? payload._id ?? payload.sub;
      if (!userId) {
        return done(null, false);
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      console.error('[auth] jwt strategy error', error);
      return done(error, false);
    }
  });
};
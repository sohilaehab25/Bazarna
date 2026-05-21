import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { UserRepository } from '../../repositories/UserRepository';


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
        return done(null, false);
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  });
};
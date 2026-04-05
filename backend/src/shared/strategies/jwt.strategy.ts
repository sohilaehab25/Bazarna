import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { UserRepository } from '../../repositories/UserRepository';
import { User } from '../../models/User';

export interface JwtPayload {
  _id: string;
  email: string;
  role: string;
}

export const jwtStrategy = (userRepository: UserRepository) => {
  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
  };

  return new Strategy(options, async (payload: JwtPayload, done) => {
    try {
      const user = await userRepository.findById(payload._id);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      console.log("🚀 ~ jwtStrategy ~ Error:", error)
      return done(error, false);
    }
  });
};
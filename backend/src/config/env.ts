export const env = {
  port: process.env.PORT || '3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bazarna-app',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

export const logger = {
  info: (...args: any[]) => console.log('[info]', ...args),
  error: (...args: any[]) => console.error('[error]', ...args)
};

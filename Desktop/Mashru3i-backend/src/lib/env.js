import 'dotenv/config';

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TTL: process.env.ACCESS_TTL || '15m',      // e.g. 15m
  REFRESH_TTL_DAYS: parseInt(process.env.REFRESH_TTL_DAYS || '30', 10), // e.g. 30
  NODE_ENV: process.env.NODE_ENV || 'development',
};

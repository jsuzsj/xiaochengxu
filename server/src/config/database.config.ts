import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER || 'app',
  password: process.env.DATABASE_PASSWORD || 'app',
  db: process.env.DATABASE_DB || 'article_app',
}));

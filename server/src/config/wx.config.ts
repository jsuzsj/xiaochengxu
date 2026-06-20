import { registerAs } from '@nestjs/config';

export default registerAs('wx', () => ({
  appId: process.env.WX_APPID || '',
  secret: process.env.WX_SECRET || '',
  mock: (process.env.WX_MOCK || 'true') === 'true',
}));

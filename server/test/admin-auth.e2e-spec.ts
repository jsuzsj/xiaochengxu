import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cleanDb, createApp, seedAdmin } from './helpers';

describe('AdminAuth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await cleanDb(app);
    await seedAdmin(app, 'admin', 'pass123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('correct password → 200 + token', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ username: 'admin', password: 'pass123' });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeDefined();
    expect(r.body.admin.username).toBe('admin');
  });

  it('wrong password → 401', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(r.status).toBe(401);
  });

  it('nonexistent user → 401', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ username: 'nope', password: 'x' });
    expect(r.status).toBe(401);
  });
});

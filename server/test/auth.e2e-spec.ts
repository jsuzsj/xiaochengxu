import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cleanDb, createApp } from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await cleanDb(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login new openid → 200 + token + user', async () => {
    const r = await request(app.getHttpServer()).post('/api/auth/login').send({ code: 'dev-1' });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeDefined();
    expect(r.body.user.openid).toBe('mock_dev-1');
  });

  it('same code → same user id (idempotent login)', async () => {
    const a = (
      await request(app.getHttpServer()).post('/api/auth/login').send({ code: 'dev-2' })
    ).body;
    const b = (
      await request(app.getHttpServer()).post('/api/auth/login').send({ code: 'dev-2' })
    ).body;
    expect(a.user.id).toBe(b.user.id);
  });

  it('POST /api/auth/profile updates nickname (reader token)', async () => {
    const { token } = (
      await request(app.getHttpServer()).post('/api/auth/login').send({ code: 'dev-3' })
    ).body;
    const r = await request(app.getHttpServer())
      .post('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: '小明' });
    expect(r.status).toBe(201);
    expect(r.body.nickname).toBe('小明');
  });

  it('POST /api/auth/profile without token → 401', async () => {
    const r = await request(app.getHttpServer()).post('/api/auth/profile').send({ nickname: 'x' });
    expect(r.status).toBe(401);
  });

  it('POST /api/auth/profile accepts valid phone', async () => {
    const { token } = (
      await request(app.getHttpServer()).post('/api/auth/login').send({ code: 'phone-1' })
    ).body;
    const r = await request(app.getHttpServer())
      .post('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '13800138000' });
    expect(r.status).toBe(201);
    expect(r.body.phone).toBe('13800138000');
  });

  it('POST /api/auth/profile rejects bad phone format → 400', async () => {
    const { token } = (
      await request(app.getHttpServer()).post('/api/auth/login').send({ code: 'phone-2' })
    ).body;
    const r = await request(app.getHttpServer())
      .post('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '123' });
    expect(r.status).toBe(400);
  });
});

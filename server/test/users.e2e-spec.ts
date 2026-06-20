import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cleanDb, createApp, loginAsReader, seedAdmin } from './helpers';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await createApp();
    await cleanDb(app);
    await seedAdmin(app, 'admin', 'pass123');
    adminToken = (
      await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({ username: 'admin', password: 'pass123' })
    ).body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  async function createReader(code: string, nickname: string): Promise<string> {
    const { token } = (
      await request(app.getHttpServer()).post('/api/auth/login').send({ code })
    ).body;
    await request(app.getHttpServer())
      .post('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname });
    return token;
  }

  it('lists readers, searchable by nickname', async () => {
    await createReader('u-aa', '小明');
    await createReader('u-bb', '小红');

    const list = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(2);

    const search = await request(app.getHttpServer())
      .get('/api/admin/users?search=小')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(search.body.items.every((u: { nickname: string | null }) => (u.nickname ?? '').includes('小'))).toBe(true);
    expect(search.body.items.length).toBeGreaterThanOrEqual(2);
  });

  it('detail returns a reader', async () => {
    const { token } = (
      await request(app.getHttpServer()).post('/api/auth/login').send({ code: 'u-detail' })
    ).body;
    const me = await request(app.getHttpServer())
      .post('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: '详情' });
    const id = me.body.id;
    const r = await request(app.getHttpServer())
      .get(`/api/admin/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(id);
    expect(r.body.nickname).toBe('详情');
  });

  it('reader cannot access admin users → 403', async () => {
    const readerToken = await loginAsReader(app, 'u-403');
    const r = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${readerToken}`);
    expect(r.status).toBe(403);
  });
});

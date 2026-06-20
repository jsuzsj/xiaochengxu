import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cleanDb, createApp, loginAsReader, seedAdmin } from './helpers';

describe('Stats (e2e)', () => {
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

  it('returns aggregated counts', async () => {
    await loginAsReader(app, 's1'); // 1 reader
    const cat = (
      await request(app.getHttpServer())
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '科技' })
    ).body.id;
    await request(app.getHttpServer())
      .post('/api/admin/articles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '发布', content: '<p></p>', category_id: cat, status: 1 });
    await request(app.getHttpServer())
      .post('/api/admin/articles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '草稿', content: '<p></p>', category_id: cat, status: 0 });

    const r = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(r.status).toBe(200);
    expect(r.body.articleTotal).toBe(2);
    expect(r.body.articlePublished).toBe(1);
    expect(r.body.readerTotal).toBe(1);
    expect(r.body.viewTotal).toBe(0);
  });

  it('reader cannot access stats → 403', async () => {
    const readerToken = await loginAsReader(app, 's2');
    const r = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${readerToken}`);
    expect(r.status).toBe(403);
  });
});

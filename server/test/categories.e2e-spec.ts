import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Article } from '../src/entities/article.entity';
import { cleanDb, createApp, loginAsReader, seedAdmin } from './helpers';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let readerToken: string;

  beforeAll(async () => {
    app = await createApp();
    await cleanDb(app);
    await seedAdmin(app, 'admin', 'pass123');
    adminToken = (
      await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({ username: 'admin', password: 'pass123' })
    ).body.token;
    readerToken = await loginAsReader(app, 'cat-reader');
  });

  afterAll(async () => {
    await app.close();
  });

  it('admin can create + reader can list + update + delete', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '科技', sort: 1 });
    expect(created.status).toBe(201);
    expect(created.body.id).toBeDefined();
    const id = created.body.id;

    const list = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${readerToken}`);
    expect(list.status).toBe(200);
    expect(list.body.some((c: { id: string; name: string }) => c.id === id && c.name === '科技')).toBe(true);

    const upd = await request(app.getHttpServer())
      .put(`/api/admin/categories/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '科技2' });
    expect(upd.status).toBe(200);
    expect(upd.body.name).toBe('科技2');

    const del = await request(app.getHttpServer())
      .delete(`/api/admin/categories/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
  });

  it('reader token cannot access admin endpoints → 403', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ name: 'x' });
    expect(r.status).toBe(403);
  });

  it('no token → 401 on admin endpoints', async () => {
    const r = await request(app.getHttpServer()).post('/api/admin/categories').send({ name: 'x' });
    expect(r.status).toBe(401);
  });

  it('delete referenced category → 409', async () => {
    const cat = (
      await request(app.getHttpServer())
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '生活' })
    ).body;
    const ds = app.get(DataSource);
    const repo = ds.getRepository(Article);
    await repo.save(
      repo.create({
        title: 'a',
        content: '<p></p>',
        category: { id: cat.id } as Article['category'],
        status: 0,
      }),
    );
    const del = await request(app.getHttpServer())
      .delete(`/api/admin/categories/${cat.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(409);
  });
});

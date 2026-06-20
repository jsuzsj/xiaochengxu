import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Article } from '../src/entities/article.entity';
import { Tag } from '../src/entities/tag.entity';
import { cleanDb, createApp, loginAsReader, seedAdmin } from './helpers';

describe('Tags (e2e)', () => {
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
    readerToken = await loginAsReader(app, 'tag-reader');
  });

  afterAll(async () => {
    await app.close();
  });

  it('admin CRUD + reader list', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '前端' });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const list = await request(app.getHttpServer())
      .get('/api/tags')
      .set('Authorization', `Bearer ${readerToken}`);
    expect(list.status).toBe(200);
    expect(list.body.some((t: { id: string }) => t.id === id)).toBe(true);

    const upd = await request(app.getHttpServer())
      .put(`/api/admin/tags/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '前端2' });
    expect(upd.status).toBe(200);
    expect(upd.body.name).toBe('前端2');

    const del = await request(app.getHttpServer())
      .delete(`/api/admin/tags/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
  });

  it('duplicate name → 409', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '重复' });
    const r = await request(app.getHttpServer())
      .post('/api/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '重复' });
    expect(r.status).toBe(409);
  });

  it('reader → 403; no token → 401', async () => {
    const r1 = await request(app.getHttpServer())
      .post('/api/admin/tags')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ name: 'x' });
    expect(r1.status).toBe(403);
    const r2 = await request(app.getHttpServer()).post('/api/admin/tags').send({ name: 'x' });
    expect(r2.status).toBe(401);
  });

  it('delete tag removes article_tags association but keeps article', async () => {
    const tag = (
      await request(app.getHttpServer())
        .post('/api/admin/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '待删' })
    ).body;
    const ds = app.get(DataSource);
    const articleRepo = ds.getRepository(Article);
    const art = await articleRepo.save(
      articleRepo.create({
        title: 't',
        content: '<p></p>',
        status: 1,
        tags: [{ id: tag.id } as Tag],
      }),
    );
    const del = await request(app.getHttpServer())
      .delete(`/api/admin/tags/${tag.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    const still = await articleRepo.findOne({ where: { id: art.id }, relations: { tags: true } });
    expect(still).toBeTruthy();
    expect(still!.tags.length).toBe(0);
  });
});

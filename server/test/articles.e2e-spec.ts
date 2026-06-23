import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { cleanDb, createApp, loginAsReader, seedAdmin } from './helpers';

describe('Articles (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let readerToken: string;
  let categoryId: string;
  let tagId: string;

  beforeAll(async () => {
    app = await createApp();
    await cleanDb(app);
    await seedAdmin(app, 'admin', 'pass123');
    adminToken = (
      await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({ username: 'admin', password: 'pass123' })
    ).body.token;
    readerToken = await loginAsReader(app, 'art-reader');
    categoryId = (
      await request(app.getHttpServer())
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '科技' })
    ).body.id;
    tagId = (
      await request(app.getHttpServer())
        .post('/api/admin/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '前端' })
    ).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  function createArticle(overrides: Record<string, unknown> = {}) {
    return request(app.getHttpServer())
      .post('/api/admin/articles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '标题',
        content: '<p>正文</p>',
        category_id: categoryId,
        ...overrides,
      });
  }

  it('reader list only returns published, sorted by published_at desc', async () => {
    await createArticle({ title: '草稿A', status: 0 });
    await createArticle({ title: '发布B', status: 1 });
    const r = await request(app.getHttpServer())
      .get('/api/articles')
      .set('Authorization', `Bearer ${readerToken}`);
    expect(r.status).toBe(200);
    expect(r.body.items.map((x: { title: string }) => x.title)).toEqual(['发布B']);
  });

  it('reader detail 404 for draft; view_count increments for published', async () => {
    const draft = (await createArticle({ title: '草稿', status: 0 })).body;
    const d1 = await request(app.getHttpServer())
      .get(`/api/articles/${draft.id}`)
      .set('Authorization', `Bearer ${readerToken}`);
    expect(d1.status).toBe(404);

    const pub = (await createArticle({ title: '发布', status: 1 })).body;
    await request(app.getHttpServer())
      .get(`/api/articles/${pub.id}`)
      .set('Authorization', `Bearer ${readerToken}`)
      .expect(200);
    const r2 = await request(app.getHttpServer())
      .get(`/api/articles/${pub.id}`)
      .set('Authorization', `Bearer ${readerToken}`);
    expect(r2.body.view_count).toBe(2);
  });

  it('filter by category and tag', async () => {
    const otherCat = (
      await request(app.getHttpServer())
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '生活' })
    ).body.id;
    await createArticle({ title: '带标签', status: 1, tag_ids: [tagId] });
    await createArticle({ title: '其他分类', status: 1, category_id: otherCat });

    const byCat = await request(app.getHttpServer())
      .get(`/api/articles?category=${categoryId}`)
      .set('Authorization', `Bearer ${readerToken}`);
    expect(byCat.body.items.every((x: { category: { id: string } | null }) => x.category?.id === categoryId)).toBe(true);

    const byTag = await request(app.getHttpServer())
      .get(`/api/articles?tag=${tagId}`)
      .set('Authorization', `Bearer ${readerToken}`);
    expect(byTag.body.items.every((x: { tags: { id: string }[] }) => x.tags.some((t) => t.id === tagId))).toBe(true);
    expect(byTag.body.items.some((x: { title: string }) => x.title === '带标签')).toBe(true);
  });

  it('admin list filters by status and searches title', async () => {
    await createArticle({ title: '可搜索文章', status: 0 });
    const byStatus = await request(app.getHttpServer())
      .get('/api/admin/articles?status=0')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(byStatus.body.items.every((x: { status: number }) => x.status === 0)).toBe(true);

    const bySearch = await request(app.getHttpServer())
      .get('/api/admin/articles?search=可搜索')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(bySearch.body.items.some((x: { title: string }) => x.title === '可搜索文章')).toBe(true);
  });

  it('publish via PATCH sets published_at; unpublish keeps it', async () => {
    const a = (await createArticle({ title: '待发布', status: 0 })).body;
    expect(a.published_at).toBeNull();

    const pub = await request(app.getHttpServer())
      .patch(`/api/admin/articles/${a.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 1 });
    expect(pub.status).toBe(200);
    expect(pub.body.published_at).not.toBeNull();
    const pubAt = pub.body.published_at;

    const unpub = await request(app.getHttpServer())
      .patch(`/api/admin/articles/${a.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 0 });
    expect(unpub.body.status).toBe(0);
    expect(unpub.body.published_at).toBe(pubAt);
  });

  it('content sanitized: script tag stripped, allowed tags kept', async () => {
    const a = await createArticle({
      title: 'XSS',
      content: '<p>hi</p><script>alert(1)</script>',
      status: 1,
    });
    expect(a.body.content).not.toContain('<script>');
    expect(a.body.content).toContain('<p>hi</p>');
  });

  it('update article changes fields and tags', async () => {
    const a = (await createArticle({ title: '原标题', status: 0 })).body;
    const u = await request(app.getHttpServer())
      .put(`/api/admin/articles/${a.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '新标题', tag_ids: [tagId] });
    expect(u.status).toBe(200);
    expect(u.body.title).toBe('新标题');
    expect(u.body.tags.some((t: { id: string }) => t.id === tagId)).toBe(true);
  });

  it('delete article', async () => {
    const a = (await createArticle({ title: '待删', status: 0 })).body;
    const del = await request(app.getHttpServer())
      .delete(`/api/admin/articles/${a.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
  });

  it('reader cannot access admin endpoints → 403', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/admin/articles')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ title: 'x', content: 'x', category_id: categoryId });
    expect(r.status).toBe(403);
  });

  it('reader detail inserts a read_record; repeat inserts another', async () => {
    const pub = (await createArticle({ title: '阅读', status: 1 })).body;
    await request(app.getHttpServer())
      .get(`/api/articles/${pub.id}`)
      .set('Authorization', `Bearer ${readerToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/articles/${pub.id}`)
      .set('Authorization', `Bearer ${readerToken}`)
      .expect(200);
    const rows = await app
      .get(DataSource)
      .query('SELECT count(*)::int AS c FROM read_records WHERE article_id=$1', [pub.id]);
    expect(rows[0].c).toBe(2);
  });
});

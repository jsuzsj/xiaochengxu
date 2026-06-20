import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { existsSync } from 'fs';
import { join } from 'path';
import { cleanDb, createApp, seedAdmin } from './helpers';

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/IqVAAAAAElFTkSuQmCC',
  'base64',
);

describe('Upload (e2e)', () => {
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

  it('admin uploads image → 201 + url accessible', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/admin/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', PNG_1x1, 'test.png');
    expect(r.status).toBe(201);
    expect(r.body.url).toMatch(/^\/uploads\/.+\.png$/);

    // 文件已落盘（静态 HTTP 服务在真实 listen 下由 ServeStaticModule 提供，联调阶段验证）
    const filename = (r.body.url as string).replace('/uploads/', '');
    expect(existsSync(join(process.env.UPLOAD_DIR || 'uploads', filename))).toBe(true);
  });

  it('non-image → 400', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/admin/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('hello'), 'test.txt');
    expect(r.status).toBe(400);
  });

  it('no token → 401', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/admin/upload')
      .attach('file', PNG_1x1, 'test.png');
    expect(r.status).toBe(401);
  });
});

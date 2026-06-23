import * as bcrypt from 'bcrypt';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { Admin } from '../src/entities/admin.entity';
import { AppModule } from '../src/app.module';

export async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

export async function cleanDb(app: INestApplication): Promise<void> {
  const ds = app.get(DataSource);
  await ds.query(
    'TRUNCATE users, admins, articles, categories, tags, article_tags, read_records RESTART IDENTITY CASCADE',
  );
}

export async function loginAsReader(app: INestApplication, code = 'reader-test'): Promise<string> {
  const r = await request(app.getHttpServer()).post('/api/auth/login').send({ code });
  return r.body.token as string;
}

export async function seedAdmin(
  app: INestApplication,
  username = 'admin',
  password = 'pass123',
): Promise<void> {
  const repo = app.get(DataSource).getRepository(Admin);
  const hash = await bcrypt.hash(password, 10);
  const existing = await repo.findOne({ where: { username } });
  if (existing) {
    existing.password_hash = hash;
    await repo.save(existing);
  } else {
    await repo.save(repo.create({ username, password_hash: hash }));
  }
}

export async function loginAsAdmin(
  app: INestApplication,
  username = 'admin',
  password = 'pass123',
): Promise<string> {
  await seedAdmin(app, username, password);
  const r = await request(app.getHttpServer())
    .post('/api/admin/auth/login')
    .send({ username, password });
  return r.body.token as string;
}

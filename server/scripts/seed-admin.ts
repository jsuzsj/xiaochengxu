import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Admin } from '../src/entities/admin.entity';

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error('用法: npx ts-node scripts/seed-admin.ts <username> <password>');
    process.exit(1);
  }
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'app',
    password: process.env.DATABASE_PASSWORD || 'app',
    database: process.env.DATABASE_DB || 'article_app',
    entities: [Admin],
    synchronize: false,
  });
  await ds.initialize();
  try {
    const repo = ds.getRepository(Admin);
    const hash = await bcrypt.hash(password, 10);
    const existing = await repo.findOne({ where: { username } });
    if (existing) {
      existing.password_hash = hash;
      await repo.save(existing);
      console.log(`已更新管理员: ${username}`);
    } else {
      await repo.save(repo.create({ username, password_hash: hash }));
      console.log(`已创建管理员: ${username}`);
    }
  } finally {
    await ds.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

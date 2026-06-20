# 部署指南

## 架构

单台服务器跑 Nginx + NestJS + PostgreSQL。Nginx 做 HTTPS 终止、反代 `/api`、托管后台 `admin/dist` 静态文件、托管 `/uploads` 图片。

## 前置条件（硬约束）

1. **域名 + ICP 备案 + HTTPS**：小程序访问外部域名要求 HTTPS 且域名已备案。
2. **小程序后台配置合法域名**：在小程序管理后台配置 `request`、`uploadFile`、`downloadFile` 合法域名（你的 HTTPS 域名）。
3. **个人主体**：本系统不采集手机号，无需企业认证即可运行。
4. PostgreSQL 16、Node.js 22、Nginx。

## 构建

```bash
# 后端
cd server
npm ci
npm run build          # 产物 dist/

# 后台
cd admin
npm ci
npm run build          # 产物 dist/

# 小程序：用微信开发者工具上传/预览，无需构建
```

## 配置

`server/.env`（生产）：

```bash
DATABASE_HOST=... DATABASE_PORT=5432 DATABASE_USER=... DATABASE_PASSWORD=... DATABASE_DB=article_app
JWT_SECRET=<强随机串>
JWT_READER_EXPIRES=7d
JWT_ADMIN_EXPIRES=1d
WX_APPID=wx8fd005be10d08e8b
WX_SECRET=<真实 secret>
WX_MOCK=false          # 生产关闭 mock
UPLOAD_DIR=./uploads
CORS_ORIGIN=https://your-domain.com
APP_BASE_URL=https://your-domain.com   # 上传图片返回绝对 URL；小程序 rich-text 直接可用
```

⚠️ 生产环境把 `app.module.ts` 的 `synchronize: true` 改为 `false`，改用 TypeORM 迁移建表。

## 部署

1. 启动 PostgreSQL（生产用独立实例或托管 PG，不用开发 docker-compose）。
2. `cd server && npx ts-node scripts/seed-admin.ts <username> <password>` 建首个管理员。
3. 用 PM2/systemd 守护 `node server/dist/main`（`cd server` 后启动，确保 `.env` 与 `uploads/` 相对路径正确）。
4. Nginx 配置见 `server/nginx.conf`，把 `admin/dist`、`server/uploads`、`/api` 反代到位。
5. 小程序 `miniprogram/utils/request.ts` 的 `BASE` 改为 `https://your-domain.com/api`。

## 联调验证

- 后台登录 → 建分类/标签 → 建文章（含图片）→ 发布。
- 小程序首次进入弹资料弹窗 → 列表筛选 → 详情阅读 → 我的退出。
- 后台读者列表能看到刚登录的读者；仪表盘计数正确。
- 图片在小程序正文与后台编辑器均能显示（绝对 URL）。

## 开发本地

```bash
cd server && docker compose up -d   # PostgreSQL
cd server && npm run start:dev      # :3000
cd admin && npm run dev             # :5173
# 微信开发者工具打开 miniprogram/，关闭"不校验合法域名"
cd server && npm run test:e2e       # 32 个 e2e
```

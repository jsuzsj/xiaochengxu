# 文章展示小程序 + 后台管理系统

一个微信小程序文章展示系统：读者在小程序里浏览分类/标签筛选的富文本文章（微信登录），管理员通过 Web 后台管理文章/分类/标签并查看读者。三端共用一套 NestJS API。

## 架构

```
微信小程序(读者端) ──┐
                     ├──▶ Nginx ──▶ NestJS API ──▶ PostgreSQL
React 后台(管理员端) ─┘            └── /uploads 图片
```

- **小程序读者端** `miniprogram/`：浏览文章、分类/标签筛选、阅读正文（rich-text）、微信登录。
- **后端** `server/`：NestJS + TypeORM + PostgreSQL，JWT 鉴权（reader/admin 两套），富文本内容白名单清洗。
- **后台** `admin/`：React + Ant Design + wangEditor，管理文章/分类/标签、查看读者、仪表盘。

## 技术栈

| 端 | 技术 |
|---|---|
| 小程序 | TypeScript · glass-easel · Skyline（Donut 多端框架） |
| 后端 | Node.js 22 · NestJS 11 · TypeORM 1.0 · PostgreSQL 16 · Jest/supertest · sanitize-html |
| 后台 | Vite · React 18 · Ant Design 5 · @ant-design/pro-components · wangEditor |
| 部署 | Nginx（HTTPS 反代 + 静态托管） |

## 目录结构

```
miniapp-1/
├── miniprogram/          # 读者端小程序
│   ├── app.ts            # onLaunch 静默 wx.login 登录
│   ├── utils/request.ts  # wx.request 封装（带 JWT、401 续期）
│   ├── components/login-modal/   # 资料弹窗（昵称/头像）
│   └── pages/{index,detail,mine}/
├── server/               # NestJS 后端
│   ├── src/{auth,articles,categories,tags,users,upload,stats,common,config,entities}/
│   ├── test/             # 32 个 e2e
│   ├── scripts/seed-admin.ts
│   ├── docker-compose.yml
│   └── .env.example
├── admin/                # React 后台
│   ├── src/{api,layouts,pages/}
│   └── .env.example
├── docs/superpowers/     # 设计文档与实现计划
├── DEPLOY.md             # 部署指南
└── project.config.json   # 微信开发者工具配置（miniprogramRoot=miniprogram/）
```

## 环境要求

- **Node.js 22+**、**npm 10+**
- **Docker**（用于本地 PostgreSQL；或自备 PostgreSQL 16）
- **微信开发者工具**（稳定版）
- macOS / Linux / Windows 均可

---

## 快速开始（开发环境）

> 前置：已安装 Node.js 22+ 和 Docker（Docker Desktop / OrbStack 等）。

### 1. 安装依赖

```bash
cd server && npm install && cd ..
cd admin  && npm install && cd ..
```

### 2. 启动 PostgreSQL

```bash
cd server
docker compose up -d        # 启动 postgres:16-alpine，db=article_app，user/pass=app，端口 5432
```

验证容器在运行：

```bash
docker compose ps           # 应看到 postgres Up
docker exec article_app_pg pg_isready -U app -d article_app   # 应看到 accepting connections
```

> **Docker Hub 拉取失败？** 国内网络常因 `registry-1.docker.io` 被墙报 `Bad Gateway`。改用镜像源：
> ```bash
> docker pull docker.m.daocloud.io/library/postgres:16-alpine
> docker tag docker.m.daocloud.io/library/postgres:16-alpine postgres:16-alpine
> docker compose up -d
> ```

### 3. 配置后端环境变量

```bash
cp server/.env.example server/.env
```

开发期默认值可直接用（`WX_MOCK=true` 免真实微信登录、DB 用 docker 的 app/app）。`.env` 关键项：

```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=app
DATABASE_PASSWORD=app
DATABASE_DB=article_app
JWT_SECRET=change-me              # 开发可用默认，生产必须改强随机
WX_APPID=wx8fd005be10d08e8b
WX_SECRET=replace-with-real-secret
WX_MOCK=true                      # 开发：mock code2Session；生产改 false 并填真实 WX_SECRET
APP_BASE_URL=http://localhost:3000  # 上传图片返回的绝对 URL 前缀
CORS_ORIGIN=http://localhost:5173    # 后台地址
```

### 4. 启动后端

在一个**独立终端**运行（watch 模式，改代码自动重启）：

```bash
cd server
npm run start:dev
```

看到 `Nest application successfully started` 即成功，监听 http://localhost:3000 。首次启动会自动建表（6 张：users/admins/categories/tags/articles/article_tags）。

快速验证：

```bash
curl -s -X POST http://localhost:3000/api/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"pass123"}'
# 未建管理员前会返回 401，正常——下一步创建
```

### 5. 创建管理员账号

```bash
cd server
npx ts-node scripts/seed-admin.ts admin pass123
# 输出：已创建管理员: admin（已存在则更新密码）
```

### 6. 启动后台管理

```bash
cp admin/.env.example admin/.env    # 内容：VITE_API_BASE=http://localhost:3000/api
cd admin
npm run dev
```

打开 http://localhost:5173 ，用 **admin / pass123** 登录。

在后台：
1. 「分类」→ 新建分类（如"科技"）
2. 「标签」→ 新建标签（如"前端"）
3. 「文章」→ 新建文章 → 填标题、选分类/标签、用 wangEditor 写正文（可插图）→ 点「发布」
4. 发布后小程序首页即可看到

### 7. 启动小程序读者端

1. 打开**微信开发者工具**，导入项目，目录选**仓库根目录**（含 `project.config.json`），AppID 用 `wx8fd005be10d08e8b` 或测试号。
2. **关键**：右上角「详情」→「本地设置」→ 勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**（开发期用 `http://localhost`，必须关校验，否则请求被拦截报"网络错误"）。
3. 点「编译」。

小程序流程：
- 进入即自动静默登录（`wx.login` 换 openid，`WX_MOCK=true` 下免真实微信）。
- 首次弹出资料弹窗（选昵称/头像，可跳过）。
- 首页显示已发布文章列表，可按分类/标签筛选，上拉分页。
- 点文章进详情，`rich-text` 渲染正文，浏览数 +1。
- 「我的」页显示昵称/头像，可退出登录。

> 小程序请求地址在 `miniprogram/utils/request.ts` 的 `BASE`（开发为 `http://localhost:3000/api`）。**真机预览**时需改为电脑局域网 IP（如 `http://192.168.x.x:3000/api`），并在开发者工具同样关闭域名校验。

---

## 默认账号

| 端 | 账号 | 密码 |
|---|---|---|
| 后台管理 | `admin` | `pass123` |
| 小程序读者 | 自动登录（openid） | 无需密码 |

> 读者登录为静默 `wx.login`，开发期 `WX_MOCK=true` 不依赖真实微信；个人主体不采集手机号（平台限制），仅 openid + 昵称/头像。

## 接口与测试

后端 e2e（32 个，覆盖鉴权/文章/分类/标签/上传/读者/统计）：

```bash
cd server
npm run test:e2e       # 已默认 --runInBand（串行，避免并发操作 DB）
```

主要接口：

```
读者端 /api（reader JWT）
  POST /auth/login {code}              登录/建号
  POST /auth/profile {nickname,avatarUrl}  补全资料
  GET  /articles?category=&tag=&page=&size=  已发布文章列表
  GET  /articles/:id                   文章详情（浏览数+1）
  GET  /categories  /tags

管理端 /api/admin（admin JWT）
  POST /admin/auth/login {username,password}
  CRUD /admin/articles（含 PATCH :id/status 发布/撤回）
  CRUD /admin/categories  /admin/tags
  POST /admin/upload                     图片上传
  GET  /admin/users?page=&search=        读者列表
  GET  /admin/stats                      仪表盘统计
```

错误统一返回 `{ code, message }`。

## 常见问题

**小程序首页"网络错误"**
- 后端没启动 → `cd server && npm run start:dev`。
- 开发者工具未关闭域名校验 → 「详情」→「本地设置」勾选"不校验合法域名…"。
- 后端 `.env` 未配置 → DB 连不上，后端启动会反复重试连接；按步骤 3 配置。

**首页空白无文章**
- 后台还没发布文章 → 在后台建分类/文章并「发布」（草稿不对读者可见）。

**后端启动报 DB 连接失败**
- 确认 postgres 容器在跑：`docker compose -f server/docker-compose.yml ps`。
- 确认 `.env` 的 `DATABASE_*` 与 docker-compose 一致（默认 app/app/article_app）。

**`docker compose up` 拉镜像 Bad Gateway**
- Docker Hub 被墙，见步骤 2 的镜像源方案。

**端口被占用**
- 后端 3000 / 后台 5173 / PG 5432 被占时，改对应配置（后端 `PORT` env、后台 vite 端口、docker-compose 端口）。

**wangEditor 插入的图片预览不了**
- 图片 URL 是 `APP_BASE_URL/uploads/xxx`，确保 `APP_BASE_URL` 指向后端地址；后台（:5173）跨域访问后端（:3000）已通过 CORS 放行。

## 部署

生产部署（HTTPS + ICP 备案 + 合法域名配置、Nginx、迁移建表、关闭 `WX_MOCK`/`synchronize`）见 **[DEPLOY.md](DEPLOY.md)** 与 `server/nginx.conf`。

## 文档

- 设计文档：`docs/superpowers/specs/2026-06-21-article-miniapp-platform-design.md`
- 实现计划：`~/.claude/plans/quirky-spinning-panda.md`（执行记录见 git log）
- 部署：`DEPLOY.md`

# 文章展示小程序 + 后台管理系统 设计文档

- 日期：2026-06-21
- 状态：待评审
- 仓库：`/Users/zsj/WeChatProjects/miniapp-1`（Donut 多端框架微信小程序，TypeScript）

## 1. 概述

一个微信小程序，用于展示不同主题（分类 + 标签）的富文本文章。读者打开即自动登录后才能使用；管理员通过独立 Web 后台管理文章/分类/标签，并查看注册读者列表。后端为自建外部服务器，三端共用一套 API。

## 2. 范围

三个部分：

- **小程序（读者端）**：浏览分类/标签筛选的文章列表，阅读富文本正文；首次使用自动弹出登录；登录后方可使用。
- **后台管理（管理员端）**：独立 Web 面板，账号密码登录；文章/分类/标签 CRUD；查看注册读者列表。
- **后端服务**：NestJS REST API + PostgreSQL，负责数据存储、鉴权、微信登录、富文本图片上传。

## 3. 技术栈

| 层 | 选型 |
|---|---|
| 小程序 | TypeScript（现有 Donut 仓库），glass-easel，Skyline |
| 后端 | Node.js + NestJS + TypeORM |
| 数据库 | PostgreSQL |
| 后台 | React + Ant Design Pro |
| 富文本编辑器 | wangEditor（输出 HTML） |
| 反代/静态 | Nginx |
| 鉴权 | JWT（reader / admin 两套） |

## 4. 整体架构

```
┌──────────────┐    ┌──────────────┐
│ 微信小程序    │    │ React 后台   │
│ 读者端        │    │ 管理员端     │
└──────┬───────┘    └──────┬───────┘
       │  HTTPS (wx.request) │  HTTPS
       └─────────┬───────────┘
                 ▼
            ┌─────────┐
            │ Nginx   │  HTTPS 终止 / 反代 / 托管 React 静态 / 图片
            └────┬────┘
                 ▼
       ┌──────────────────┐        ┌─────────────────┐
       │  NestJS REST API │ ──────▶│ 微信 code2Session│
       │  JWT 鉴权 Guard  │        └─────────────────┘
       └────────┬─────────┘
                ▼
         ┌──────────────┐        ┌──────────────┐
         │ PostgreSQL   │        │ 图片存储      │
         │ users/admins │        │ 本地磁盘/OSS  │
         │ articles/... │        └──────────────┘
         └──────────────┘
```

部署：单台服务器跑 Nginx + NestJS + PostgreSQL。Nginx 托管后台 React 静态文件并反代 `/api` 到 NestJS；同时托管/缓存上传的图片。

## 5. 数据模型（PostgreSQL）

```
users（读者）
  id  openid(unique)  unionid?
  nickname?  avatar_url?
  created_at  last_login_at

admins（管理员）
  id  username(unique)  password_hash(bcrypt)  created_at

categories（分类）
  id  name  sort  created_at

tags（标签）
  id  name(unique)  created_at

articles（文章）
  id  title  summary?  cover_url?  content(text, 富文本HTML)
  category_id → categories
  status smallint        -- 0 草稿 / 1 已发布
  view_count int
  author_admin_id → admins
  created_at  updated_at  published_at

article_tags（文章 ↔ 标签 多对多）
  article_id → articles   tag_id → tags
  PRIMARY KEY (article_id, tag_id)
```

说明：
- 读者以 `openid` 为唯一标识。`nickname`/`avatar_url` 可空，登录后由用户在资料弹窗中补全。
- 不再采集手机号（个人主体限制，见 §10）。
- 文章 `status` 控制可见性，读者端只返回 `status=1`。
- 上传图片路径写入富文本 HTML；v1 不建独立 `images` 表，后续如需清理再补。

## 6. 鉴权与登录流程

### 6.1 读者登录（openid + 昵称，无手机号）

个人主体下 `wx.login` + `code2Session` 换取 openid 可用，昵称/头像用选择器组件可用；`getPhoneNumber` 不可用，故不采集手机号。

```
① 进入小程序 onLaunch
② wx.login() → code → POST /auth/login {code}
   后端 code2Session 换 openid → 查/建 user → 发 reader JWT
   （此步静默，用户无感，即为"登录"）
③ 首次进入：全局状态触发 login-modal 弹出（完善资料）
   - <input type="nickname"> 选择微信昵称
   - <button open-type="chooseAvatar"> 选择头像
   - 可跳过（跳过则昵称默认"微信用户"）
④ 用户确认/跳过 → POST /auth/profile {nickname, avatarUrl} → 补全
⑤ 关闭弹窗 → 进入正文
⑥ 后续请求带 JWT；过期 → 静默 wx.login 续期
```

- "使用系统时自动弹出登录" + "必须登录才能用"：openid 登录在 onLaunch 静默完成——必须有 JWT 才能调文章接口，JWT 在首次启动时自动取得，故"必须登录"对用户是无感的。首次弹出的 login-modal 用于完善昵称/头像，是用户可见的"登录"环节；**该弹窗可跳过，不阻塞阅读**（JWT 已在 onLaunch 取得）。token 有效期内不再弹。
- reader JWT：`{sub, role:'reader', openid}`，有效期 7 天，存 `wx.setStorageSync`。

### 6.2 管理员登录

```
后台登录页 → username + password
→ POST /admin/auth/login → bcrypt 校验 → admin JWT → 进后台
```

- admin JWT：`{sub, role:'admin'}`，有效期 1 天，存浏览器 localStorage。
- 首个管理员账号由初始化脚本写入数据库，不开放注册接口。

### 6.3 鉴权

- NestJS Guard 按 JWT 中 `role` 鉴权，reader / admin 两套 token 不互通。
- 401 → 小程序请求层静默 `wx.login` 续期；续期失败 → 重新弹 login-modal。后台 401 → 跳登录页。

## 7. API 设计

```
── 读者端 /api（reader JWT Guard）──
POST /auth/login     {code}                 → 建号/登录，返回 {token, user}
POST /auth/profile   {nickname, avatarUrl?} → 补全昵称/头像
GET  /articles?category=&tag=&page=&size=   → 已发布文章列表（分页）
GET  /articles/:id                          → 文章详情（view_count+1）
GET  /categories                            → 分类列表
GET  /tags                                  → 标签列表

── 管理员端 /api/admin（admin JWT Guard）──
POST /admin/auth/login   {username,password} → 登录
CRUD /admin/articles                        → 文章（含草稿/发布切换）
CRUD /admin/categories                      → 分类
CRUD /admin/tags                            → 标签
POST /admin/upload                          → 富文本图片上传，返回 {url}
GET  /admin/users?page=&search=             → 注册读者列表
GET  /admin/users/:id                       → 读者详情
```

约定：
- 读者文章列表/详情只返回 `status=1`。
- 浏览数在详情接口累加（v1 不去重）。
- 错误响应统一：`{code, message}`，由 NestJS 全局异常过滤器输出。

## 8. 小程序端结构（读者端）

基于现有 `miniprogram/` 目录改造（替换 demo 内容）：

```
app.ts            onLaunch 静默 wx.login 登录 + 检查资料完整性 → 触发 login-modal
app.json          tabBar: 文章(首页) / 我的
pages/index       文章列表 · 分类/标签筛选 · 分页
pages/detail      文章详情 · rich-text 渲染 · 浏览数
pages/mine        昵称/头像 · 退出登录
components/login-modal   全局登录/资料弹窗组件
utils/request     封装 wx.request：统一带 JWT、401 续期、错误 toast
```

- tabBar 两页：`index`（文章列表）、`mine`（我的）；`detail` 从列表点进。
- 请求层 `utils/request` 统一注入 `Authorization: Bearer <token>`，拦截 401。
- 文章正文用 `rich-text` 渲染 HTML（受其子集限制，见 §10）。

## 9. 后台端结构（管理员端）

React + Ant Design Pro，侧边栏 + 顶栏布局：

```
/login                 管理员登录
/dashboard             概览（文章数/读者数/浏览数）
/articles              文章列表（状态筛选 + 搜索）
/articles/edit/:id?    文章编辑：wangEditor 富文本 + 封面上传
                       + 分类下拉 + 标签多选 + 草稿/发布
/categories            分类管理（CRUD + 排序）
/tags                  标签管理（CRUD）
/users                 注册读者列表（昵称/注册时间/最近登录时间/搜索）
```

## 10. 关键边界与风险

1. **个人主体限制（已确认）**：当前小程序为个人主体，无法使用 `getPhoneNumber`。本设计**不采集手机号**，读者登录用 openid + 昵称。若未来认证为企业主体，可在 `users` 表加 `phone` 字段并补 `/auth/phone` 接口（预留扩展，不在 v1 实现）。
2. **`rich-text` HTML 子集**：小程序 `rich-text` 不支持 script、部分 CSS、外链图片。后台 wangEditor 需**白名单约束输出标签**；图片一律走 `/admin/upload` 上传到自有合法域名，禁外链。v1 用 rich-text + 白名单，不引入 wxParse/towxml。
3. **域名备案 + HTTPS**：小程序的 request / uploadFile / downloadFile 域名须在小程序后台配置，且 HTTPS + ICP 备案。本地开发用开发者工具"不校验合法域名"。
4. **昵称/头像组件**：`getUserProfile` 已废弃，改用 `input type="nickname"` 与 `button open-type="chooseAvatar"`（个人主体可用）。
5. **session_key**：openid 换取依赖 `code2Session`；token 续期时若 `wx.login` 失败则重新走登录流程。无手机号解密，不再涉及 session_key 解密场景。
6. **安全**：bcrypt 存密码、JWT 密钥走环境变量、TypeORM 参数化防注入、富文本服务端二次清洗（白名单）防 XSS、登录接口限流防爆破、后台 CORS 白名单。
7. **错误处理**：NestJS 全局异常过滤器统一 `{code, message}`；小程序请求层拦截 401 → 续期/弹窗，网络错误 → toast。

## 11. 测试策略

- **后端（Jest + supertest）**：service 单测覆盖 auth / articles / users；e2e 覆盖登录、文章 CRUD、reader/admin 权限隔离。微信 `code2Session` 全程 mock。开发环境提供 mock 登录接口便于本地调试。
- **小程序**：微信开发者工具自动化 + 手测（登录弹窗、文章渲染、分类/标签筛选、401 续期）。
- **后台 React**：v1 以手测 + 后端 e2e 为主，关键组件可加单测。

## 12. 前置条件

- 小程序 AppID：`wx8fd005be10d08e8b`（现有仓库）。
- 服务器域名：HTTPS + ICP 备案，并在小程序后台配置 request / uploadFile / downloadFile 合法域名。
- 后端服务器：Node.js 运行环境 + PostgreSQL + Nginx。
- 首个管理员账号：通过初始化脚本写入。
- 个人主体：无需企业认证即可实现上述全部功能（不采集手机号）。

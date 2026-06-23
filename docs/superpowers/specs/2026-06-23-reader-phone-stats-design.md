# 读者手机号 + 活跃统计面板 设计文档

- 日期：2026-06-23
- 状态：待评审
- 基础：现有文章展示系统（见 `2026-06-21-article-miniapp-platform-design.md`），本次为增强

## 1. 概述

为现有文章系统增加两项能力：
1. 读者登录资料补全时**填写手机号**（手动输入、不验证真实性、11 位格式校验、选填），后台读者列表可查看手机号。
2. 后台**用户活跃统计面板**：在现有 4 项统计基础上，扩展为含读者增长、读者活跃、文章浏览、热门内容四类的丰富面板，含卡片、趋势折线图、分布饼图。

## 2. 需求确认（澄清结论）

- **手机号**：手动输入、不验证真实性、11 位格式校验（`/^1\d{10}$/`）、**选填可跳过**。个人主体无需 getPhoneNumber。
- **资料弹窗字段**：手机号 + 昵称 + 头像，**均选填可跳过**。
- **后台读者列表**：显示手机号列。
- **活跃定义**：**阅读文章算活跃**——新增阅读记录表，打开文章详情记一条；活跃=时段内有阅读记录的 user。
- **统计面板**：卡片 + 趋势折线图 + 分布饼图（引入 `@ant-design/charts`）；四类统计（读者增长/活跃/文章浏览/热门内容）；今日/7日/30日维度。
- **聚合策略**：A. 实时 SQL 聚合（v1 数据量小，无额外依赖）。

## 3. 数据模型变更（PostgreSQL）

### users 表新增字段
```
+ phone  varchar(11)  nullable   -- 手动输入，11位格式校验（DTO层），选填
```
现有字段（openid/nickname/avatar_url/created_at/last_login_at）不变。

### 新增 read_records 表（阅读记录，支撑活跃 + 热门）
```
id          uuid PK
user_id     → users
article_id  → articles
created_at  timestamptz
索引: (user_id, created_at)  支撑活跃统计
      (article_id)           支撑热门文章
```
不去重——每次读者打开文章详情记一条（等同浏览次数）。

## 4. 登录资料流程（小程序）

- `app.ts` onLaunch 静默 `wx.login` → openid → token（不变）。
- `login-modal` 弹窗加**手机号输入**（`<input type="number">`，前端限 11 位）+ 昵称 + 头像，均选填可跳过。
- 提交调 `POST /auth/profile`，扩展接受 `phone`。
- 后端 `UpdateProfileDto` 加 `phone` 字段，`@Matches(/^1\d{10}$/)` + `@IsOptional()` 校验。

## 5. 后台读者列表

- `GET /api/admin/users` 返回项加 `phone` 字段。
- admin 读者列表表格加"手机号"列。

## 6. 阅读记录

- 读者打开文章详情 `GET /api/articles/:id` 时，在 ReaderGuard 下插入一条 `read_records`（user_id, article_id）。
- 现有 `incrView`（view_count+1）保留；新增插入 read_records。

## 7. 统计面板

### API：`GET /api/admin/stats`（AdminGuard，一个接口返回全部）

实时 SQL 聚合，返回：
- **卡片**：
  - readerTotal / readerNew{today,7d,30d}（users.created_at）
  - active{today,7d,30d}（read_records.user_id DISTINCT，时段内）
  - viewTotal / view{today,7d,30d}（read_records count）
  - articleTotal / articlePublished
- **折线**（近 30 天按天）：
  - readerTrend `[{date, count}]`（每日新增读者）
  - activeTrend `[{date, count}]`（每日活跃读者，按 read_records.user_id 去重）
  - viewTrend `[{date, count}]`（每日浏览量）
- **饼图**：
  - categoryDist `[{name, count}]`（各分类浏览占比，read_records join articles.category）
  - tagDist `[{name, count}]`（各标签浏览占比，read_records join article_tags）
- **热门**：
  - topArticles `[{id, title, view_count}]` Top 10（按 read_records count 排序，与浏览量数据源统一；view_count 一并返回用于展示）

### 后台面板实现（admin Dashboard）
- 用 `@ant-design/charts` 渲染：
  - 卡片行（Statistic）
  - 折线图（Line）三组趋势
  - 饼图（Pie）分类/标签分布
  - 热门文章列表（Table）

## 8. 涉及文件

**后端 server/**：
- `src/entities/user.entity.ts`：加 phone 字段
- `src/entities/read-record.entity.ts`：新增
- `src/auth/dto/update-profile.dto.ts`：加 phone + 校验
- `src/articles/articles.service.ts`：detail 插入 read_records
- `src/articles/articles.module.ts`：forFeature 加 ReadRecord
- `src/users/users.service.ts`：列表返回含 phone（实体自带，无需改）
- `src/stats/stats.service.ts`：扩展聚合查询
- `test/stats.e2e-spec.ts`、`test/articles.e2e-spec.ts`、`test/auth.e2e-spec.ts`：扩展

**小程序 miniprogram/**：
- `components/login-modal/`：加手机号输入 + 提交
- `utils/request.ts`：无改

**后台 admin/**：
- `src/pages/users/List.tsx`：加手机号列
- `src/pages/Dashboard.tsx`：重写为卡片+折线+饼图+热门
- `src/api.ts`：stats 返回类型更新
- `package.json`：加 `@ant-design/charts`

## 9. 测试（后端 e2e）

- `POST /auth/profile` 接受 phone + 11 位校验（非法格式 400、合法 201）。
- `GET /api/articles/:id` 后 read_records 插入一条；重复阅读插多条。
- `GET /api/admin/users` 返回含 phone。
- `GET /api/admin/stats` 返回卡片/折线/饼图/热门各项，数值正确（建读者/文章/阅读记录后校验今日/7日/30日计数与趋势）。

## 10. 边界

- 手机号不验证真实性（用户可乱填），仅格式校验。后续若需真实性可加短信验证。
- read_records 不去重，浏览量含重复阅读；v1 接受。
- 实时聚合：数据量增大后查询变重，届时迁预聚合日表（方案 B）。
- 阅读记录插入与 view_count 自增在同一事务，失败不影响阅读（容错：read_records 插入失败不阻断详情返回）。

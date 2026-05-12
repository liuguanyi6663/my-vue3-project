# 校内考研助手

> 面向高校考研学子的微信小程序全栈应用。提供考研时间线、学习打卡、资料共享、论坛、AI 助手、国家线查询、成绩估算等一站式支持。

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3-4.x-brightgreen" alt="Vue 3">
  <img src="https://img.shields.io/badge/UniApp-3.x-blue" alt="UniApp">
  <img src="https://img.shields.io/badge/Express-4.x-green" alt="Express">
  <img src="https://img.shields.io/badge/MySQL-8.x-orange" alt="MySQL">
  <img src="https://img.shields.io/badge/Redis-7.x-red" alt="Redis">
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

---

## 快速开始

### 环境要求
- Node.js >= 16、MySQL >= 8.0、Redis >= 6.0（可选）

### 1. 初始化数据库

```sql
CREATE DATABASE IF NOT EXISTS kaoyan_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql -u root -p kaoyan_db < database/schema.sql
```

### 2. 配置环境变量

```bash
cd server
cp .env.example .env
# 编辑 .env，修改 MySQL 密码等配置
```

关键配置项：`MYSQL_PASSWORD`、`JWT_SECRET`（生产环境必改）、`WECHAT_APPID`/`WECHAT_APPSECRET`（微信登录必填）

### 3. 启动后端

```bash
cd server
npm install
npm run dev        # 开发模式（nodemon 热重载）
# npm start        # 生产模式
```

后端运行在 `http://localhost:3000`，Swagger 文档：`http://localhost:3000/api-docs`

### 4. 启动前端

```bash
cd client
npm install
npm run dev:mp-weixin     # 微信小程序模式
# npm run dev:h5           # H5 浏览器调试
```

首次登录后，将用户设为管理员：

```sql
UPDATE users SET role = 'super_admin' WHERE id = 1;
```

---

## 功能模块

| 模块 | 功能 |
| --- | --- |
| **首页** | 考研倒计时、时间线甘特图、励志文案、轮播广告、通知公告、快捷入口 |
| **资料中心** | 多级分类、搜索、上传/下载（水印）、评价、收藏、审核上架 |
| **论坛社区** | 五大板块（含匿名树洞）、发帖/评论/点赞/收藏/举报、敏感词过滤 |
| **学习打卡** | 计划 CRUD、四套模板、任务打卡、打卡日历、连续统计、心情记录 |
| **复试工具箱** | 英语口语题库、简历模板、导师邮件模板（系统内置 + 用户上传） |
| **成绩估算** | 与国家线逐科对比、六档综合评估、个性化建议 |
| **国家线** | 历年数据查询（2022-2025），多维筛选，自动爬取当年数据 |
| **学校官网** | 510 所院校目录，按地区/类型（985/211/双一流/普通本科）筛选 |
| **AI 助手** | 考研问答、复习建议、心理疏导（内置 + OpenAI 兼容 API） |
| **私信聊天** | 一对一对话、屏蔽/防骚扰、禁言检测 |
| **头衔认证** | 上岸用户上传截图申请认证标识 |
| **管理后台** | 用户管理、内容审核、举报处理、数据导出、通知/广告/大屏管理、审计日志 |

---

## 项目结构

```
my-vue3-project/
├── client/                           # 前端（Vue 3 + UniApp）
│   └── src/
│       ├── api/                      # API 封装（request.js + index.js）
│       ├── components/               # 公共组件（PageLoading / Skeleton）
│       ├── pages/                    # 页面
│       │   ├── index/                # 首页
│       │   ├── materials/            # 资料中心
│       │   ├── forum/                # 论坛
│       │   ├── study/                # 学习打卡
│       │   ├── tools/                # 复试工具箱/成绩估算/学校官网
│       │   ├── national-line/        # 国家线
│       │   ├── mine/                 # 个人中心
│       │   ├── admin/                # 管理后台
│       │   ├── login/                # 登录
│       │   └── splash/               # 启动页
│       ├── utils/                    # 工具函数（auth/date/url/loading/authorize）
│       ├── static/                   # 静态资源
│       ├── App.vue / main.js / pages.json / manifest.json
│       └── uni.scss
│
├── server/                           # 后端（Express + MySQL）
│   ├── app.js                        # 入口
│   ├── config/                       # 配置（index.js / swagger.js）
│   ├── middleware/                   # 中间件（auth/upload/cache/security）
│   ├── routes/                       # 15 个路由模块
│   │   ├── user.js / home.js / material.js / forum.js / study.js
│   │   ├── admin.js / message.js / record.js / national-line.js
│   │   ├── interview.js / feedback.js / score-estimator.js
│   │   ├── title-certification.js / school-websites.js / ai.js
│   ├── utils/                       # db/sensitive-words/logger/redis/wechat/audit
│   ├── scripts/backup.js            # 数据库备份
│   └── .env / .env.example
│
└── database/schema.sql              # 建表 DDL + 种子数据
```

---

## 技术栈

| 层级 | 选型 |
| --- | --- |
| **前端** | Vue 3 (Composition API) + UniApp |
| **后端** | Express.js + mysql2/promise 连接池 |
| **缓存** | Redis（降级为内存缓存） |
| **认证** | JWT 双 Token（Access 15min + Refresh 7d 轮转） |
| **文件** | Multer（MIME 校验 + 魔数扫描 + 安全过滤） |
| **日志** | Winston 按日轮转 |
| **定时任务** | 账号清理、时间线提醒、国家线自动爬取 |

### 安全措施
- **鉴权**: 四级中间件：`auth → optionalAuth → adminAuth → superAdminAuth`
- **防护**: IP 限流 / XSS 过滤 / 安全响应头 / 敏感词过滤
- **审核**: 资料/帖子/复试内容均需审核后公开
- **审计**: 管理员所有关键操作记录审计日志
- **Token**: Refresh Token 单次失效 + 家族检测，防重放

---

## API 概览

**统一响应格式：**
```json
{ "code": 200, "msg": "success", "data": {} }
```

**状态码：** 200 成功 · 400 参数错误 · 401 未登录 · 403 权限不足 · 429 限流 · 500 服务端错误

| 路径前缀 | 模块 | 说明 |
| --- | --- | --- |
| `/api/user` | 用户 | 微信/手机登录、Token 刷新、资料、注销 |
| `/api/home` | 首页 | 时间线、广告、通知、励志文案 |
| `/api/material` | 资料中心 | 分类、上传/下载、评价、收藏 |
| `/api/forum` | 论坛 | 帖子、评论、点赞、收藏、举报 |
| `/api/study` | 学习 | 计划、打卡、模板、统计 |
| `/api/message` | 私信 | 会话、消息、屏蔽 |
| `/api/admin` | 管理 | 用户、审核、举报、配置、审计 |
| `/api/national-line` | 国家线 | 查询、管理 |
| `/api/record` | 考研数据 | 录入、审核、统计 |
| `/api/ai` | AI 助手 | 对话、历史 |
| `其他` | interview / feedback / score-estimator / title-certification / school-websites |

---

## 部署

```bash
# 后端（PM2）
npm install -g pm2
cd server && pm2 start app.js --name kaoyan-server && pm2 save

# 前端构建
cd client
npm run build:mp-weixin     # 微信小程序
npm run build:h5            # H5
```

Nginx 反向代理配置参见 [server/nginx.conf.example](server/nginx.conf.example)（部分生产部署场景需要自行创建）。

---

## License

MIT

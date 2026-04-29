<p align="center">
  <img src="client/src/static/logo/sxlglogo.svg" alt="校内考研助手" width="120">
</p>

<h1 align="center">校内考研助手</h1>

<p align="center">
  面向高校考研学子的微信小程序全栈应用<br>
  提供考研时间线追踪、学习打卡、资料共享、论坛社区、复试工具箱、数据大屏等功能，助力考研全流程
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.4-brightgreen" alt="Vue 3">
  <img src="https://img.shields.io/badge/UniApp-3.0-blue" alt="UniApp">
  <img src="https://img.shields.io/badge/Express-4.18-green" alt="Express">
  <img src="https://img.shields.io/badge/MySQL-8.0-orange" alt="MySQL">
  <img src="https://img.shields.io/badge/Vite-5.2-purple" alt="Vite">
</p>

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vue 3 + UniApp | Composition API，跨端适配微信小程序 / H5 / App |
| 后端 | Express.js | RESTful API，模块化路由 |
| 数据库 | MySQL 8.0 | utf8mb4 字符集，连接池 (mysql2/promise) |
| 认证 | JWT (jsonwebtoken) | Bearer Token，7 天有效期 |
| 文件上传 | Multer | 支持 PDF / Word / 图片，最大 50MB |
| 开发工具 | Vite 5 + Nodemon | 前端热更新，后端自动重启 |

## 项目结构

```
my-vue3-project/
├── client/                          # 前端 (Vue3 + UniApp)
│   ├── src/
│   │   ├── api/                     # API 封装
│   │   │   ├── request.js           # 请求工具 (统一拦截、Token 注入)
│   │   │   └── index.js             # 全部 API 集合
│   │   ├── pages/                   # 页面
│   │   │   ├── index/               # 首页 (倒计时、通知、快捷入口)
│   │   │   ├── materials/           # 资料中心 (列表/详情/上传)
│   │   │   ├── forum/               # 论坛 (列表/详情/发帖)
│   │   │   ├── mine/                # 个人中心 (资料/帖子/收藏/打卡/消息/反馈)
│   │   │   ├── study/               # 学习计划与打卡
│   │   │   ├── data/                # 数据大屏 / 考研信息录入
│   │   │   ├── tools/               # 复试工具箱
│   │   │   ├── national-line/       # 国家线查询
│   │   │   ├── notifications/       # 通知公告
│   │   │   ├── login/               # 登录
│   │   │   └── admin/               # 管理后台
│   │   ├── utils/                   # 工具函数
│   │   ├── static/                  # 静态资源 (Logo / TabBar 图标)
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── pages.json               # 页面路由与 TabBar 配置
│   │   └── manifest.json            # 应用配置
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # 后端 (Express + MySQL)
│   ├── app.js                       # 入口文件 (路由注册、中间件、错误处理)
│   ├── config/
│   │   └── index.js                 # 数据库 / JWT / 上传配置
│   ├── routes/                      # 路由模块
│   │   ├── user.js                  # 用户认证
│   │   ├── home.js                  # 首页 (时间线/通知/广告/大屏)
│   │   ├── study.js                 # 学习计划与打卡
│   │   ├── material.js              # 资料中心
│   │   ├── forum.js                 # 论坛社区
│   │   ├── message.js               # 私信消息
│   │   ├── record.js                # 考研信息录入
│   │   ├── national-line.js         # 国家线数据
│   │   ├── interview.js             # 复试工具箱
│   │   ├── feedback.js              # 意见反馈
│   │   └── admin.js                 # 后台管理
│   ├── middleware/
│   │   ├── auth.js                  # JWT 认证 (auth / optionalAuth / adminAuth / superAdminAuth)
│   │   └── upload.js                # Multer 文件上传
│   ├── utils/
│   │   ├── db.js                    # MySQL 连接池
│   │   ├── response.js              # 统一响应格式 (success / error / pageSuccess)
│   │   ├── date.js                  # 日期工具
│   │   └── init-db.js               # 数据库初始化
│   ├── uploads/                     # 上传文件目录
│   └── package.json
│
└── database/
    └── schema.sql                   # 完整建表语句 + 初始数据
```

## 功能模块

### 🏠 首页

- **考研倒计时** — 实时计算天/时/分/秒，支持多节点切换 (初试/复试/报名等)
- **考研时间线** — 甘特图风格展示完整节点，支持订阅提醒 (提前3天/1天/当天)
- **每日励志文案** — 后台可配置
- **轮播广告位** — 支持跳转小程序页面或外部链接，统计曝光量/点击量
- **滚动通知栏** — 重要公告实时推送
- **通知公告** — 列表展示、已读未读标记、一键已读
- **快捷入口** — 资料中心、考研数据、学习打卡、复试工具箱等
- **今日学习计划预览**

### 📚 资料中心

- **分类浏览** — 公共课/专业课/本校真题/学长笔记/复试资料
- **资料搜索与排序** — 按下载量/评分/时间排序
- **资料详情** — 评分、评价、点赞
- **文件上传** — 支持 PDF/Word/图片，最大 50MB，需审核后上架
- **文件下载** — 后端叠加学号水印防外传
- **收藏与文件夹** — 自定义文件夹管理
- **评价系统** — 1~5 星打分 + 短评，支持评价点赞/举报/回复

### 💬 论坛社区

- **五大板块** — 备考交流 / 上岸经验 / 资料求助 / 复试调剂 / 匿名树洞
- **发帖** — 富文本、图片上传、匿名发布
- **互动** — 点赞、评论、收藏、举报
- **精华/置顶** — 管理员标记
- **敏感词过滤** — 自动屏蔽违规内容

### ✅ 学习打卡

- **学习计划 CRUD** — 科目、任务名、计划时长、优先级
- **三套模板** — 基础 / 强化 / 冲刺，一键应用
- **打卡** — 完成任务打卡，支持备注
- **打卡日历** — 月视图展示打卡情况
- **连续天数统计** — 当前连续 / 最长连续

### 🧰 复试工具箱

- **英语口语题库** — 系统题库 + 用户上传题目 (需审核)
- **复试简历模板** — 系统模板 + 用户上传 Word 模板 (需审核)
- **导师联系邮件模板** — 3 种场景 (初次联系/成绩出来后/复试感谢)，一键复制
- **用户上传管理** — 查看上传记录及审核状态

### 📊 考研数据

- **数据大屏** — 全校报名人数、上岸率、跨考率、近5年趋势
- **分院统计** — 按学院筛选查看
- **院校层次分布** — 985/211/双一流/普通本科
- **考研信息录入** — 学生提交考研信息，管理员审核
- **国家线查询** — 按年份/区域(A区/B区)/类别(学术型/专业型)查询

### ✉️ 消息系统

- **私信** — 用户间一对一消息
- **会话列表** — 显示最后一条消息和未读数
- **未读计数** — 实时统计

### 📝 意见反馈

- **提交反馈** — 用户提交意见
- **反馈管理** — 管理员查看/处理反馈
- **统计** — 待处理/已处理/总数

### 👤 个人中心

- **个人信息** — 头像、昵称、学院、专业、目标院校等
- **学习数据** — 打卡统计、学习时长
- **我的收藏** — 资料 + 帖子
- **下载记录 / 上传记录 / 我的帖子**
- **我的考研信息** — 录入与查看
- **我的消息** — 私信会话
- **意见反馈** — 提交与查看
- **退出登录**

### ⚙️ 管理后台

- **用户管理** — 列表查看、状态切换、禁言、角色分配
- **内容审核** — 资料/帖子/复试资料/考研信息审核
- **举报受理** — 查看/处理举报
- **数据统计** — 全局概览
- **考研数据维护** — 录入/审核学生考研信息
- **国家线管理** — 增删改查、批量操作
- **广告管理** — 轮播图/大屏图增删改
- **通知管理** — 发布/编辑/删除通知
- **意见反馈管理** — 查看/处理反馈
- **AI 使用监控**

## 数据库设计

共 25+ 张表，完整建表语句见 [database/schema.sql](database/schema.sql)。

### 核心数据表

| 表名 | 说明 |
|------|------|
| users | 用户表 (openid, phone, student_id, nickname, avatar, college, major, role, status) |
| notifications | 通知公告表 |
| notification_reads | 通知已读记录 |
| ads | 广告表 (轮播/固定/通知位) |
| timeline_nodes | 考研时间线节点表 |
| user_timeline_subscriptions | 用户时间线订阅 |
| inspirational_quotes | 励志文案表 |
| study_plans | 学习计划表 |
| study_checkins | 打卡记录表 |
| material_categories | 资料分类表 (支持多级) |
| materials | 资料表 (含审核状态、水印标记) |
| material_reviews | 资料评价表 (支持回复) |
| review_likes | 评价点赞表 |
| material_likes | 资料点赞表 |
| material_favorites | 资料收藏表 |
| material_folders | 文件夹表 |
| download_logs | 下载日志表 |
| forum_posts | 论坛帖子表 (含板块/匿名/精华/置顶) |
| forum_comments | 论坛评论表 |
| forum_likes | 帖子/评论点赞表 |
| forum_favorites | 帖子收藏表 |
| reports | 举报表 |
| kaoyan_data | 考研数据表 (本校特色) |
| national_lines | 国家线数据表 |
| messages | 私信消息表 |
| oral_questions | 系统口语题库表 |
| oral_questions_user | 用户上传口语题表 |
| resume_templates_user | 用户上传简历模板表 |
| email_templates_user | 用户上传邮件模板表 |
| feedbacks | 意见反馈表 |
| screens | 大屏图表 |
| sensitive_words | 敏感词表 |
| system_configs | 系统配置表 |
| ai_records | AI 使用记录表 |

## API 接口

### 统一响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

- `code`: 200 成功, 401 未授权, 403 权限不足, 500 服务器错误
- 分页响应: `{ list: [], total: 10, page: 1, pageSize: 10, totalPages: 1 }`

### 认证方式

请求头携带 `Authorization: Bearer <token>`，登录接口返回 Token，有效期 7 天。

### 用户模块 `/api/user`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /login | 登录 (手机号) | 否 |
| GET | /info | 获取用户信息 | 是 |
| PUT | /profile | 更新个人资料 | 是 |
| GET | /public/:id | 获取他人公开信息 | 否 |

### 首页模块 `/api/home`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /timeline | 获取考研时间线 | 否 |
| GET | /timeline/subscribe | 获取时间线订阅 | 是 |
| POST | /timeline/subscribe | 订阅时间线提醒 | 是 |
| GET | /quote | 获取励志文案 | 否 |
| GET | /ads | 获取广告列表 | 否 |
| POST | /ads/:id/click | 记录广告点击 | 否 |
| GET | /screens | 获取大屏图片 | 否 |
| GET | /notifications | 通知公告列表 | 否 |
| GET | /notifications/:id | 通知详情 | 否 |
| POST | /notifications/read-all | 标记全部已读 | 是 |

### 学习模块 `/api/study`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /plans | 获取学习计划 | 是 |
| POST | /plans | 创建学习计划 | 是 |
| PUT | /plans/:id | 更新计划 | 是 |
| DELETE | /plans/:id | 删除计划 | 是 |
| POST | /checkin | 打卡 | 是 |
| GET | /checkins | 获取打卡记录 (含统计) | 是 |
| GET | /templates | 获取计划模板 | 否 |
| POST | /apply-template | 应用模板 | 是 |

### 资料模块 `/api/material`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /categories | 获取分类列表 | 否 |
| GET | /list | 资料列表 (分页) | 否 |
| GET | /detail/:id | 资料详情 | 否 |
| POST | /upload | 上传资料 | 是 |
| GET | /download/:id | 下载资料 | 是 |
| POST | /:id/review | 评价资料 | 是 |
| POST | /:id/favorite | 收藏/取消收藏 | 是 |
| POST | /:id/like | 点赞/取消 | 是 |
| DELETE | /:id | 删除资料 | 是 |
| GET | /favorites | 收藏列表 | 是 |
| GET | /folders | 文件夹列表 | 是 |
| POST | /folders | 创建文件夹 | 是 |
| GET | /my-uploads | 我的上传记录 | 是 |
| POST | /reviews/:id/like | 评价点赞 | 是 |
| POST | /reviews/:id/report | 评价举报 | 是 |
| DELETE | /reviews/:id | 删除评价 | 是 |

### 论坛模块 `/api/forum`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /posts | 帖子列表 (分页) | 否 |
| GET | /posts/:id | 帖子详情 | 否 |
| POST | /posts | 发布帖子 | 是 |
| DELETE | /posts/:id | 删除帖子 | 是 |
| GET | /my-posts | 我的帖子 | 是 |
| POST | /upload-image | 上传图片 | 是 |
| POST | /posts/:id/like | 点赞/取消 | 是 |
| POST | /posts/:id/favorite | 收藏/取消 | 是 |
| POST | /posts/:id/comments | 发表评论 | 是 |
| POST | /comments/:id/like | 评论点赞 | 是 |
| POST | /comments/:id/report | 评论举报 | 是 |
| DELETE | /comments/:id | 删除评论 | 是 |
| GET | /favorites | 收藏帖子列表 | 是 |
| POST | /report | 举报 | 是 |

### 消息模块 `/api/message`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /conversations | 会话列表 | 是 |
| GET | /history/:userId | 与某用户的消息记录 | 是 |
| POST | /send | 发送消息 | 是 |
| GET | /unread-count | 未读消息数 | 是 |

### 考研信息录入 `/api/record`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /submit | 提交考研信息 | 是 |
| GET | /my | 我的考研信息 | 是 |
| PUT | /update/:id | 修改考研信息 | 是 |
| GET | /list | 管理员-列表 | 是 (admin) |
| PUT | /audit/:id | 管理员-审核 | 是 (admin) |
| POST | /batch-audit | 管理员-批量审核 | 是 (admin) |
| GET | /public/summary | 公开数据汇总 (大屏) | 否 |

### 国家线 `/api/national-line`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /list | 国家线查询 | 否 |
| GET | /years | 年份列表 | 否 |
| GET | /admin/list | 管理员-列表 | 是 (admin) |
| POST | /admin/add | 添加 | 是 (admin) |
| PUT | /admin/update/:id | 更新 | 是 (admin) |
| DELETE | /admin/delete/:id | 删除 | 是 (admin) |
| POST | /admin/batch | 批量保存 | 是 (admin) |
| DELETE | /admin/batch-by-year/:year | 按年批量删除 | 是 (admin) |

### 复试工具箱 `/api/interview`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /oral-questions | 口语题库 (系统+用户) | 否 |
| POST | /oral-questions | 上传口语题 | 是 |
| DELETE | /oral-questions/:id | 删除口语题 | 是 |
| GET | /my-uploads | 我的上传记录 | 是 |
| GET | /resume-templates | 简历模板列表 | 否 |
| POST | /resume-templates | 上传简历模板 | 是 |
| DELETE | /resume-templates/:id | 删除简历模板 | 是 |
| GET | /resume-templates/:id/download | 下载简历模板 | 是 |
| GET | /email-templates | 邮件模板列表 | 否 |
| POST | /email-templates | 上传邮件模板 | 是 |
| DELETE | /email-templates/:id | 删除邮件模板 | 是 |
| GET | /email-templates/:id/download | 下载邮件模板 | 是 |

### 意见反馈 `/api/feedback`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /submit | 提交反馈 | 是 |
| GET | /my | 我的反馈列表 | 是 |
| GET | /list | 管理员-反馈列表 | 是 (admin) |
| PUT | /:id/handle | 管理员-处理反馈 | 是 (admin) |
| DELETE | /:id | 删除反馈 | 是 |
| GET | /stats | 反馈统计 | 是 (admin) |

### 后台管理 `/api/admin` (需管理员权限)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users | 用户列表 |
| PUT | /users/:id/status | 更新用户状态 |
| PUT | /users/:id | 更新用户信息 |
| DELETE | /users/:id | 删除用户 |
| GET | /materials/pending | 待审核资料 |
| PUT | /materials/:id/audit | 审核资料 |
| GET | /forum/pending | 待审核帖子 |
| PUT | /forum/posts/:id/audit | 审核帖子 |
| PUT | /forum/posts/:id/top | 置顶/加精 |
| GET | /reports | 举报列表 |
| PUT | /reports/:id/handle | 处理举报 |
| GET | /stats/overview | 数据概览 |
| GET | /kaoyan-data | 考研数据查询 |
| POST | /kaoyan-data | 添加考研数据 |
| GET | /public/kaoyan-data | 公开考研数据 |
| POST | /notifications | 发布通知 |
| PUT | /notifications/:id | 编辑通知 |
| DELETE | /notifications/:id | 删除通知 |
| GET | /notifications | 通知列表 |
| POST | /ads | 添加广告 |
| GET | /ads | 广告列表 |
| PUT | /ads/:id | 编辑广告 |
| PUT | /ads/:id/status | 广告上下架 |
| DELETE | /ads/:id | 删除广告 |
| GET | /screens | 大屏列表 |
| POST | /screens | 添加大屏 |
| PUT | /screens/:id | 编辑大屏 |
| PUT | /screens/:id/status | 大屏上下架 |
| DELETE | /screens/:id | 删除大屏 |
| GET | /ai-usage | AI 使用统计 |
| GET | /interview-audit/list | 复试资料审核列表 |
| GET | /interview-audit/stats | 复试资料审核统计 |
| PUT | /interview-audit/:type/:id | 审核复试资料 |

## 快速开始

### 环境要求

- Node.js >= 16.x
- MySQL >= 8.0
- npm 或 yarn

### 1. 初始化数据库

```bash
mysql -u root -p < database/schema.sql
```

这将创建 `kaoyan_db` 数据库及全部数据表，并插入时间线节点、励志文案、敏感词等初始数据。

### 2. 启动后端

```bash
cd server
npm install
```

按需修改 `server/config/index.js` 中的数据库密码等配置（也可通过环境变量覆盖）：

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| MYSQL_HOST | localhost | 数据库主机 |
| MYSQL_PORT | 3306 | 数据库端口 |
| MYSQL_USER | root | 数据库用户 |
| MYSQL_PASSWORD | 123456 | 数据库密码 |
| MYSQL_DATABASE | kaoyan_db | 数据库名 |
| JWT_SECRET | kaoyan-secret-key-2024 | JWT 密钥 |
| PORT | 3000 | 服务端口 |

启动服务：

```bash
npm run dev    # 开发模式 (Nodemon 自动重启)
npm start      # 生产模式
```

后端运行在 `http://localhost:3000`

### 3. 启动前端

```bash
cd client
npm install
```

修改 `client/src/api/request.js` 中的 `BASE_URL` 为后端地址。

```bash
npm run dev:h5          # H5 模式
npm run dev:mp-weixin   # 微信小程序模式
```

微信小程序模式编译后，用微信开发者工具打开 `dist/dev/mp-weixin` 目录即可预览。

### 4. 管理员账号

首次登录输入任意手机号自动注册。将第一个用户设为管理员：

```sql
UPDATE users SET role='admin' WHERE id=1;
```

## 安全与合规

- JWT Token 无状态认证，7 天过期自动失效
- 敏感词自动过滤 (发帖/评论/资料)
- 内容审核流程 (资料/帖子/复试资料均需审核后上架)
- 下载文件自动叠加学号水印防外传
- 参数校验与统一错误处理
- 权限控制 — 普通用户 / 管理员 / 超级管理员三级权限
- 文件上传限制 — 类型白名单 + 大小限制 (50MB)

## 架构特点

1. **前后端分离** — RESTful API，JSON 统一格式，前后端独立开发部署
2. **模块化路由** — 后端按业务拆分为 11 个路由模块，职责清晰
3. **连接池** — mysql2/promise 连接池，异步查询
4. **四层认证** — `auth` (必须登录) / `optionalAuth` (可选登录) / `adminAuth` (管理员) / `superAdminAuth` (超级管理员)
5. **统一响应** — `success` / `error` / `pageSuccess` 三种响应封装
6. **跨端适配** — UniApp 一套代码适配微信小程序 / H5 / App
7. **组件化开发** — Vue 3 Composition API，逻辑复用性强
8. **自动建表** — 服务启动时 `init-db.js` 自动检测并创建缺失的表

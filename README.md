# 校内考研助手

> 面向高校考研学子的微信小程序全栈应用，提供考研全流程一站式支持

<p align="center">
  <img src="client/src/static/logo/sxlglogo.svg" alt="logo" width="120">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.4-brightgreen" alt="Vue 3">
  <img src="https://img.shields.io/badge/UniApp-3.0-blue" alt="UniApp">
  <img src="https://img.shields.io/badge/Express-4.18-green" alt="Express">
  <img src="https://img.shields.io/badge/MySQL-8.0-orange" alt="MySQL">
  <img src="https://img.shields.io/badge/Vite-5.2-purple" alt="Vite">
  <img src="https://img.shields.io/badge/JWT-9.0-lightgrey" alt="JWT">
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

---

## 目录

- [项目介绍](#项目介绍)
- [技术架构](#技术架构)
- [功能模块](#功能模块)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [API 接口](#api-接口)
- [安全与架构](#安全与架构)
- [部署指南](#部署指南)
- [常见问题](#常见问题)

---

## 项目介绍

**校内考研助手**是一个专为高校考研学子打造的微信小程序全栈应用，覆盖考研备考全流程。系统提供考研时间线追踪、学习打卡、资料共享、论坛社区、复试工具箱、国家线查询、成绩估算、数据大屏等功能，并配套完善的管理后台，全方位助力考研学子从备考到上岸。

### 适用场景

- 高校校内考研信息共享与交流
- 考研时间节点管理与提醒
- 学习进度追踪与打卡激励
- 考研资料的上传、分享与下载管理
- 复试准备（口语题库、简历模板、邮件模板）
- 考研数据统计与可视化展示

---

## 技术架构

| 层级 | 技术选型 | 说明 |
| --- | --- | --- |
| **前端框架** | Vue 3 + UniApp | Composition API，一套代码适配微信小程序 / H5 / App |
| **构建工具** | Vite 5 | 极速冷启动，HMR 热更新 |
| **后端框架** | Express.js | RESTful API，14 个模块化路由 |
| **数据库** | MySQL 8.0 | utf8mb4 字符集，mysql2/promise 连接池 |
| **认证方案** | JWT | Bearer Token，7 天有效期，四级权限控制 |
| **文件处理** | Multer | 支持 PDF / Word / 图片上传，最大 50MB |
| **安全防护** | 自定义中间件 | 限流、安全头、XSS 过滤、敏感词过滤 |
| **缓存策略** | 内存缓存 | 支持三级 TTL（5分钟/30分钟/2小时） |
| **开发工具** | Nodemon | 后端代码变更自动重启 |

### 浏览器 / 平台兼容性

| 平台 | 支持情况 |
| --- | --- |
| 微信小程序 | ✅ 完全支持 |
| H5（移动端浏览器） | ✅ 完全支持 |
| App（iOS / Android） | ✅ 支持（通过 UniApp 打包） |
| 支付宝/百度/头条/QQ/快手小程序 | ✅ 可扩展支持 |

---

## 功能模块

### 🏠 首页

- **考研倒计时**：实时天/时/分/秒倒计时，支持多节点切换查看
- **考研时间线**：甘特图展示从预报名到待录取全流程节点，支持订阅提醒（提前3天/1天/当天）
- **每日励志文案**：轮播展示名人名言与励志语录
- **轮播广告**：支持跳转小程序页面或外部链接，后台统计曝光量与点击量
- **滚动通知栏**：支持普通公告、紧急通知，带强提醒功能
- **快捷入口**：直达资料中心、考研数据、学习打卡、复试工具箱、国家线、成绩估算等

### 📚 资料中心

- **分类浏览**：公共课、专业课、本校真题、学长笔记、复试资料等多级分类
- **多维度筛选**：按学院、专业、科目代码、年份筛选
- **搜索与排序**：关键词搜索，按下载量/评分/时间排序
- **资料详情**：查看描述、评分、评价、下载量、点赞数
- **文件上传**：支持 PDF / Word / 图片，最大 50MB
- **文件下载**：下载自动叠加学号水印，记录下载日志
- **评价系统**：五星评分 + 文字评价，支持多级回复和点赞
- **收藏管理**：自定义文件夹分类收藏
- **审核机制**：资料上传需审核后上架

### 💬 论坛社区

- **五大板块**：备考交流、上岸经验、资料求助、复试调剂、匿名树洞
- **富文本发帖**：支持图片上传和标签
- **匿名发布**：树洞板块支持匿名模式
- **互动功能**：点赞、评论、收藏、举报
- **帖子管理**：精华帖、置顶帖
- **内容审核**：发帖审核机制，敏感词自动过滤

### ✅ 学习打卡

- **学习计划**：CRUD 管理每日学习任务
- **四套模板**：基础、强化、冲刺、自定义模板快速生成计划
- **任务打卡**：按计划完成打卡，记录实际时长和备注
- **打卡日历**：可视化日历展示打卡记录
- **统计看板**：连续打卡天数、累计打卡次数、总学习时长
- **心情记录**：打卡时选择心情（开心/平静/焦虑/疲惫/难过）

### 🧰 复试工具箱

- **英语口语题库**：系统内置 + 用户上传，分类浏览，审核机制
- **复试简历模板**：用户上传简历模板，支持下载
- **导师联系邮件模板**：用户上传邮件模板，支持下载
- **AI 润色**：文本润色与英语口语练习辅助

### 📊 成绩估算器

- **国家线对比**：选择年份/A区B区/学硕专硕/学科门类，输入各科成绩
- **逐科分析**：各科成绩与单科线逐一对比，标注过线状态
- **综合评价**：稳过/较稳妥/擦线过/单科未过/差一点/较危险六档评估
- **备考建议**：根据评估结果给出个性化备考建议
- **同届对比**：与已上岸同届学长学姐成绩对比，查看百分位排名

### 📈 国家线查询

- **多维查询**：按年份、区域（A区/B区）、类型（学术型/专业型）筛选
- **完整数据**：总分线 + 政治线 + 外语线 + 业务课线，一目了然
- **多年度对比**：支持 2022-2025 年国家线数据
- **后台管理**：支持增删改和批量操作

### 🏫 学校官网导航

- **院校目录**：按地区、类型（985/211/双一流/普通）筛选
- **一键跳转**：点击直接浏览目标院校官网
- **点击统计**：记录热门院校点击量
- **后台管理**：支持增删改查学校信息

### 🏅 头衔认证

- **上岸认证**：已上岸用户上传截图申请"已上岸"头衔
- **管理员审核**：通过/驳回申请
- **头衔展示**：认证后在个人主页显示专属标识

### 💬 私信聊天

- **一对一实时对话**：类似聊天界面的会话体验
- **会话列表**：显示最后一条消息和未读数
- **防骚扰机制**：对方未回复时只能发送一条消息
- **用户屏蔽**：屏蔽后对方无法发送消息
- **禁言检测**：被禁言用户无法发送消息
- **举报消息**：支持举报不当私信

### 📢 通知公告

- **多类型通知**：普通公告 / 紧急通知
- **置顶与强提醒**：重要通知置顶显示，支持强提醒
- **已读追踪**：已读/未读状态，一键全部已读
- **浏览统计**：记录通知浏览次数

### 📨 意见反馈

- **用户端**：提交意见反馈，查看反馈历史和处理状态
- **管理端**：查看反馈列表、按状态筛选、填写处理结果
- **统计看板**：待处理/已处理/总数统计

### 🚨 举报系统

- **多类型举报**：支持举报帖子、评论、资料、广告、评价、消息
- **举报管理**：待处理/已处理/已驳回状态流转
- **处理记录**：管理员处理时填写处理结果

### 👤 个人中心

- **个人资料**：头像、昵称、学院、专业、学号、目标院校、目标专业、考研年份
- **数据统计**：打卡天数、学习时长、连续打卡、收藏数、下载数
- **功能入口**：我的收藏、下载记录、上传记录、我的帖子、我的考研信息
- **消息中心**：私信会话列表，未读消息提醒
- **其他功能**：学习打卡、考研信息录入、意见反馈、头衔认证、订阅消息

### 👨‍💼 管理后台

- **数据概览**：用户总数、资料总数、帖子总数、今日活跃等全局统计
- **用户管理**：用户列表、状态管理、角色分配、禁言/解禁
- **内容审核**：资料审核、帖子审核、复试资料审核（口语/简历/邮件）
- **举报处理**：查看和处理用户举报
- **考研数据管理**：审核学生考研信息、数据导出（Excel）
- **国家线管理**：增删改查、批量操作
- **通知公告管理**：发布/编辑/删除通知
- **广告管理**：增删改、定时上下架、数据统计
- **数据大屏管理**：上传和管理可视化大屏图片
- **学校官网管理**：院校信息增删改查
- **意见反馈处理**：查看和处理用户反馈
- **头衔认证审核**：审核上岸认证申请
- **AI 使用监控**：查看 AI 功能使用记录
- **系统配置**：站点名称、AI 次数限制等运营配置

---

## 快速开始

### 环境要求

| 环境 | 版本要求 |
| --- | --- |
| Node.js | >= 16.x |
| MySQL | >= 8.0 |
| npm | >= 8.x |

### 1. 克隆项目

```bash
git clone <repository-url>
cd my-vue3-project
```

### 2. 初始化数据库

```bash
# 方式一：手动导入 SQL 文件
mysql -u root -p < database/schema.sql

# 方式二：启动后端时自动建表（推荐）
# 后端首次启动会自动创建所有表和初始数据
```

### 3. 配置环境变量

```bash
cd server
cp .env.example .env
# 编辑 .env 文件，修改数据库连接信息
```

`.env` 配置项说明：

```env
PORT=3000                          # 服务端口
MYSQL_HOST=localhost               # 数据库地址
MYSQL_PORT=3306                    # 数据库端口
MYSQL_USER=root                    # 数据库用户
MYSQL_PASSWORD=123456              # 数据库密码
MYSQL_DATABASE=kaoyan_db           # 数据库名称
JWT_SECRET=kaoyan-secret-key-2024  # JWT 密钥
WECHAT_APPID=your_appid_here       # 微信小程序 AppID
WECHAT_APPSECRET=your_appsecret_here # 微信小程序 AppSecret
WECHAT_NOTIFICATION_TEMPLATE=      # 微信订阅消息模板ID（通知）
WECHAT_MESSAGE_TEMPLATE=           # 微信订阅消息模板ID（私信）
```

### 4. 启动后端

```bash
cd server
npm install
npm run dev    # 开发模式（Nodemon 热重载）
# npm start    # 生产模式
```

后端运行在 `http://localhost:3000`

### 5. 启动前端

```bash
cd client
npm install
# 修改 src/api/request.js 中的 BASE_URL（默认为 http://127.0.0.1:3000/api）
npm run dev:h5          # H5 模式（浏览器调试）
npm run dev:mp-weixin   # 微信小程序模式
```

### 6. 设置管理员

首次登录后，执行以下 SQL 将第一个用户设为管理员：

```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

如需超级管理员权限：

```sql
UPDATE users SET role = 'super_admin' WHERE id = 1;
```

---

## 项目结构

```
my-vue3-project/
├── client/                           # 前端项目（Vue3 + UniApp）
│   ├── src/
│   │   ├── api/                      # API 请求封装
│   │   │   ├── request.js            # 请求拦截器、Token注入、弱网检测、加载状态
│   │   │   └── index.js              # 接口方法集合
│   │   ├── components/               # 公共组件
│   │   │   └── PageLoading/          # 页面加载动画组件
│   │   ├── pages/                    # 页面模块
│   │   │   ├── index/                # 首页（倒计时、时间线、广告、通知）
│   │   │   ├── materials/            # 资料中心（列表、详情、上传）
│   │   │   ├── forum/                # 论坛社区（板块、详情、发帖）
│   │   │   ├── study/                # 学习计划与打卡
│   │   │   ├── data/                 # 考研数据（大屏、录入）
│   │   │   ├── tools/                # 工具箱（复试、成绩估算、学校官网）
│   │   │   ├── national-line/        # 国家线查询
│   │   │   ├── notifications/        # 通知公告（列表、详情）
│   │   │   ├── mine/                 # 个人中心（资料/收藏/下载/上传/帖子/私信/反馈）
│   │   │   ├── admin/                # 管理后台（用户/审核/举报/数据/通知/广告）
│   │   │   ├── login/                # 登录页
│   │   │   ├── splash/               # 启动页
│   │   │   └── webview/              # WebView 容器页面
│   │   ├── static/                   # 静态资源（Logo、图标、TabBar 图标）
│   │   ├── utils/                    # 工具函数
│   │   │   ├── auth.js               # 登录状态管理
│   │   │   ├── authorize.js          # 微信授权
│   │   │   ├── date.js               # 日期格式化
│   │   │   ├── lazy-load.js          # 图片懒加载
│   │   │   ├── loading.js            # 全局加载控制
│   │   │   └── url.js                # URL 参数解析
│   │   ├── App.vue                   # 根组件
│   │   ├── main.js                   # 入口文件
│   │   ├── manifest.json             # UniApp 应用配置
│   │   ├── pages.json                # 页面路由与 TabBar 配置
│   │   └── uni.scss                  # 全局样式变量
│   ├── static/                       # 公共静态资源
│   ├── index.html                    # HTML 入口
│   ├── vite.config.js                # Vite 构建配置
│   └── package.json
│
├── server/                           # 后端项目（Express + MySQL）
│   ├── app.js                        # 入口文件（中间件注册、路由挂载、启动任务）
│   ├── config/
│   │   └── index.js                  # 配置中心（数据库、JWT、上传、微信）
│   ├── middleware/
│   │   ├── auth.js                   # 四级认证中间件（auth/optionalAuth/adminAuth/superAdminAuth）
│   │   ├── cache.js                  # 缓存中间件（支持模式匹配失效）
│   │   ├── security.js               # 安全中间件（限流、安全头、XSS过滤）
│   │   └── upload.js                 # 文件上传中间件（Multer 配置）
│   ├── routes/
│   │   ├── user.js                   # 用户路由（登录、注册、资料管理）
│   │   ├── home.js                   # 首页路由（倒计时、时间线、广告）
│   │   ├── material.js               # 资料路由（分类、搜索、上传/下载、评价）
│   │   ├── forum.js                  # 论坛路由（帖子、评论、点赞、收藏）
│   │   ├── study.js                  # 学习路由（计划、打卡、统计）
│   │   ├── admin.js                  # 管理路由（用户、审核、配置、统计）
│   │   ├── message.js                # 私信路由（会话、消息、屏蔽）
│   │   ├── record.js                 # 考研数据路由（录入、审核、统计）
│   │   ├── national-line.js          # 国家线路由（查询、管理）
│   │   ├── interview.js              # 复试路由（口语、简历、邮件模板）
│   │   ├── feedback.js               # 反馈路由（提交、处理）
│   │   ├── score-estimator.js        # 成绩估算路由
│   │   ├── title-certification.js    # 头衔认证路由
│   │   └── school-websites.js        # 学校官网路由
│   ├── utils/
│   │   ├── db.js                     # 数据库连接池（mysql2/promise）
│   │   ├── init-db.js                # 自动建表与数据初始化
│   │   ├── response.js               # 统一响应格式（success/error/pageSuccess）
│   │   ├── sensitive-words.js        # 敏感词过滤（内存缓存+数据库持久化）
│   │   ├── date.js                   # 日期工具
│   │   ├── image-optimizer.js        # 图片优化
│   │   ├── accountCleanup.js         # 注销账号定时清理任务
│   │   ├── timelineReminder.js       # 时间线提醒定时任务
│   │   └── wechat.js                 # 微信 API 工具
│   ├── scripts/
│   │   └── backup.js                 # 数据库备份脚本
│   ├── uploads/                      # 文件上传目录
│   ├── .env.example                  # 环境变量模板
│   └── package.json
│
├── database/
│   ├── schema.sql                    # 完整数据库建表语句（含初始数据）
│   └── migrate_*.sql                 # 数据库迁移脚本
│
├── .gitignore
├── 环境配置说明.md                    # 环境配置详细说明
└── README.md
```

---

## API 接口

### 统一响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

**分页响应格式：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### 状态码说明

| 状态码 | 含义 |
| --- | --- |
| 200 | 请求成功 |
| 401 | 未登录或 Token 已过期 |
| 403 | 权限不足 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 接口模块一览

| 模块 | 路径前缀 | 主要功能 |
| --- | --- | --- |
| 用户 | `/api/user` | 微信登录、手机号登录、个人信息管理、用户资料页 |
| 首页 | `/api/home` | 考研倒计时、时间线、励志文案、广告、通知 |
| 资料 | `/api/material` | 资料分类、搜索、上传、下载、评价、收藏 |
| 论坛 | `/api/forum` | 帖子 CRUD、评论、点赞、收藏、板块管理 |
| 学习 | `/api/study` | 学习计划、打卡、统计、模板 |
| 消息 | `/api/message` | 私信会话、消息收发、用户屏蔽 |
| 复试 | `/api/interview` | 口语题库、简历模板、邮件模板 |
| 考研数据 | `/api/record` | 考研信息录入、审核、统计 |
| 国家线 | `/api/national-line` | 国家线查询、后台管理 |
| 成绩估算 | `/api/score-estimator` | 成绩与国家线对比分析 |
| 头衔认证 | `/api/title-certification` | 上岸认证申请与审核 |
| 学校官网 | `/api/school-websites` | 院校目录、点击统计、后台管理 |
| 意见反馈 | `/api/feedback` | 反馈提交、处理 |
| 管理后台 | `/api/admin` | 用户管理、内容审核、配置管理、统计总览 |
| 系统 | `/` | `/api/test` 测试接口、`/api/health` 健康检查、`/api/cache/stats` 缓存统计 |

---

## 安全与架构

### 安全措施

| 措施 | 实现方式 |
| --- | --- |
| **身份认证** | JWT Bearer Token，7 天过期，无状态认证 |
| **权限控制** | 四级中间件：`auth` → `optionalAuth` → `adminAuth` → `superAdminAuth` |
| **请求限流** | IP 级别限流，默认每分钟 200 次，可配置 |
| **XSS 防护** | 输入净化中间件，过滤 `<>`、`javascript:`、`on*=` 等危险字符 |
| **安全响应头** | `X-Content-Type-Options`、`X-Frame-Options`、`X-XSS-Protection`、`Referrer-Policy` |
| **敏感词过滤** | 内存缓存 + 数据库持久化双模式，自动替换为 `*` |
| **内容审核** | 资料、帖子、复试资料均需审核后公开 |
| **水印保护** | 下载资料自动叠加学号水印，防止恶意传播 |
| **防骚扰** | 私信防骚扰机制（未回复限发一条）+ 用户屏蔽功能 |
| **账号安全** | 注销账号冷静期机制，定时清理过期账号 |

### 架构特点

1. **前后端分离** - RESTful API 设计，前端与后端独立开发、独立部署
2. **模块化路由** - 14 个路由模块，职责清晰，易于维护和扩展
3. **数据库连接池** - mysql2/promise 异步查询，支持事务和连接复用
4. **自动建表** - 首次启动自动创建所有表、插入初始数据，零手动配置
5. **字段迁移** - 自动检测缺失字段并 ALTER TABLE 补充，平滑升级
6. **智能缓存** - 三级 TTL 缓存策略，支持通配符模式匹配失效
7. **跨端适配** - UniApp 框架，一套代码编译到微信小程序、H5 等多端
8. **定时任务** - 账号注销自动清理 + 考研时间线提醒消息推送
9. **统一响应** - `success()` / `error()` / `pageSuccess()` 标准化 API 输出
10. **弱网优化** - 前端自动检测网络状态，弱网环境显示加载动画

### 权限模型

```
游客（未登录）
  └── 可浏览首页、国家线、学校官网等公开内容

普通用户（student）
  └── 登录后可访问所有用户功能

管理员（admin）
  └── 用户管理、内容审核、数据管理、配置管理

超级管理员（super_admin）
  └── 拥有管理员全部权限 + 角色分配等敏感操作
```

---

## 部署指南

详细部署说明请参考 [环境配置说明.md](./环境配置说明.md)

### 生产环境快速部署

```bash
# 1. 安装 PM2 进程管理
npm install -g pm2

# 2. 启动后端服务
cd server
pm2 start app.js --name kaoyan-server
pm2 save
pm2 startup

# 3. 构建前端
cd client
npm run build:h5        # H5 版本
npm run build:mp-weixin # 微信小程序版本

# 4. 配置 Nginx 反向代理（可选）
# 将 H5 静态文件部署到 Nginx，API 请求代理到 Node.js 3000 端口
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    root /path/to/client/dist/build/h5;
    index index.html;
    
    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 上传文件代理
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

---

## 常见问题

### MySQL 连接失败

```bash
# 检查 MySQL 服务是否启动
# Windows
net start MySQL80

# 确认 .env 中数据库配置正确
# 确认数据库 kaoyan_db 已创建
```

### 端口被占用

```bash
# Windows 查找占用端口的进程
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F
```

### npm install 失败

```bash
npm cache clean --force
npm config set registry https://registry.npmmirror.com
npm install
```

### 微信小程序登录调试

开发模式下可使用手机号直接登录，跳过微信授权流程。在登录页面输入手机号即可完成登录。

### 文件上传大小限制

默认限制 50MB，可在 `server/config/index.js` 中修改 `upload.maxFileSize`，同时在 `app.js` 中调整 `express.json` 和 `express.urlencoded` 的 `limit` 参数。

### 数据库备份

```bash
cd server
npm run backup          # 备份数据库
npm run backup:list     # 查看备份文件列表
```

---

## License

MIT

---

## 联系方式

如有问题或建议，欢迎提交 Issue。

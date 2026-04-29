
# 校内考研助手

&gt; 面向高校考研学子的微信小程序全栈应用，提供考研全流程支持

&lt;p align="center"&gt;
  &lt;img src="client/src/static/logo/sxlglogo.svg" alt="logo" width="120"&gt;
&lt;/p&gt;

&lt;p align="center"&gt;
  &lt;img src="https://img.shields.io/badge/Vue-3.4-brightgreen" alt="Vue 3"&gt;
  &lt;img src="https://img.shields.io/badge/UniApp-3.0-blue" alt="UniApp"&gt;
  &lt;img src="https://img.shields.io/badge/Express-4.18-green" alt="Express"&gt;
  &lt;img src="https://img.shields.io/badge/MySQL-8.0-orange" alt="MySQL"&gt;
  &lt;img src="https://img.shields.io/badge/Vite-5.2-purple" alt="Vite"&gt;
&lt;/p&gt;

---

## 📋 目录

- [项目介绍](#-项目介绍)
- [技术栈](#-技术栈)
- [功能特性](#-功能特性)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [API文档](#-api文档)
- [安全与架构](#-安全与架构)
- [部署指南](#-部署指南)
- [常见问题](#-常见问题)

---

## 🎯 项目介绍

校内考研助手是一个专为高校考研学子打造的微信小程序全栈应用，涵盖考研时间线追踪、学习打卡、资料共享、论坛社区、复试工具箱、数据大屏等功能，全方位助力考研备考全流程。

## 🛠 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | Vue 3 + UniApp | Composition API，跨端适配微信小程序 / H5 / App |
| **后端** | Express.js | RESTful API，模块化路由 |
| **数据库** | MySQL 8.0 | utf8mb4 字符集，连接池 (mysql2/promise) |
| **认证** | JWT | Bearer Token，7 天有效期 |
| **文件上传** | Multer | 支持 PDF / Word / 图片，最大 50MB |
| **开发工具** | Vite 5 + Nodemon | 前端热更新，后端自动重启 |

---

## ✨ 功能特性

### 🏠 首页
- 考研倒计时（天/时/分/秒），支持多节点切换
- 考研时间线甘特图，订阅提醒（提前3天/1天/当天）
- 每日励志文案、轮播广告、滚动通知栏
- 快捷入口直达资料中心、考研数据、学习打卡等

### 📚 资料中心
- 分类浏览（公共课/专业课/本校真题/学长笔记/复试资料）
- 搜索、排序、评分、评价、点赞
- 文件上传/下载，支持50MB，自动叠加学号水印
- 收藏夹管理、评价系统

### 💬 论坛社区
- 五大板块（备考交流/上岸经验/资料求助/复试调剂/匿名树洞）
- 富文本发帖、图片上传、匿名发布
- 点赞/评论/收藏/举报、精华/置顶

### ✅ 学习打卡
- 学习计划CRUD，三套模板（基础/强化/冲刺）
- 任务打卡、打卡日历、连续天数统计

### 🧰 复试工具箱
- 英语口语题库
- 复试简历模板
- 导师联系邮件模板

### 📊 考研数据
- 数据大屏（报名人数/上岸率/跨考率/趋势）
- 考研信息录入与审核
- 国家线查询

### 👤 个人中心 & 管理后台
- 个人信息、学习数据、我的收藏等
- 用户管理、内容审核、数据统计、系统配置

---

## 🚀 快速开始

### 环境要求

- Node.js &gt;= 16.x
- MySQL &gt;= 8.0
- npm 或 yarn

### 1. 克隆项目

```bash
git clone &lt;repository-url&gt;
cd my-vue3-project
```

### 2. 初始化数据库

```bash
mysql -u root -p &lt; database/schema.sql
```

### 3. 启动后端

```bash
cd server
npm install
# 修改 server/config/index.js 中的数据库配置
npm run dev  # 开发模式 (Nodemon)
# 或 npm start  # 生产模式
```

后端运行在 `http://localhost:3000`

### 4. 启动前端

```bash
cd client
npm install
# 修改 client/src/api/request.js 中的 BASE_URL
npm run dev:h5          # H5 模式
npm run dev:mp-weixin   # 微信小程序模式
```

### 5. 管理员账号

首次登录自动注册，执行以下SQL设置第一个用户为管理员：

```sql
UPDATE users SET role='admin' WHERE id=1;
```

---

## 📁 项目结构

```
my-vue3-project/
├── client/                    # 前端 (Vue3 + UniApp)
│   ├── src/
│   │   ├── api/              # API 封装
│   │   ├── pages/            # 页面组件
│   │   ├── utils/            # 工具函数
│   │   ├── static/           # 静态资源
│   │   └── ...
│   ├── vite.config.js
│   └── package.json
│
├── server/                    # 后端 (Express + MySQL)
│   ├── app.js                # 入口文件
│   ├── config/               # 配置
│   ├── routes/               # 路由模块
│   ├── middleware/           # 中间件
│   ├── utils/                # 工具函数
│   ├── uploads/              # 上传目录
│   └── package.json
│
└── database/
    └── schema.sql            # 数据库建表语句
```

---

## 📡 API文档

### 统一响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

- `code`: 200 成功, 401 未授权, 403 权限不足, 500 服务器错误

### 核心接口模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 用户 | `/api/user` | 登录、个人信息 |
| 首页 | `/api/home` | 时间线、通知、广告 |
| 学习 | `/api/study` | 学习计划、打卡 |
| 资料 | `/api/material` | 资料中心 |
| 论坛 | `/api/forum` | 论坛社区 |
| 消息 | `/api/message` | 私信 |
| 复试 | `/api/interview` | 复试工具箱 |
| 管理 | `/api/admin` | 后台管理 |

---

## 🔐 安全与架构

### 安全措施

- JWT Token 无状态认证，7天过期
- 敏感词自动过滤
- 内容审核流程
- 下载文件自动叠加学号水印
- 三级权限控制（用户/管理员/超级管理员）

### 架构特点

1. **前后端分离** - RESTful API，独立开发部署
2. **模块化路由** - 11个路由模块，职责清晰
3. **连接池** - mysql2/promise，异步查询
4. **四层认证** - auth/optionalAuth/adminAuth/superAdminAuth
5. **统一响应** - success/error/pageSuccess
6. **跨端适配** - UniApp 一套代码适配多端
7. **自动建表** - init-db.js 自动检测并创建表

---

## 📦 部署指南

详细部署指南请参考 [环境配置说明.md](环境配置说明.md)

### 生产环境部署

1. 使用 PM2 管理 Node.js 进程
2. 配置 Nginx 反向代理
3. 配置 HTTPS（Let's Encrypt）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd server
pm2 start app.js --name kaoyan-server
pm2 save
pm2 startup
```

---

## ❓ 常见问题

### MySQL 连接失败

检查 MySQL 服务是否启动，端口、用户名、密码是否正确

```bash
# Windows
net start MySQL80
```

### 端口被占用

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID &lt;进程ID&gt; /F
```

### npm install 失败

```bash
npm cache clean --force
npm config set registry https://registry.npmmirror.com
npm install
```

---

## 📄 License

MIT

---

## 👥 Contributors

欢迎提交 Issue 和 Pull Request！

---

## 📞 联系方式

如有问题，请通过 Issue 联系我们。


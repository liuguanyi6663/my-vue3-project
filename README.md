# 校内考研助手

\> 面向高校考研学子的微信小程序全栈应用，提供考研全流程支持

\<p align="center">
\<img src="client/src/static/logo/sxlglogo.svg" alt="logo" width="120">
\</p>

\<p align="center">
\<img src="<https://img.shields.io/badge/Vue-3.4-brightgreen>" alt="Vue 3">
\<img src="<https://img.shields.io/badge/UniApp-3.0-blue>" alt="UniApp">
\<img src="<https://img.shields.io/badge/Express-4.18-green>" alt="Express">
\<img src="<https://img.shields.io/badge/MySQL-8.0-orange>" alt="MySQL">
\<img src="<https://img.shields.io/badge/Vite-5.2-purple>" alt="Vite">
\</p>

***

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

***

## 🎯 项目介绍

校内考研助手是一个专为高校考研学子打造的微信小程序全栈应用，涵盖考研时间线追踪、学习打卡、资料共享、论坛社区、复试工具箱、数据大屏等功能，全方位助力考研备考全流程。

## 🛠 技术栈

| 层级       | 技术               | 说明                                   |
| -------- | ---------------- | ------------------------------------ |
| **前端**   | Vue 3 + UniApp   | Composition API，跨端适配微信小程序 / H5 / App |
| **后端**   | Express.js       | RESTful API，模块化路由                    |
| **数据库**  | MySQL 8.0        | utf8mb4 字符集，连接池 (mysql2/promise)     |
| **认证**   | JWT              | Bearer Token，7 天有效期                  |
| **文件上传** | Multer           | 支持 PDF / Word / 图片，最大 50MB           |
| **开发工具** | Vite 5 + Nodemon | 前端热更新，后端自动重启                         |

***

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

### 💬 对话/私信

- 一对一私信聊天
- 会话列表，显示最后消息和未读数
- 消息历史记录
- 屏蔽/取消屏蔽用户
- 举报消息
- 防骚扰机制（对方未回复时只能发一条消息）
- 禁言检测

### 📝 意见反馈

- 用户提交意见反馈
- 查看我的反馈历史和处理状态
- 管理员查看反馈列表，按状态筛选
- 管理员处理反馈，填写处理结果
- 反馈统计（待处理/已处理/总数）

### 🚨 举报系统

- 支持举报帖子、评论、资料、广告、评价、消息等
- 管理员查看和处理举报
- 举报状态管理（待处理/已处理/已驳回）

### 📢 通知公告

- 多类型通知（普通公告/紧急通知）
- 置顶和强提醒功能
- 已读/未读状态，一键全部已读
- 浏览次数统计
- 后台发布和管理通知

### 📊 数据大屏 & 广告

- 考研数据可视化大屏
- 轮播广告管理（支持跳转小程序或外部链接）
- 广告曝光量和点击量统计
- 定时上下架广告

### 📋 考研信息录入 & 管理

- 学生填写考研信息（姓名、专业、学号、科目、成绩、目标院校等）
- 跨考标记、院校层次选择（985/211/双一流）
- 信息审核流程（待审核/已通过/已驳回）
- 考研数据统计和导出
- 按学院/年份筛选查看

### 📈 国家线查询 & 管理

- 按年份、区域（A区/B区）、类型（学术型/专业型）查询国家线
- 详细的单科线和总分线
- 后台国家线数据增删改
- 批量操作功能

### 👤 个人中心

- 个人资料编辑（头像、昵称、学院、专业、目标院校等）
- 我的学习数据统计（打卡天数、学习时长、连续打卡）
- 我的收藏（资料收藏、帖子收藏）
- 我的下载记录
- 我的上传记录（资料、口语题目、简历模板等）
- 我的帖子
- 我的考研信息
- 消息中心（私信会话）
- 意见反馈入口
- 用户资料页查看

### 👨‍💼 管理后台

- 用户管理（用户列表、状态管理、禁言/解禁、角色分配）
- 内容审核（资料审核、帖子审核、复试资料审核）
- 举报处理（查看举报、处理举报）
- 考研数据管理（录入、审核、导出考研数据）
- 国家线管理（增删改、批量操作）
- 通知公告管理（发布、编辑、删除通知）
- 广告管理（增删改、上下架、数据统计）
- 数据大屏管理
- 意见反馈处理
- AI 使用监控
- 系统配置
- 全局数据统计概览

***

## 💡 其他特色功能

- 敏感词自动过滤（发帖、评论、资料）
- 资料下载自动叠加学号水印
- 用户屏蔽机制
- 跨平台适配（微信小程序、H5）

***

## 🚀 快速开始

### 环境要求

- Node.js >= 16.x
- MySQL >= 8.0
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

***

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

***

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

| 模块 | 路径               | 说明        |
| -- | ---------------- | --------- |
| 用户 | `/api/user`      | 登录、个人信息   |
| 首页 | `/api/home`      | 时间线、通知、广告 |
| 学习 | `/api/study`     | 学习计划、打卡   |
| 资料 | `/api/material`  | 资料中心      |
| 论坛 | `/api/forum`     | 论坛社区      |
| 消息 | `/api/message`   | 私信        |
| 复试 | `/api/interview` | 复试工具箱     |
| 管理 | `/api/admin`     | 后台管理      |

***

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

***

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

***

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

***

## 📄 License

MIT

***

## 👥 Contributors

欢迎提交 Issue 和 Pull Request！

***

## 📞 联系方式

如有问题，请通过 Issue 联系我们。

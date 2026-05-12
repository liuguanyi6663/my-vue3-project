# 考研助手（kaoyan-monorepo）

## 项目概述
校内考研助手小程序 — 提供考研资料共享、学习打卡、论坛社区、AI 助手、国家线查询、成绩估算等功能。

## 技术栈
- **前端**: Vue 3 + uni-app（微信小程序），SSR 渲染模式
- **后端**: Node.js + Express 4
- **数据库**: MySQL 8+（mysql2/promise 连接池）
- **缓存**: Redis（可选，降级为内存缓存）
- **认证**: JWT（access token + refresh token 轮转）
- **其他**: bcrypt（密码）、multer（文件上传）、exceljs（导出）

## 项目结构
```
kaoyan-monorepo/
├── client/                   # uni-app 前端
│   └── src/
│       ├── api/              # API 请求封装
│       │   ├── index.js      # 所有 API 定义
│       │   └── request.js    # 请求拦截器 + token 刷新
│       ├── utils/            # 工具函数
│       │   ├── auth.js       # 认证（token/user 存取）
│       │   ├── url.js        # 图片 URL 拼接
│       │   ├── date.js       # 日期/考研时间计算
│       │   ├── loading.js    # 全局加载状态
│       │   ├── authorize.js  # 微信权限
│       │   └── lazy-load.js  # 懒加载/防抖节流
│       ├── pages/            # 页面
│       └── components/       # 组件
├── server/                   # Express 后端
│   ├── app.js                # 入口
│   ├── routes/               # 路由（按模块拆分）
│   ├── middleware/           # 中间件（auth, upload, cache, security）
│   ├── utils/                # 工具（db, logger, redis, wechat, sensitive-words...）
│   ├── config/               # 配置（index.js, swagger.js）
│   └── scripts/              # 脚本
├── database/
│   └── schema.sql            # 完整数据库 DDL + 种子数据
```

## 编码规范

### 通用的约定
- 使用 `camelCase` 命名变量和函数
- SQL 关键字大写，表名/字段名小写蛇形
- 所有 API 响应统一格式：`{ code, msg, data }`
- 已有模块不做多余的抽象（3个相似函数 > 1个抽象）

### 后端
- **数据库查询**: 始终使用参数化查询（`?` 占位符），禁止 SQL 拼接（ORDER BY/LIMIT 除外，必须使用白名单映射）
- **路由模式**: `router.verb(path, auth, handler)`，handler 用 `async`，不额外包裹 `asyncHandler`
- **错误处理**: `try/catch` 内手动 `res.json(error(msg))`，不抛异常（`globalErrorHandler` 兜底）
- **认证中间件**: `auth`（必须登录）、`optionalAuth`（可选）、`adminAuth`（管理员）、`superAdminAuth`（超级管理员）
- **审核流**: 内容创建默认 `audit_status='pending'`、`status=0`，管理端审核通过后改为 `'approved'`/`1`
- **不要增加模块依赖**: 现有依赖（express, mysql2, jsonwebtoken, bcrypt, multer, winston 等）之外的第三方库不要新增

### 前端
- uni-app 组合式 API（`<script setup>`）
- API 调用通过 `@/api/index.js` 导出的模块方法
- token 通过 `@/utils/auth.js` 存取
- 图片 URL 统一用 `@/utils/url.js` 的 `getAvatarUrl`/`getImageUrl`
- 不用手动管理 loading 动画——`request.js` 内置了 500ms 延迟自动显示

## Git 约定
- 提交信息用中文，聚焦 WHY 而非 WHAT
- 不要 push 到远程，除非用户明确要求
- 不要创建新 commit，除非用户明确要求
- `.env` 不允许提交（已在 .gitignore 中）

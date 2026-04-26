# 校内考研助手 - 全栈项目

## 一、项目结构

```
e:\my-vue3-project\
├── server/                          # 后端服务 (Express + MySQL)
│   ├── app.js                       # 入口文件
│   ├── package.json                 # 依赖配置
│   ├── config/                      # 配置文件
│   │   └── index.js                 # 数据库、JWT等配置
│   ├── routes/                      # 路由模块
│   │   ├── user.js                  # 用户认证路由
│   │   ├── home.js                  # 首页相关路由
│   │   ├── study.js                 # 学习打卡路由
│   │   ├── material.js              # 资料中心路由
│   │   ├── forum.js                 # 论坛社区路由
│   │   └── admin.js                 # 后台管理路由
│   ├── middleware/                  # 中间件
│   │   ├── auth.js                  # JWT认证中间件
│   │   └── upload.js                # 文件上传中间件
│   ├── utils/                       # 工具函数
│   │   ├── db.js                    # 数据库连接池
│   │   └── response.js              # 统一响应格式
│   └── uploads/                     # 文件上传目录
│
├── client/                          # 前端项目 (Vue3 + UniApp)
│   ├── main.js                      # 入口文件
│   ├── App.vue                      # 根组件
│   ├── pages.json                   # 页面配置
│   ├── manifest.json                # 应用配置
│   ├── uni.scss                     # 全局样式变量
│   ├── index.html                   # H5入口HTML
│   ├── package.json                 # 依赖配置
│   ├── api/                         # API接口封装
│   │   ├── request.js               # 请求工具
│   │   └── index.js                 # API集合
│   ├── pages/                       # 页面目录
│   │   ├── index/                   # 首页
│   │   │   └── index.vue            # 首页(倒计时、通知、快捷入口)
│   │   ├── materials/               # 资料模块
│   │   │   ├── index.vue            # 资料列表
│   │   │   ├── detail.vue           # 资料详情
│   │   │   └── upload.vue           # 上传资料
│   │   ├── forum/                   # 论坛模块
│   │   │   ├── index.vue            # 论坛列表
│   │   │   ├── detail.vue           # 帖子详情
│   │   │   └── post.vue             # 发布帖子
│   │   ├── mine/                    # 个人中心
│   │   │   ├── index.vue            # 我的页面
│   │   │   ├── checkin.vue          # 打卡日历
│   │   │   └── favorites.vue        # 我的收藏
│   │   ├── study/                   # 学习模块
│   │   │   └── plan.vue             # 学习计划与打卡
│   │   ├── data/                    # 数据模块
│   │   │   └── dashboard.vue        # 考研数据大屏
│   │   ├── tools/                   # 工具模块
│   │   │   └── interview.vue        # 复试工具箱
│   │   └── login/
│   │       └── login.vue            # 登录页面
│   └── static/                      # 静态资源
│       └── tabbar/                  # 底部导航图标
│
└── database/
    └── schema.sql                   # 数据库建表语句
```

## 二、数据库设计 (MySQL 8.0)

### 核心数据表（共25张表）

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| users | 用户表 | id, openid, phone, student_id, nickname, avatar, college, major, role, status |
| notifications | 通知公告表 | id, title, content, type, is_top, publisher_id |
| notification_reads | 通知已读记录 | user_id, notification_id |
| ads | 广告表 | id, image_url, link_url, position, view_count, click_count |
| timeline_nodes | 时间线节点表 | id, name, target_date, year |
| user_timeline_subscriptions | 用户时间线订阅 | user_id, node_id, remind_3days, remind_1day |
| inspirational_quotes | 励志文案表 | content, author |
| study_plans | 学习计划表 | user_id, subject, task_name, plan_duration, priority, plan_date |
| study_checkins | 打卡记录表 | user_id, subject, task_name, duration, checkin_date |
| material_categories | 资料分类表 | name, parent_id, type, college, major |
| materials | 资料表 | category_id, title, file_path, download_count, audit_status |
| material_reviews | 资料评价表 | material_id, user_id, score, comment |
| material_favorites | 资料收藏表 | user_id, material_id, folder_id |
| material_folders | 文件夹表 | user_id, name |
| download_logs | 下载日志表 | user_id, material_id |
| forum_posts | 帖子表 | user_id, category, title, content, is_anonymous, audit_status |
| forum_comments | 评论表 | post_id, user_id, content, parent_id |
| forum_likes | 点赞表 | user_id, target_id, target_type |
| forum_favorites | 帖子收藏表 | user_id, post_id |
| reports | 举报表 | reporter_id, target_type, target_id, reason |
| kaoyan_data | 考研数据表 | year, college, major, total_applicants, admitted_count |
| ai_records | AI使用记录表 | user_id, type, input_content, output_content |
| sensitive_words | 敏感词表 | word, category |
| system_configs | 系统配置表 | config_key, config_value |

### 执行建表

```bash
mysql -u root -p < database/schema.sql
```

## 三、后端API接口说明

### 统一响应格式
```json
{
  "code": 200,
  "msg": "success",
  "data": { ... }
}
```
- code: 200成功, 401未授权, 403权限不足, 500服务器错误
- 分页返回: `{ list: [], total: 10, page: 1, pageSize: 10, totalPages: 1 }`

### 1. 用户模块 `/api/user`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /login | 登录(手机号/微信) | 否 |
| GET | /info | 获取用户信息 | 是 |
| PUT | /profile | 更新个人资料 | 是 |

### 2. 首页模块 `/api/home`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /timeline | 获取考研时间线 | 否 |
| GET | /timeline/subscribe | 获取时间线订阅 | 是 |
| POST | /timeline/subscribe | 订阅时间线提醒 | 是 |
| GET | /quote | 获取励志文案 | 否 |
| GET | /ads | 获取广告列表 | 否 |
| POST | /ads/:id/click | 记录广告点击 | 否 |
| GET | /notifications | 通知公告列表 | 否 |
| GET | /notifications/:id | 通知详情 | 否 |
| POST | /notifications/read-all | 标记全部已读 | 是 |

### 3. 学习模块 `/api/study`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /plans | 获取学习计划 | 是 |
| POST | /plans | 创建学习计划 | 是 |
| PUT | /plans/:id | 更新计划 | 是 |
| DELETE | /plans/:id | 删除计划 | 是 |
| POST | /checkin | 打卡 | 是 |
| GET | /checkins | 获取打卡记录(含统计) | 是 |
| GET | /templates | 获取计划模板 | 否 |
| POST | /apply-template | 应用模板 | 是 |

### 4. 资料模块 `/api/material`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /categories | 获取分类列表 | 否 |
| GET | /list | 资料列表(分页) | 否 |
| GET | /detail/:id | 资料详情 | 否 |
| POST | /upload | 上传资料 | 是 |
| GET | /download/:id | 下载资料 | 是 |
| POST | /:id/review | 评价资料 | 是 |
| POST | /:id/favorite | 收藏/取消收藏 | 是 |
| GET | /favorites | 收藏列表 | 是 |
| GET | /folders | 文件夹列表 | 是 |
| POST | /folders | 创建文件夹 | 是 |
| GET | /my-uploads | 我的上传记录 | 是 |

### 5. 论坛模块 `/api/forum`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /posts | 帖子列表(分页) | 否 |
| GET | /posts/:id | 帖子详情 | 否 |
| POST | /posts | 发布帖子 | 是 |
| POST | /posts/:id/like | 点赞/取消 | 是 |
| POST | /posts/:id/favorite | 收藏/取消 | 是 |
| POST | /posts/:id/comments | 发表评论 | 是 |
| POST | /comments/:id/like | 评论点赞 | 是 |
| GET | /favorites | 收藏帖子列表 | 是 |
| POST | /report | 举报 | 是 |

### 6. 后台管理 `/api/admin` (需管理员权限)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users | 用户列表 |
| PUT | /users/:id/status | 更新用户状态 |
| GET | /materials/pending | 待审核资料 |
| PUT | /materials/:id/audit | 审核资料 |
| GET | /posts/pending | 待审核帖子 |
| PUT | /posts/:id/audit | 审核帖子 |
| PUT | /posts/:id/top | 置顶/加精 |
| GET | /reports | 举报列表 |
| PUT | /reports/:id/handle | 处理举报 |
| GET | /stats/overview | 数据概览 |
| GET | /kaoyan-data | 考研数据查询 |
| POST | /kaoyan-data | 添加考研数据 |
| GET | /public/kaoyan-data | 公开考研数据(前端用) |
| POST | /notifications | 发布通知 |
| POST | /ads | 添加广告 |
| GET | /ai-usage | AI使用统计 |

## 四、运行步骤

### 环境要求
- Node.js >= 16.x
- MySQL >= 8.0
- npm 或 yarn

### 1. 安装数据库

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库并导入
source e:/my-vue3-project/database/schema.sql

# 或命令行直接执行
mysql -u root -p < e:/my-vue3-project/database/schema.sql
```

### 2. 启动后端服务

```bash
cd e:/my-vue3-project/server

# 安装依赖
npm install

# 修改配置(可选)
# 编辑 config/index.js 修改数据库密码等

# 启动服务
npm start
# 或开发模式(自动重启)
npm run dev
```

后端默认运行在 `http://localhost:3000`

### 3. 启动前端项目

```bash
cd e:/my-vue3-project/client

# 安装依赖
npm install

# H5模式运行
npm run dev:h5

# 微信小程序模式
npm run dev:mp-weixin
# 然后用微信开发者工具打开 dist/dev/mp-weixin 目录
```

### 4. 默认测试账号

首次登录时输入任意手机号即可自动注册，第一个注册的用户可手动在数据库中将 role 改为 admin 获得管理员权限：

```sql
UPDATE users SET role='admin' WHERE id=1;
```

## 五、功能清单

### 已实现的核心功能

**首页**
- ✅ 考研倒计时（实时计算天/时/分/秒）
- ✅ 时间线展示与订阅
- ✅ 每日励志文案
- ✅ 轮播广告位
- ✅ 滚动通知栏
- ✅ 快捷入口导航
- ✅ 今日学习计划预览
- ✅ 本校考研数据入口

**资料中心**
- ✅ 分类浏览（公共课/专业课/真题/笔记）
- ✅ 资料搜索与排序
- ✅ 资料详情与评价
- ✅ 文件上传与审核流程
- ✅ 文件下载（带水印）
- ✅ 收藏与文件夹管理
- ✅ 上传记录查看

**论坛社区**
- ✅ 多板块切换（备考交流/上岸经验/资料求助/复试调剂/匿名树洞）
- ✅ 发帖（富文本、图片、匿名）
- ✅ 帖子详情与评论
- ✅ 点赞、收藏、举报
- ✅ 精华/置顶标记
- ✅ 敏感词过滤

**学习打卡**
- ✅ 学习计划CRUD
- ✅ 三套模板（基础/强化/冲刺）
- ✅ 打卡功能（支持备注）
- ✅ 打卡日历视图
- ✅ 连续天数统计

**个人中心**
- ✅ 用户信息展示
- ✅ 学习数据统计
- ✅ 收藏管理（资料+帖子）
- ✅ 功能菜单导航
- ✅ 退出登录

**工具箱**
- ✅ 复试口语题库（30道题+参考回答）
- ✅ 导师邮件模板（3种场景，一键复制）
- ✅ 简历模板下载
- ✅ AI润色模拟（自我介绍优化）

**后台管理**
- ✅ 用户管理（状态、禁言、角色）
- ✅ 内容审核（资料/帖子/举报）
- ✅ 数据统计概览
- ✅ 考研数据维护
- ✅ 广告/通知管理
- ✅ AI使用监控

**安全合规**
- ✅ JWT Token认证
- ✅ 敏感词过滤
- ✅ 参数校验
- ✅ 统一错误处理
- ✅ 权限控制（普通用户/管理员）

## 六、技术特点

1. **前后端分离**: RESTful API设计，JSON统一格式
2. **模块化架构**: 后端按功能拆分路由，前端按页面组织
3. **数据库连接池**: 使用mysql2连接池提升性能
4. **JWT认证**: 无状态Token认证机制
5. **文件上传**: Multer中间件处理，支持多种格式
6. **响应式UI**: UniApp跨平台，适配小程序/H5/App
7. **组件化开发**: Vue3 Composition API
8. **统一错误处理**: 中间件拦截异常，友好提示

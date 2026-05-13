# 考研助手小程序 — 腾讯云宝塔面板部署指南

## 部署架构概览

```
用户手机 → 微信小程序 → HTTPS(443) → Nginx(宝塔) → localhost:3000(Express API)
                                                    ├── MySQL 8 (宝塔安装)
                                                    ├── Redis (宝塔安装，可选)
                                                    └── 文件存储 (本地 uploads/)
```

| 组件 | 说明 |
|------|------|
| 服务器 | 腾讯云轻量应用服务器 / CVM |
| 面板 | 宝塔面板（可视化运维） |
| 数据库 | MySQL 8（宝塔软件商店一键安装） |
| 缓存 | Redis（宝塔软件商店一键安装，可选） |
| 进程管理 | PM2 管理器（宝塔插件） |
| 域名 | 需备案域名，微信小程序**必须** HTTPS |

---

## 一、前置准备

### 1.1 账号与资源
- [ ] **腾讯云账号**：https://cloud.tencent.com
- [ ] **微信小程序账号**：https://mp.weixin.qq.com（需认证，300元/年）
- [ ] **域名**：在腾讯云购买并完成 **ICP 备案**（约 15-20 个工作日，提前办）
- [ ] **服务器**：轻量应用服务器，推荐 2核2G 起步，系统选 **CentOS 7.9** 或 **Ubuntu 22.04**

### 1.2 域名解析
在腾讯云 DNS 解析（DNSPod）添加 A 记录：

| 主机记录 | 记录类型 | 记录值 |
|---------|---------|--------|
| `api` | A | 服务器公网 IP |

例如 `api.yourdomain.com` → 你的服务器 IP。微信小程序只需要这一个 API 域名，不需要前端域名。

### 1.3 腾讯云安全组（放行端口）

在腾讯云控制台 → 轻量应用服务器 → 防火墙，添加规则：

| 端口 | 说明 |
|------|------|
| 22 | SSH 登录 |
| 80 | HTTP |
| 443 | HTTPS |
| 8888 | 宝塔面板入口（可自定义） |
| 3000 | API 服务（**不放行**，仅 Nginx 内部转发） |

> API 的 3000 端口**不要**在安全组放行，外部请求走 Nginx 代理即可保证安全。

---

## 二、安装宝塔面板

### 2.1 SSH 登录服务器后执行安装

```bash
# CentOS（推荐）
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484bec

# Ubuntu / Debian
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh ed8484bec
```

安装完成后会显示：

```
外网面板地址: http://你的IP:8888/xxxxxxxx
内网面板地址: http://内网IP:8888/xxxxxxxx
username: xxxxxxxx
password: xxxxxxxx
```

**记下这三个信息**，浏览器打开外网面板地址登录。

### 2.2 登录后基础设置

1. 首次进入会弹出推荐安装套件，**先关闭**，我们按需安装
2. 左侧菜单 → **面板设置**：
   - 修改面板别名（可自定义）
   - 修改面板端口（建议改掉 8888）
   - 绑定域名（可选）
   - 开启面板 SSL（可选，建议开）

---

## 三、安装运行环境（宝塔软件商店）

左侧菜单 → **软件商店**，依次安装以下软件：

### 3.1 必装

| 软件 | 版本 | 说明 |
|------|------|------|
| Nginx | 1.24+ | Web 服务器，反代 API |
| MySQL | 8.0 | 数据库 |
| Node.js 版本管理器 | 最新 | 安装和管理 Node.js 版本 |
| PM2 管理器 | 最新 | 进程守护，保活 API 服务 |

### 3.2 可选

| 软件 | 说明 |
|------|------|
| Redis | 缓存，不装则后端自动降级为内存缓存 |
| phpMyAdmin | MySQL 可视化管理（装一个方便） |

### 3.3 安装 Node.js 版本

1. 打开 **Node.js 版本管理器** → 命令行版本
2. 安装 **Node.js 20.x**（或 18.x 以上）
3. 设置为默认版本

---

## 四、创建数据库

### 4.1 通过 phpMyAdmin 或宝塔数据库面板

1. 左侧菜单 → **数据库** → 添加数据库

   | 字段 | 值 |
   |------|-----|
   | 数据库名 | `kaoyan_db` |
   | 用户名 | `kaoyan` |
   | 密码 | 设置一个强密码（记下来后面要用） |
   | 字符集 | `utf8mb4` |

2. 权限选择 **所有人**（localhost 即可）

### 4.2 导入表结构

1. 左侧菜单 → **数据库** → 找到 `kaoyan_db` → **管理**（或 phpMyAdmin）
2. 点击 **导入** → 选择本地的 `database/schema.sql` → 执行

> 也可以在宝塔 **文件** 页面上传 `schema.sql` 到服务器，再用命令行导入：
> ```bash
> mysql -u kaoyan -p kaoyan_db < /www/wwwroot/kaoyan/database/schema.sql
> ```

---

## 五、部署后端代码

### 5.1 上传项目

**方式一：宝塔文件管理器**

1. 左侧菜单 → **文件**
2. 进入 `/www/wwwroot/`
3. 新建目录 `kaoyan`，进入
4. 点击 **上传**，将整个项目压缩包上传后解压
5. 或者直接将项目文件拖拽上传

**方式二：Git 克隆（推荐）**

宝塔终端（左侧菜单 → 终端）中执行：

```bash
cd /www/wwwroot
git clone <你的GitHub仓库地址> kaoyan
cd kaoyan
```

### 5.2 配置环境变量

宝塔文件管理器 → 进入 `/www/wwwroot/kaoyan/server/`：

1. 复制 `.env.example` → 重命名为 `.env`
2. 右键 `.env` → 编辑

```env
# ---------- 以下必须修改 ----------

PORT=3000

# MySQL（填你 4.1 创建的数据库信息）
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=kaoyan
MYSQL_PASSWORD=你设置的数据库密码
MYSQL_DATABASE=kaoyan_db

# JWT 密钥
# 去宝塔终端执行：openssl rand -hex 32 （执行两次得到两个密钥）
JWT_SECRET=第一个openssl_rand_hex_32的输出
JWT_REFRESH_SECRET=第二个openssl_rand_hex_32的输出

# Redis（如果装了 Redis 并设了密码）
REDIS_ENABLED=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=你的Redis密码

# 微信小程序（在 mp.weixin.qq.com → 开发 → 开发设置 获取）
WECHAT_APPID=你的小程序AppID
WECHAT_APPSECRET=你的小程序AppSecret

# AI 助手（不配置则使用内置默认回复）
AI_API_KEY=
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-3.5-turbo

# CORS（微信小程序 origin 为空，自动放行，这里填 H5/管理后台域名）
ALLOWED_ORIGINS=
```

生成 JWT 密钥的操作（宝塔终端中）：

```bash
openssl rand -hex 32    # 复制输出作为 JWT_SECRET
openssl rand -hex 32    # 复制输出作为 JWT_REFRESH_SECRET
```

### 5.3 安装依赖并测试

宝塔终端：

```bash
cd /www/wwwroot/kaoyan/server
npm install

# 手动启动测试
node app.js
# 看到 "服务运行在 http://localhost:3000" 即成功
# 浏览器打开 http://你的IP:3000/api/health 验证
# 验证成功后 Ctrl+C 退出
```

### 5.4 用 PM2 管理器启动

1. 左侧菜单 → 软件商店 → **PM2 管理器** → 设置
2. 点击 **添加项目**：

   | 字段 | 值 |
   |------|-----|
   | 启动文件 | `/www/wwwroot/kaoyan/server/app.js` |
   | 项目名称 | `kaoyan-api` |
   | 运行目录 | `/www/wwwroot/kaoyan/server` |
   | 启动模式 | `fork` |

3. 点击提交，状态变绿即运行成功

> PM2 管理器已内置开机自启，服务器重启后项目会自动恢复运行。

---

## 六、配置 Nginx + SSL（宝塔网站管理）

### 6.1 创建站点

1. 左侧菜单 → **网站** → **添加站点**

   | 字段 | 值 |
   |------|-----|
   | 域名 | `api.yourdomain.com`（你的真实域名） |
   | 根目录 | 自动生成即可，如 `/www/wwwroot/api.yourdomain.com` |
   | FTP | 不创建 |
   | 数据库 | 不创建（已有） |
   | PHP 版本 | 纯静态（不需要 PHP） |

2. 点击提交

### 6.2 配置反向代理

1. 网站列表 → 找到 `api.yourdomain.com` → 点击 **设置**
2. 左侧标签 → **反向代理** → **添加反向代理**

   | 字段 | 值 |
   |------|-----|
   | 代理名称 | `kaoyan-api` |
   | 目标 URL | `http://127.0.0.1:3000` |
   | 发送域名 | `$host` |

3. 其他保持默认，点击提交

### 6.3 配置上传文件大小限制

仍然在站点设置 → **配置文件**，在 `server` 块中添加：

```nginx
# 放在 server { } 内部任意位置即可
client_max_body_size 55m;
```

然后**保存**。

### 6.4 配置静态文件缓存（可选）

站点设置 → **配置文件**，找到 `#REWRITE-START` 之前，加入：

```nginx
location /uploads/ {
    alias /www/wwwroot/kaoyan/server/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 6.5 申请 SSL 证书（一键操作）

1. 网站列表 → 点击域名 → **设置** → **SSL**
2. 选择 **Let's Encrypt**（宝塔内置，免费）
3. 勾选域名，点击 **申请**
4. 申请成功后，**强制 HTTPS** 开关打开

> 宝塔会自动续期 Let's Encrypt 证书，无需手动操作。

### 6.6 验证

浏览器访问 `https://api.yourdomain.com/api/health`，返回 JSON 即表示 Nginx 反代 + SSL 全部正常。

---

## 七、前端（微信小程序）部署

> 前端不需要部署到服务器，只需在本地构建后上传到微信平台。

### 7.1 配置 API 地址

在你的**本地电脑**项目目录中：

```
client/.env（复制 .env.example 得到）
```

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 7.2 构建

```bash
cd client
npm install
npm run build:mp-weixin
```

构建产物在 `client/dist/build/mp-weixin/`。

### 7.3 上传发布

1. 打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目 → 选择 `client/dist/build/mp-weixin/` → 填入 AppID
3. 预览测试各功能，确认 API 调用正常
4. 点击 **上传** → 填写版本号（如 1.0.0）
5. 登录 [微信公众平台](https://mp.weixin.qq.com) → 管理 → 版本管理 → 提交审核
6. 审核通过后点击发布

### 7.4 微信小程序后台配置

微信公众平台 → 开发 → 开发管理 → 开发设置 → **服务器域名**：

| 类型 | 域名 |
|------|------|
| request 合法域名 | `https://api.yourdomain.com` |
| uploadFile 合法域名 | `https://api.yourdomain.com` |
| downloadFile 合法域名 | `https://api.yourdomain.com` |

---

## 八、数据库备份

### 8.1 宝塔面板计划任务

左侧菜单 → **计划任务** → 添加任务：

| 字段 | 值 |
|------|-----|
| 任务类型 | 备份数据库 |
| 数据库 | `kaoyan_db` |
| 备份目录 | `/www/backup/database` |
| 保留份数 | 30 |
| 执行周期 | 每天凌晨 2 点 |

### 8.2 项目自带备份脚本（备选）

在计划任务中添加 Shell 脚本：

```bash
cd /www/wwwroot/kaoyan/server && node scripts/backup.js
```

---

## 九、日常运维

### 9.1 查看服务状态

- **PM2 管理器**：软件商店 → PM2 管理器 → 查看进程状态、CPU/内存占用
- **日志查看**：PM2 管理器 → 点击项目名 → 日志

### 9.2 更新代码

每次修改代码推送到 GitHub 后：

```bash
cd /www/wwwroot/kaoyan
git pull

# 如果有新的 npm 依赖
cd server
npm install

# 重启 API
# PM2 管理器 → 找到 kaoyan-api → 重启
```

### 9.3 常见问题

| 现象 | 排查步骤 |
|------|---------|
| 小程序报"网络错误" | ① `curl https://api.xxx.com/api/health` 能否通？<br>② 检查 `.env` 中 `VITE_API_BASE_URL` 是否正确<br>③ 微信后台服务器域名是否配置 |
| API 返回 502 | ① PM2 管理器中 kaoyan-api 是否绿灯运行？<br>② 宝塔终端 `curl http://127.0.0.1:3000/api/health`<br>③ 检查 Nginx 反代目标 URL 是否正确 |
| 数据库连接失败 | ① MySQL 服务是否运行（宝塔首页可看）<br>② `.env` 中数据库密码是否正确<br>③ 数据库用户权限是否 localhost |
| HTTPS 证书问题 | 网站 → 设置 → SSL → 检查证书状态，Let's Encrypt 自动续期 |
| PM2 进程频繁退出 | PM2 管理器 → 日志查看报错原因，常见：数据库连不上、JWT_SECRET 未配置 |
| 文件上传失败 | ① `/www/wwwroot/kaoyan/server/uploads/` 目录是否存在<br>② 宝塔文件管理器 → 右键 uploads → 权限设为 755 |

### 9.4 性能优化建议

- **MySQL 优化**：宝塔软件商店 → MySQL → 设置 → 性能调整，根据服务器内存选择预设
- **日志清理**：宝塔计划任务添加定期清理日志
- **监控**：宝塔首页自带 CPU/内存/磁盘/网络 实时监控

---

## 十、安全清单（上线前必查）

- [ ] 宝塔面板端口已修改（非 8888）
- [ ] 宝塔面板已开启 SSL
- [ ] MySQL 端口（3306）**未在安全组放行**
- [ ] API 端口（3000）**未在安全组放行**
- [ ] `.env` 文件已配置真实 JWT_SECRET 和 JWT_REFRESH_SECRET
- [ ] `.env` 文件权限 600（宝塔文件管理器 → 右键 → 权限）
- [ ] 微信小程序域名已配置为 HTTPS
- [ ] SSL 证书已申请并开启强制 HTTPS
- [ ] PM2 管理器已设置开机自启
- [ ] 数据库备份计划任务已创建

# Uni-app 微信小程序错误修复指南

## 错误信息

```
TypeError: up.split is not a function 
  at findComponentPropsData (vendor.js:6607)
  at findPropsData (vendor.js:7262)
  ...

Error: timeout
  ...
```

## 修复步骤

### 第一步：清理缓存（推荐优先执行）

#### 方法1：使用清理脚本（Windows）
双击运行项目根目录下的 `clean.bat` 文件

#### 方法2：手动清理
```bash
# 清理 client 目录
cd client
rmdir /s /q node_modules
del package-lock.json
rmdir /s /q unpackage
rmdir /s /q dist
rmdir /s /q .vite

# 清理 server 目录（可选）
cd ../server
rmdir /s /q node_modules
del package-lock.json

# 回到根目录
cd ..
```

### 第二步：重新安装依赖

```bash
# 安装 client 依赖
cd client
npm install

# 安装 server 依赖（如果需要后端服务）
cd ../server
npm install
```

### 第三步：清理微信开发者工具缓存

1. 打开微信开发者工具
2. 点击菜单栏：工具 -> 清除缓存
3. 选择以下选项全部清除：
   - 清除文件缓存
   - 清除数据缓存
   - 清除授权缓存
   - 清除登录状态

4. 关闭并重新打开微信开发者工具

### 第四步：重新编译运行

```bash
cd client
npm run dev:mp-weixin
```

---

## 如果以上方法无效，尝试以下排查方案

### 方案1：检查组件 Props 定义

检查所有 `.vue` 组件文件中的 `props` 定义，确保：

**错误示例：**
```javascript
// ❌ 错误的写法
props: ['title', 'data']  // 字符串数组形式可能有问题

// ❌ 或者 props 定义不完整
props: {
  title: String,
  // 缺少默认值或类型验证
}
```

**正确示例：**
```javascript
// ✅ 推荐的写法
props: {
  title: {
    type: String,
    default: ''
  },
  data: {
    type: Array,
    default: () => []
  }
}
```

### 方案2：检查 pages.json 配置

确保 `pages.json` 中的页面路径正确，所有页面文件都存在。

### 方案3：检查 manifest.json 配置

确认 `manifest.json` 中的配置正确，特别是 `mp-weixin` 部分。

### 方案4：尝试降级 uni-app 版本

如果问题持续存在，可以尝试使用更稳定的 uni-app 版本。

修改 `client/package.json`：
```json
{
  "dependencies": {
    "@dcloudio/uni-app": "3.0.0-alpha-4020420240430001",
    "@dcloudio/uni-components": "3.0.0-alpha-4020420240430001",
    "@dcloudio/uni-h5": "3.0.0-alpha-4020420240430001",
    "@dcloudio/uni-mp-weixin": "3.0.0-alpha-4020420240430001",
    "vue": "^3.4.0"
  }
}
```

### 方案5：检查是否有语法错误

运行编译时查看控制台是否有其他语法错误提示，先修复这些错误。

---

## 常见问题

### Q: 清理后还是报错怎么办？

A: 请按顺序检查：
1. 确认 node 版本（建议 v16+）
2. 检查是否所有页面文件都存在
3. 查看微信开发者工具的"调试器" -> Console 标签中的完整错误信息
4. 尝试新建一个空白页面测试是否能正常运行

### Q: timeout 错误如何解决？

A: timeout 错误通常由以下原因引起：
1. 网络请求超时 - 检查后端服务是否正常启动
2. 页面渲染超时 - 简化页面内容，减少复杂组件
3. 微信开发者工具卡顿 - 重启开发者工具

### Q: 如何快速定位是哪个组件导致的问题？

A: 
1. 注释掉复杂的组件，逐个恢复测试
2. 检查最近修改的组件
3. 使用 git 二分查找定位问题代码

---

## 联系支持

如果以上方法都无法解决问题，请提供以下信息：
1. 完整的错误截图
2. Node.js 版本 (`node -v`)
3. npm 版本 (`npm -v`)
4. 微信开发者工具版本
5. 最近修改的文件列表

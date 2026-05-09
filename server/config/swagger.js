const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '校内考研助手 API 文档',
      version: '1.0.0',
      description: `# 校内考研助手 - API 接口文档

## 概述
本系统是面向高校考研学子的全栈小程序后端，提供考研全流程支持。

## 认证方式
- **JWT Bearer Token**：在请求头中添加 \`Authorization: Bearer {accessToken}\`
- **接口权限**：
  - \`auth\`：需要登录（普通用户）
  - \`optionalAuth\`：可选登录
  - \`adminAuth\`：需要管理员权限
  - \`superAdminAuth\`：需要超级管理员权限

## 统一响应格式

\`\`\`json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
\`\`\`

## 分页响应格式

\`\`\`json
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
\`\`\`

## 错误码说明

| 状态码 | 含义 |
| --- | --- |
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 / Token 过期 |
| 403 | 权限不足 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |`,
      contact: {
        name: '校内考研助手'
      }
    },
    servers: [
      {
        url: 'http://127.0.0.1:3000',
        description: '本地开发环境'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '输入 JWT access_token（不含 Bearer 前缀）'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 200 },
            msg: { type: 'string', example: 'success' },
            data: { type: 'object' }
          }
        },
        PageResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 200 },
            msg: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                list: { type: 'array' },
                total: { type: 'integer', example: 100 },
                page: { type: 'integer', example: 1 },
                pageSize: { type: 'integer', example: 20 },
                totalPages: { type: 'integer', example: 5 }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nickname: { type: 'string' },
            avatar: { type: 'string' },
            student_id: { type: 'string' },
            college: { type: 'string' },
            major: { type: 'string' },
            role: { type: 'string', enum: ['student', 'admin', 'super_admin'] },
            status: { type: 'integer' },
            is_banned: { type: 'boolean' },
            is_landed: { type: 'boolean' }
          }
        },
        Material: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            category_id: { type: 'integer' },
            file_path: { type: 'string' },
            file_size: { type: 'integer' },
            download_count: { type: 'integer' },
            like_count: { type: 'integer' },
            view_count: { type: 'integer' },
            avg_score: { type: 'string' },
            audit_status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string' },
            board: { type: 'string' },
            user_id: { type: 'integer' },
            is_anonymous: { type: 'boolean' },
            like_count: { type: 'integer' },
            comment_count: { type: 'integer' },
            view_count: { type: 'integer' },
            is_top: { type: 'boolean' },
            is_essence: { type: 'boolean' },
            status: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        ProxyNode: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            type: { type: 'string' },
            server: { type: 'string' },
            port: { type: 'integer' },
            latency: { type: 'integer' },
            is_active: { type: 'boolean' }
          }
        },
        DashboardStats: {
          type: 'object',
          properties: {
            total_instances: { type: 'integer' },
            running_instances: { type: 'integer' },
            stopped_instances: { type: 'integer' },
            error_instances: { type: 'integer' },
            total_proxies: { type: 'integer' },
            total_presets: { type: 'integer' },
            total_kernels: { type: 'integer' },
            total_pipelines: { type: 'integer' },
            total_executions: { type: 'integer' }
          }
        }
      }
    },
    security: [],
    paths: {}
  },
  apis: ['./routes/*.js']
}

function setupSwagger(app) {
  const swaggerSpec = swaggerJsdoc(options)

  const uiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: '校内考研助手 API 文档'
  }

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, uiOptions))

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.json(swaggerSpec)
  })

  console.log(`📚 API 文档界面: http://localhost:${process.env.PORT || 3000}/api-docs`)
  console.log(`📋 API JSON: http://localhost:${process.env.PORT || 3000}/api-docs.json`)
}

module.exports = { setupSwagger }

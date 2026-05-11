module.exports = {
  port: process.env.PORT || 3000,
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'kaoyan_db',
    timezone: '+08:00'
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET
  },
  redis: {
    enabled: process.env.REDIS_ENABLED !== 'false',
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'kaoyan:'
  },
  upload: {
    maxFileSize: 50 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  wechat: {
    appId: process.env.WECHAT_APPID || 'touristappid',
    appSecret: process.env.WECHAT_APPSECRET || '',
    notificationTemplate: process.env.WECHAT_NOTIFICATION_TEMPLATE || '',
    messageTemplate: process.env.WECHAT_MESSAGE_TEMPLATE || ''
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_API_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'gpt-3.5-turbo'
  }
}

module.exports = {
  port: process.env.PORT || 3000,
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '123456',
    database: process.env.MYSQL_DATABASE || 'kaoyan_db',
    timezone: '+08:00'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'kaoyan-secret-key-2024',
    expiresIn: '7d'
  },
  upload: {
    maxFileSize: 50 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
}

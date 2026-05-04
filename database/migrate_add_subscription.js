const db = require('../server/utils/db')

async function migrate() {
  console.log('开始添加用户订阅表...')

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL COMMENT '用户ID',
        openid VARCHAR(100) NOT NULL COMMENT '微信openid',
        template_id VARCHAR(100) NOT NULL COMMENT '订阅消息模板ID',
        scene VARCHAR(50) DEFAULT 'default' COMMENT '订阅场景',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_template (user_id, template_id),
        INDEX idx_openid (openid),
        INDEX idx_template (template_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户订阅消息表'
    `)

    console.log('用户订阅表创建成功！')
    console.log('\n请在微信小程序后台配置以下订阅消息模板：')
    console.log('1. 通知提醒模板（用于系统通知）')
    console.log('   模板建议内容：')
    console.log('   - 标题：通知提醒')
    console.log('   - 内容：{{thing1.DATA}}\n内容：{{thing2.DATA}}\n类型：{{thing3.DATA}}')
    console.log('\n2. 消息提醒模板（用于私聊消息）')
    console.log('   模板建议内容：')
    console.log('   - 标题：新消息提醒')
    console.log('   - 内容：{{thing1.DATA}}\n内容：{{thing2.DATA}}\n时间：{{date3.DATA}}')

    process.exit(0)
  } catch (error) {
    console.error('数据库迁移失败:', error)
    process.exit(1)
  }
}

migrate()

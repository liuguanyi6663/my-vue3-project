const db = require('../server/utils/db')

async function migrate() {
  console.log('开始添加用户删除对话记录表...')

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_deleted_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL COMMENT '删除对话的用户ID',
        other_user_id INT NOT NULL COMMENT '对话对方的用户ID',
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '删除时间',
        UNIQUE KEY uk_user_other (user_id, other_user_id),
        INDEX idx_user (user_id),
        INDEX idx_other (other_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户删除对话记录表'
    `)

    console.log('用户删除对话记录表创建成功！')
    process.exit(0)
  } catch (error) {
    console.error('数据库迁移失败:', error)
    process.exit(1)
  }
}

migrate()

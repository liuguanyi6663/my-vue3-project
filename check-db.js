const db = require('./server/utils/db')

async function checkDatabase() {
  console.log('开始检查数据库...\n')
  
  try {
    // 检查帖子表
    const posts = await db.query('SELECT id, title, category, audit_status, status, created_at FROM forum_posts')
    
    console.log('=== 帖子列表 ===')
    if (posts.length === 0) {
      console.log('没有帖子数据\n')
    } else {
      console.log(`找到 ${posts.length} 条帖子:`)
      posts.forEach(post => {
        console.log(`ID: ${post.id}, 标题: ${post.title}, 板块: ${post.category}, 状态: ${post.status}, 审核: ${post.audit_status}`)
      })
      console.log('')
    }
    
    // 检查用户表
    const users = await db.query('SELECT id, nickname, role FROM users')
    
    console.log('=== 用户列表 ===')
    if (users.length === 0) {
      console.log('没有用户数据\n')
    } else {
      console.log(`找到 ${users.length} 个用户:`)
      users.forEach(user => {
        console.log(`ID: ${user.id}, 昵称: ${user.nickname}, 角色: ${user.role}`)
      })
      console.log('')
    }
    
  } catch (err) {
    console.error('数据库检查失败:', err)
  }
  
  process.exit(0)
}

checkDatabase()

const db = require('./server/utils/db')

async function checkDatabase() {
  console.log('开始检查数据库...\n')
  
  try {
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

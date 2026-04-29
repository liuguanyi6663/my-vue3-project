const db = require('./server/utils/db')

async function upgradeToSuper() {
  console.log('=== 升级为超级管理员 ===\n')
  
  try {
    const users = await db.query('SELECT id, nickname, role FROM users')
    
    console.log('当前用户列表:')
    users.forEach(user => {
      console.log(`ID: ${user.id}, 昵称: ${user.nickname}, 角色: ${user.role}`)
    })
    
    const adminUsers = await db.query('SELECT * FROM users WHERE role = ?', ['admin'])
    if (adminUsers.length > 0) {
      const admin = adminUsers[0]
      console.log('\n正在升级用户 ' + admin.nickname + ' 为超级管理员...')
      await db.query('UPDATE users SET role = ? WHERE id = ?', ['super_admin', admin.id])
      console.log('升级完成！')
      
      const updatedUsers = await db.query('SELECT id, nickname, role FROM users')
      console.log('\n更新后的用户列表:')
      updatedUsers.forEach(user => {
        console.log(`ID: ${user.id}, 昵称: ${user.nickname}, 角色: ${user.role}`)
      })
    }
    
  } catch (err) {
    console.error('升级失败:', err)
  }
  
  process.exit(0)
}

upgradeToSuper()

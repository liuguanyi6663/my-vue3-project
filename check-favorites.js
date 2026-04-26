const db = require('./server/utils/db')

async function checkFavorites() {
  console.log('=== 检查 forum_favorites 表 ===\n')
  
  try {
    // 查询表是否存在
    const tables = await db.query("SHOW TABLES LIKE 'forum_favorites'")
    console.log('forum_favorites 表存在:', tables.length > 0)
    
    if (tables.length === 0) {
      console.log('\n表不存在！')
      return
    }
    
    // 查询表结构
    const columns = await db.query('DESCRIBE forum_favorites')
    console.log('\n表结构:')
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`)
    })
    
    // 查询收藏数据
    const data = await db.query('SELECT * FROM forum_favorites')
    console.log(`\n收藏数据 (共 ${data.length} 条):`)
    data.forEach(row => {
      console.log(JSON.stringify(row))
    })
    
    // 查询用户
    const users = await db.query('SELECT id, nickname FROM users LIMIT 5')
    console.log('\n用户列表:')
    users.forEach(u => {
      console.log(`- ${u.id}: ${u.nickname}`)
    })
    
  } catch (err) {
    console.error('检查失败:', err)
  }
  
  process.exit(0)
}

checkFavorites()

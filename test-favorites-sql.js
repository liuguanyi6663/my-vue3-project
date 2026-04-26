const db = require('./server/utils/db')

async function testSQL() {
  console.log('=== 测试收藏查询SQL ===\n')
  
  try {
    // 获取第一个用户
    const users = await db.query('SELECT id FROM users LIMIT 1')
    if (users.length === 0) {
      console.log('没有用户数据')
      return
    }
    
    const userId = users[0].id
    console.log(`测试用户ID: ${userId}`)
    
    // 测试 SQL
    const page = 1
    const pageSize = 10
    const offset = (page - 1) * pageSize
    
    const sql = `SELECT p.*, ff.created_at as favorited_at,
       CASE WHEN p.is_anonymous=1 THEN '匿名用户' ELSE u.nickname END as display_name
       FROM forum_favorites ff 
       INNER JOIN forum_posts p ON ff.post_id=p.id 
       LEFT JOIN users u ON p.user_id=u.id 
       WHERE ff.user_id=? AND p.status=1
       ORDER BY ff.created_at DESC LIMIT ? OFFSET ?`
    
    console.log('\n执行SQL查询...')
    console.log('SQL:', sql)
    console.log('参数:', [userId, pageSize, offset])
    
    const list = await db.query(sql, [userId, pageSize, offset])
    
    console.log(`\n查询结果 (${list.length} 条):`)
    list.forEach((item, index) => {
      console.log(`\n#${index + 1}:`)
      console.log(`- id: ${item.id}`)
      console.log(`- title: ${item.title}`)
      console.log(`- display_name: ${item.display_name}`)
      console.log(`- favorited_at: ${item.favorited_at}`)
    })
    
  } catch (err) {
    console.error('\nSQL执行失败!')
    console.error('错误:', err)
    console.error('错误信息:', err.message)
    console.error('错误堆栈:', err.stack)
  }
  
  process.exit(0)
}

testSQL()

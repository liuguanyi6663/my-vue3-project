const db = require('./server/utils/db')

async function testFavorites() {
  console.log('=== 测试收藏功能 ===\n')
  
  try {
    // 查询第一个用户和第一个帖子
    const users = await db.query('SELECT id FROM users LIMIT 1')
    const posts = await db.query('SELECT id FROM forum_posts WHERE status=1 LIMIT 1')
    
    if (users.length === 0 || posts.length === 0) {
      console.log('没有足够的数据进行测试')
      return
    }
    
    const userId = users[0].id
    const postId = posts[0].id
    
    console.log(`用户ID: ${userId}`)
    console.log(`帖子ID: ${postId}`)
    
    // 添加一条收藏记录
    const existing = await db.query(
      'SELECT * FROM forum_favorites WHERE user_id=? AND post_id=?',
      [userId, postId]
    )
    
    if (existing.length === 0) {
      console.log('\n添加测试收藏...')
      await db.query(
        'INSERT INTO forum_favorites (user_id, post_id) VALUES (?, ?)',
        [userId, postId]
      )
      console.log('添加成功！')
    } else {
      console.log('\n已存在该收藏记录')
    }
    
    // 查询所有收藏
    const allFavorites = await db.query('SELECT * FROM forum_favorites')
    console.log(`\n当前所有收藏 (${allFavorites.length} 条):`)
    allFavorites.forEach(f => {
      console.log(JSON.stringify(f))
    })
    
  } catch (err) {
    console.error('测试失败:', err)
  }
  
  process.exit(0)
}

testFavorites()

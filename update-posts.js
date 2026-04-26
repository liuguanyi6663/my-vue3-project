const db = require('./server/utils/db')

async function updatePosts() {
  console.log('开始更新帖子状态...\n')
  
  try {
    // 更新所有帖子的审核状态为 approved
    const result = await db.query(
      "UPDATE forum_posts SET audit_status = 'approved' WHERE audit_status = 'pending'"
    )
    
    console.log(`更新了 ${result.affectedRows} 条帖子的审核状态为 approved\n`)
    
    // 再次查询确认
    const posts = await db.query('SELECT id, title, category, audit_status, status FROM forum_posts')
    console.log('=== 更新后的帖子列表 ===')
    posts.forEach(post => {
      console.log(`ID: ${post.id}, 标题: ${post.title}, 审核: ${post.audit_status}`)
    })
    
  } catch (err) {
    console.error('更新失败:', err)
  }
  
  process.exit(0)
}

updatePosts()

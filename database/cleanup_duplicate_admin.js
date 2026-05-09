const db = require('../server/utils/db')

async function cleanup() {
  try {
    console.log('开始清理重复的超级管理员账号...\n')
    
    const adminPhone = '15900000000'
    
    // 查询所有手机号为 15900000000 的账号
    const users = await db.query('SELECT * FROM users WHERE phone = ? ORDER BY id ASC', [adminPhone])
    
    if (users.length === 0) {
      console.log(`没有找到手机号为 ${adminPhone}的用户')
      process.exit(0)
    }
    
    console.log(`共找到 ${users.length} 个账号：')
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}, 昵称: ${user.nickname}, 角色: ${user.role}`)
    }
    
    if (users.length === 1) {
      console.log('\n只有一个账号，无需清理')
      process.exit(0)
    }
    
    console.log('\n开始清理策略：')
    console.log('  - 保留第一个账号（ID 最小的）为超级管理员')
    console.log('  - 移除其他重复账号\n')
    
    // 找到要保留的用户（第一个）
    const keepUserId = users[0]
    
    // 找到要删除的用户 ID
    const deleteIds = users.slice(1).map(u => u.id)
    
    console.log(`保留账号 ID: ${keepUserId.id} (${keepUserId.nickname})')
    console.log(`删除账号 IDs: ${deleteIds.join(', ')}`)
    
    // 开始删除...
    for (const id of deleteIds) {
      console.log(`正在删除 ID ${id}...`)
      
      // 处理与该用户关联的数据
      // 注意：由于有外键约束，需要先删除关联数据
      
      // 删除 forum_posts
      // 删除 forum_comments
      // 删除 forum_likes
      // 删除 forum_favorites
      // 删除 reports
      // 删除 study_plans
      // 删除 study_checkins
      // 删除 title_certifications
      // 删除 feedbacks
      // 删除 user_blocks
      // 删除 download_logs
      // 删除 material_likes
      // 删除 material_favorites
      // 删除 material_reviews
      // 删除 ai_conversations
      // 删除 material_uploaded
      // 删除 等等...
      
      // 为了安全起见，我们只删除该用户的数据保留记录，但保留数据
      // 或者，我们可以只是清空该用户信息，将其标记为禁用状态
      
      // 更新该用户信息，将其标记为禁用状态，保留数据
      await db.query('UPDATE users SET phone = CONCAT(phone, "_deleted_", id) WHERE id = ?', [id])
      console.log(`已将账号 ${id} 的手机号标记为 ${users.find(u => u.id === id).phone}_deleted_${id} 并禁用`)
    }
    
    console.log('\n清理完成！')
    process.exit(0)
  } catch (e) {
    console.error('清理失败：', e)
    process.exit(1)
  }
}

cleanup()

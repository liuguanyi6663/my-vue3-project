const db = require('./db')

// 删除用户所有数据的函数
async function deleteAllUserData(userId) {
  const connection = await db.getConnection()
  
  try {
    await connection.beginTransaction()
    
    // 删除学习计划
    await connection.query('DELETE FROM study_plans WHERE user_id = ?', [userId])
    
    // 删除打卡记录
    await connection.query('DELETE FROM study_checkins WHERE user_id = ?', [userId])
    
    // 删除资料收藏
    await connection.query('DELETE FROM material_favorites WHERE user_id = ?', [userId])
    
    // 删除资料评价点赞
    await connection.query('DELETE FROM review_likes WHERE user_id = ?', [userId])
    
    // 删除资料点赞
    await connection.query('DELETE FROM material_likes WHERE user_id = ?', [userId])
    
    // 删除下载日志
    await connection.query('DELETE FROM download_logs WHERE user_id = ?', [userId])
    
    // 删除用户上传的资料
    await connection.query('DELETE FROM materials WHERE uploader_id = ?', [userId])
    
    // 删除论坛帖子点赞
    await connection.query('DELETE FROM forum_likes WHERE user_id = ?', [userId])
    
    // 删除论坛帖子收藏
    await connection.query('DELETE FROM forum_favorites WHERE user_id = ?', [userId])
    
    // 删除论坛评论
    await connection.query('DELETE FROM forum_comments WHERE user_id = ?', [userId])
    
    // 删除论坛帖子 - 先处理帖子的评论和点赞
    const posts = await connection.query('SELECT id FROM forum_posts WHERE user_id = ?', [userId])
    for (const post of posts) {
      await connection.query('DELETE FROM forum_comments WHERE post_id = ?', [post.id])
      await connection.query('DELETE FROM forum_likes WHERE target_id = ? AND target_type = ?', [post.id, 'post'])
      await connection.query('DELETE FROM forum_favorites WHERE post_id = ?', [post.id])
    }
    await connection.query('DELETE FROM forum_posts WHERE user_id = ?', [userId])
    
    // 删除举报
    await connection.query('DELETE FROM reports WHERE reporter_id = ?', [userId])
    await connection.query('DELETE FROM reports WHERE handler_id = ?', [userId])
    
    // 删除AI记录
    await connection.query('DELETE FROM ai_records WHERE user_id = ?', [userId])
    
    // 删除头衔认证申请
    await connection.query('DELETE FROM title_certifications WHERE user_id = ?', [userId])
    
    // 删除用户时间线订阅
    await connection.query('DELETE FROM user_timeline_subscriptions WHERE user_id = ?', [userId])
    
    // 删除通知已读记录
    await connection.query('DELETE FROM notification_reads WHERE user_id = ?', [userId])
    
    // 删除消息
    await connection.query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId])
    
    // 删除用户上传的口语题库
    await connection.query('DELETE FROM oral_questions_user WHERE user_id = ?', [userId])
    
    // 删除用户上传的简历模板
    await connection.query('DELETE FROM resume_templates_user WHERE user_id = ?', [userId])
    
    // 删除用户上传的邮件模板
    await connection.query('DELETE FROM email_templates_user WHERE user_id = ?', [userId])
    
    // 删除用户反馈
    await connection.query('DELETE FROM feedbacks WHERE user_id = ?', [userId])
    
    // 删除用户屏蔽关系
    await connection.query('DELETE FROM user_blocks WHERE user_id = ? OR blocked_user_id = ?', [userId, userId])
    
    // 最后删除用户
    await connection.query('DELETE FROM users WHERE id = ?', [userId])
    
    await connection.commit()
    
    console.log(`用户 ${userId} 的所有数据已彻底删除`)
  } catch (error) {
    await connection.rollback()
    console.error(`删除用户 ${userId} 数据失败:`, error)
    throw error
  } finally {
    connection.release()
  }
}

// 检查并清理超过冷静期的账号
async function cleanupExpiredAccounts() {
  try {
    console.log('开始检查并清理过期账号...')
    
    // 查询所有超过30秒冷静期的账号
    const expiredUsers = await db.query(
      'SELECT id, delete_request_at FROM users WHERE is_deleting = 1 AND delete_request_at <= DATE_SUB(NOW(), INTERVAL 30 SECOND)'
    )
    
    console.log(`发现 ${expiredUsers.length} 个账号超过冷静期，准备删除`)
    
    for (const user of expiredUsers) {
      try {
        await deleteAllUserData(user.id)
      } catch (error) {
        console.error(`处理用户 ${user.id} 删除失败:`, error)
      }
    }
    
    console.log('账号清理完成')
  } catch (error) {
    console.error('账号清理任务失败:', error)
  }
}

// 启动定时任务，每小时检查一次
function startCleanupJob() {
  console.log('账号清理定时任务已启动')
  // 立即执行一次
  cleanupExpiredAccounts()
  // 每小时执行一次
  setInterval(cleanupExpiredAccounts, 60 * 60 * 1000)
}

module.exports = {
  deleteAllUserData,
  cleanupExpiredAccounts,
  startCleanupJob
}

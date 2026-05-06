const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error } = require('../utils/response')
const { auth } = require('../middleware/auth')
const wechat = require('../utils/wechat')
const config = require('../config/index')

// 检查是否被对方屏蔽的辅助函数
const checkBlocked = async (currentUserId, targetUserId) => {
  const result = await db.query(
    'SELECT id FROM user_blocks WHERE user_id=? AND blocked_user_id=? LIMIT 1',
    [targetUserId, currentUserId]
  )
  return result.length > 0
}

// 检查是否屏蔽了对方的辅助函数
const checkIsBlocking = async (currentUserId, targetUserId) => {
  const result = await db.query(
    'SELECT id FROM user_blocks WHERE user_id=? AND blocked_user_id=? LIMIT 1',
    [currentUserId, targetUserId]
  )
  return result.length > 0
}

router.get('/conversations', auth, async (req, res) => {
  try {
    // 先检查表是否存在
    let conversations = []
    try {
      // 先获取所有可能的会话
      const allConversations = await db.query(
        `SELECT 
          CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
          u.nickname as other_nickname,
          u.avatar as other_avatar,
          m.content as last_message,
          m.created_at as last_time,
          CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as is_blocked
         FROM messages m
         LEFT JOIN users u ON u.id = CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END
         LEFT JOIN user_blocks ub ON ub.user_id=? AND ub.blocked_user_id=u.id
         WHERE m.id IN (
           SELECT MAX(id) FROM messages 
           WHERE sender_id=? OR receiver_id=?
           GROUP BY CASE WHEN sender_id=? THEN receiver_id ELSE sender_id END
         )
         ORDER BY m.created_at DESC`,
        [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
      )
      
      // 过滤出有效的会话
      const validConversations = []
      for (const conv of allConversations) {
        // 检查是否有删除记录
        let deletedAt = null
        try {
          const deletedResult = await db.query(
            'SELECT deleted_at FROM user_deleted_conversations WHERE user_id=? AND other_user_id=?',
            [req.user.id, conv.other_user_id]
          )
          if (deletedResult.length > 0) {
            deletedAt = deletedResult[0].deleted_at
          }
        } catch (e) {
          // 表不存在，继续
        }
        
        // 如果有删除时间，检查最后一条消息是否在删除时间之后
        if (deletedAt) {
          if (new Date(conv.last_time) >= new Date(deletedAt)) {
            // 最后一条消息在删除时间之后，保留这个会话
            // 重新计算未读数
            const unreadResult = await db.query(
              'SELECT COUNT(*) as count FROM messages WHERE sender_id=? AND receiver_id=? AND is_read=0 AND created_at >= ?',
              [conv.other_user_id, req.user.id, deletedAt]
            )
            conv.unread_count = unreadResult[0].count
            validConversations.push(conv)
          }
        } else {
          // 没有删除记录，保留会话并计算未读数
          const unreadResult = await db.query(
            'SELECT COUNT(*) as count FROM messages WHERE sender_id=? AND receiver_id=? AND is_read=0',
            [conv.other_user_id, req.user.id]
          )
          conv.unread_count = unreadResult[0].count
          validConversations.push(conv)
        }
      }
      conversations = validConversations
    } catch (tableErr) {
      // 如果表不存在，使用旧的查询方式
      console.log('user_deleted_conversations表不存在，使用旧查询方式')
      conversations = await db.query(
        `SELECT 
          CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
          u.nickname as other_nickname,
          u.avatar as other_avatar,
          m.content as last_message,
          m.created_at as last_time,
          (SELECT COUNT(*) FROM messages WHERE sender_id=u.id AND receiver_id=? AND is_read=0) as unread_count,
          CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as is_blocked
         FROM messages m
         LEFT JOIN users u ON u.id = CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END
         LEFT JOIN user_blocks ub ON ub.user_id=? AND ub.blocked_user_id=u.id
         WHERE m.id IN (
           SELECT MAX(id) FROM messages 
           WHERE sender_id=? OR receiver_id=?
           GROUP BY CASE WHEN sender_id=? THEN receiver_id ELSE sender_id END
         )
         ORDER BY m.created_at DESC`,
        [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
      )
    }
    res.json(success(conversations))
  } catch (err) {
    console.error(err)
    res.json(error('获取会话列表失败'))
  }
})

router.get('/history/:userId', auth, async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId)
    
    // 检查是否屏蔽了对方
    const isBlocking = await checkIsBlocking(req.user.id, otherUserId)
    
    // 检查是否已删除该对话
    let isDeleted = false
    let deletedAt = null
    try {
      const deletedResult = await db.query(
        'SELECT deleted_at FROM user_deleted_conversations WHERE user_id=? AND other_user_id=?',
        [req.user.id, otherUserId]
      )
      isDeleted = deletedResult.length > 0
      if (isDeleted) {
        deletedAt = deletedResult[0].deleted_at
      }
    } catch (tableErr) {
      // 表不存在则默认为未删除
      isDeleted = false
    }
    
    // 查询消息，如果有删除时间，只显示删除时间之后的消息
    let messages = []
    if (deletedAt) {
      messages = await db.query(
        `SELECT m.*, s.nickname as sender_nickname, s.avatar as sender_avatar
         FROM messages m
         LEFT JOIN users s ON m.sender_id=s.id
         WHERE ((m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?))
         AND m.created_at >= ?
         ORDER BY m.created_at ASC
         LIMIT 100`,
        [req.user.id, otherUserId, otherUserId, req.user.id, deletedAt]
      )
    } else {
      messages = await db.query(
        `SELECT m.*, s.nickname as sender_nickname, s.avatar as sender_avatar
         FROM messages m
         LEFT JOIN users s ON m.sender_id=s.id
         WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
         ORDER BY m.created_at ASC
         LIMIT 100`,
        [req.user.id, otherUserId, otherUserId, req.user.id]
      )
    }

    await db.query(
      'UPDATE messages SET is_read=1 WHERE sender_id=? AND receiver_id=? AND is_read=0',
      [otherUserId, req.user.id]
    )

    res.json(success({ messages, is_blocking: isBlocking, is_deleted: isDeleted }))
  } catch (err) {
    console.error(err)
    res.json(error('获取消息记录失败'))
  }
})

router.post('/send', auth, async (req, res) => {
  try {
    if (req.user.is_banned === 1) {
      return res.json({ code: 403, msg: '你已被禁言，请联系管理员解决', data: null })
    }
    const { receiver_id, content } = req.body
    if (!receiver_id || !content || !content.trim()) {
      return res.json(error('请填写完整信息'))
    }

    const receiver = await db.query('SELECT id FROM users WHERE id=? AND status=1', [receiver_id])
    if (receiver.length === 0) {
      return res.json(error('接收者不存在'))
    }

    // 检查是否被对方屏蔽
    const isBlockedByOther = await checkBlocked(req.user.id, receiver_id)
    if (isBlockedByOther) {
      return res.json(error('你已被对方屏蔽，无法发送消息'))
    }

    // 检查是否屏蔽了对方
    const isBlocking = await checkIsBlocking(req.user.id, receiver_id)
    if (isBlocking) {
      return res.json(error('你已屏蔽对方，无法发送消息'))
    }

    const lastMsg = await db.query(
      `SELECT * FROM messages 
       WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) 
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id, receiver_id, receiver_id, req.user.id]
    )

    if (lastMsg.length > 0 && lastMsg[0].sender_id === req.user.id) {
      const hasReply = await db.query(
        `SELECT * FROM messages WHERE sender_id=? AND receiver_id=? LIMIT 1`,
        [receiver_id, req.user.id]
      )
      if (hasReply.length === 0) {
        return res.json(error('对方回复你时，你只能发送一条消息'))
      }
    }

    const result = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, receiver_id, content.trim()]
    )

    // 发送微信订阅消息提醒
    wechat.sendMessageNotification(req.user.nickname || '用户', receiver_id, content.trim())
      .catch(err => console.error('发送消息通知失败:', err))

    res.json(success({ id: result.insertId }, '发送成功'))
  } catch (err) {
    console.error(err)
    res.json(error('发送失败'))
  }
})

router.get('/unread-count', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as count 
       FROM messages m
       LEFT JOIN user_blocks ub ON ub.user_id=? AND ub.blocked_user_id=m.sender_id
       WHERE m.receiver_id=? AND m.is_read=0 AND ub.id IS NULL`,
      [req.user.id, req.user.id]
    )
    res.json(success({ count: result[0].count }))
  } catch (err) {
    res.json(error('获取未读数失败'))
  }
})

// 屏蔽用户
router.post('/block', auth, async (req, res) => {
  try {
    const { blocked_user_id } = req.body
    if (!blocked_user_id) {
      return res.json(error('请提供被屏蔽用户ID'))
    }
    
    // 检查是否已经屏蔽
    const existing = await db.query(
      'SELECT id FROM user_blocks WHERE user_id=? AND blocked_user_id=?',
      [req.user.id, blocked_user_id]
    )
    
    if (existing.length > 0) {
      return res.json(success(null, '已屏蔽'))
    }
    
    await db.query(
      'INSERT INTO user_blocks (user_id, blocked_user_id) VALUES (?, ?)',
      [req.user.id, blocked_user_id]
    )
    
    res.json(success(null, '屏蔽成功'))
  } catch (err) {
    console.error(err)
    res.json(error('屏蔽失败'))
  }
})

// 取消屏蔽
router.post('/unblock', auth, async (req, res) => {
  try {
    const { blocked_user_id } = req.body
    if (!blocked_user_id) {
      return res.json(error('请提供被屏蔽用户ID'))
    }
    
    await db.query(
      'DELETE FROM user_blocks WHERE user_id=? AND blocked_user_id=?',
      [req.user.id, blocked_user_id]
    )
    
    res.json(success(null, '取消屏蔽成功'))
  } catch (err) {
    console.error(err)
    res.json(error('取消屏蔽失败'))
  }
})

// 检查是否屏蔽了指定用户
router.get('/check-block/:userId', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const isBlocking = await checkIsBlocking(req.user.id, userId)
    res.json(success({ is_blocking: isBlocking }))
  } catch (err) {
    console.error(err)
    res.json(error('检查失败'))
  }
})

router.post('/subscribe', auth, async (req, res) => {
  try {
    let { template_id, scene = 'default' } = req.body
    
    // 如果模板ID是 'auto'，则根据场景自动选择
    if (template_id === 'auto') {
      if (scene === 'notification') {
        template_id = config.wechat.notificationTemplate
      } else if (scene === 'message') {
        template_id = config.wechat.messageTemplate
      }
    }
    
    if (!template_id) {
      return res.json(error('请提供模板ID'))
    }
    if (!req.user.openid) {
      return res.json(error('用户未绑定微信'))
    }

    const success = await wechat.addUserSubscription(
      req.user.id,
      req.user.openid,
      template_id,
      scene
    )
    if (success) {
      res.json(success(null, '订阅成功'))
    } else {
      res.json(error('订阅失败'))
    }
  } catch (err) {
    console.error(err)
    res.json(error('订阅失败'))
  }
})

router.get('/subscriptions', auth, async (req, res) => {
  try {
    const subscriptions = await wechat.getUserSubscriptions(req.user.id)
    res.json(success(subscriptions))
  } catch (err) {
    console.error(err)
    res.json(error('获取订阅失败'))
  }
})

router.delete('/subscribe/:template_id', auth, async (req, res) => {
  try {
    const templateId = req.params.template_id
    if (!templateId) {
      return res.json(error('请提供模板ID'))
    }
    if (!req.user.openid) {
      return res.json(error('用户未绑定微信'))
    }

    const success = await wechat.removeUserSubscription(
      req.user.openid,
      templateId
    )
    if (success) {
      res.json(success(null, '取消订阅成功'))
    } else {
      res.json(error('取消订阅失败'))
    }
  } catch (err) {
    console.error(err)
    res.json(error('取消订阅失败'))
  }
})

router.get('/subscribe/templates', auth, async (req, res) => {
  try {
    res.json(success({
      notification: config.wechat.notificationTemplate ? true : false,
      message: config.wechat.messageTemplate ? true : false,
      notificationTemplateId: config.wechat.notificationTemplate || '',
      messageTemplateId: config.wechat.messageTemplate || ''
    }))
  } catch (err) {
    console.error(err)
    res.json(error('获取模板配置失败'))
  }
})

// 删除对话（只删除自己看到的）
router.delete('/conversation/:otherUserId', auth, async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.otherUserId)
    if (!otherUserId) {
      return res.json(error('请提供对方用户ID'))
    }

    try {
      // 检查是否存在删除记录
      const existing = await db.query(
        'SELECT id FROM user_deleted_conversations WHERE user_id=? AND other_user_id=?',
        [req.user.id, otherUserId]
      )

      if (existing.length > 0) {
        // 更新删除时间
        await db.query(
          'UPDATE user_deleted_conversations SET deleted_at=NOW() WHERE user_id=? AND other_user_id=?',
          [req.user.id, otherUserId]
        )
      } else {
        // 插入新的删除记录
        await db.query(
          'INSERT INTO user_deleted_conversations (user_id, other_user_id) VALUES (?, ?)',
          [req.user.id, otherUserId]
        )
      }

      res.json(success(null, '删除成功'))
    } catch (tableErr) {
      // 如果表不存在，先尝试创建表
      console.log('user_deleted_conversations表不存在，尝试创建...')
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
      
      // 再执行删除操作
      await db.query(
        'INSERT INTO user_deleted_conversations (user_id, other_user_id) VALUES (?, ?)',
        [req.user.id, otherUserId]
      )
      
      res.json(success(null, '删除成功'))
    }
  } catch (err) {
    console.error(err)
    res.json(error('删除失败'))
  }
})

module.exports = router

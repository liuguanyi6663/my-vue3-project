const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error } = require('../utils/response')
const { auth } = require('../middleware/auth')

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
    const conversations = await db.query(
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
    
    const messages = await db.query(
      `SELECT m.*, s.nickname as sender_nickname, s.avatar as sender_avatar
       FROM messages m
       LEFT JOIN users s ON m.sender_id=s.id
       WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [req.user.id, otherUserId, otherUserId, req.user.id]
    )

    await db.query(
      'UPDATE messages SET is_read=1 WHERE sender_id=? AND receiver_id=? AND is_read=0',
      [otherUserId, req.user.id]
    )

    res.json(success({ messages, is_blocking: isBlocking }))
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

module.exports = router

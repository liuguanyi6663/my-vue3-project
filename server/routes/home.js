const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { auth } = require('../middleware/auth')
const { getTimeSeed } = require('../utils/date')

router.get('/timeline', async (req, res) => {
  try {
    const nodes = await db.query(
      'SELECT * FROM timeline_nodes WHERE status=1 ORDER BY sort_order ASC'
    )
    const now = getTimeSeed()
    const timeline = nodes.map(node => {
      const targetDate = new Date(node.target_date)
      const diff = targetDate - now
      let days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      if (days < 0) days = 0
      return {
        ...node,
        daysLeft: days,
        isUpcoming: diff > 0
      }
    })
    
    res.json(success(timeline))
  } catch (err) {
    res.json(error('获取时间线失败'))
  }
})

router.get('/timeline/subscribe', auth, async (req, res) => {
  try {
    const subscriptions = await db.query(
      'SELECT * FROM user_timeline_subscriptions WHERE user_id=?', [req.user.id]
    )
    res.json(success(subscriptions))
  } catch (err) {
    res.json(error('获取订阅失败'))
  }
})

router.post('/timeline/subscribe', auth, async (req, res) => {
  try {
    const { node_id, remind_3days, remind_1day, remind_today } = req.body
    await db.query(
      `INSERT INTO user_timeline_subscriptions (user_id, node_id, remind_3days, remind_1day, remind_today)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE remind_3days=?, remind_1day=?, remind_today=?`,
      [req.user.id, node_id, remind_3days || 1, remind_1day || 1, remind_today || 1,
       remind_3days || 1, remind_1day || 1, remind_today || 1]
    )
    res.json(success(null, '订阅成功'))
  } catch (err) {
    res.json(error('订阅失败'))
  }
})

router.get('/quote', async (req, res) => {
  try {
    const quotes = await db.query(
      'SELECT * FROM inspirational_quotes WHERE status=1 ORDER BY RAND() LIMIT 1'
    )
    const quote = quotes[0] || { content: '坚持就是胜利，考研必胜！' }
    res.json(success({ quote: quote.content }))
  } catch (err) {
    res.json(success({ quote: '坚持就是胜利，考研必胜！' }))
  }
})

router.get('/ads', async (req, res) => {
  try {
    const { position } = req.query
    let sql = 'SELECT * FROM ads WHERE status=1 AND (start_time IS NULL OR start_time <= NOW()) AND (end_time IS NULL OR end_time >= NOW())'
    const params = []
    if (position) {
      sql += ' AND position=?'
      params.push(position)
    }
    sql += ' ORDER BY sort_order ASC'
    
    const ads = await db.query(sql, params)
    
    if (req.query.track && req.user) {
      for (const ad of ads) {
        await db.query('UPDATE ads SET view_count=view_count+1 WHERE id=?', [ad.id])
      }
    }
    
    res.json(success(ads))
  } catch (err) {
    res.json(error('获取广告失败'))
  }
})

router.post('/ads/:id/click', async (req, res) => {
  try {
    await db.query('UPDATE ads SET click_count=click_count+1 WHERE id=?', [req.params.id])
    res.json(success(null))
  } catch (err) {
    res.json(error('记录点击失败'))
  }
})

router.get('/notifications', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const offset = (page - 1) * pageSize
    
    const limit = Number(pageSize)
    const skip = Number(offset)
    
    const list = await db.query(
      `SELECT n.*, u.nickname as publisher_name 
       FROM notifications n 
       LEFT JOIN users u ON n.publisher_id=u.id 
       WHERE n.status=1 
       ORDER BY n.is_top DESC, n.created_at DESC 
       LIMIT ${limit} OFFSET ${skip}`
    )
    
    const totalResult = await db.query('SELECT COUNT(*) as total FROM notifications WHERE status=1')
    const total = totalResult[0].total
    
    let unreadCount = 0
    if (req.user) {
      const unreadResult = await db.query(
        `SELECT COUNT(*) as count FROM notifications n 
         LEFT JOIN notification_reads nr ON n.id=nr.notification_id AND nr.user_id=?
         WHERE n.status=1 AND nr.id IS NULL`,
        [req.user.id]
      )
      unreadCount = unreadResult[0].count
    }
    
    res.json(pageSuccess(list, total, page, pageSize, { unreadCount }))
  } catch (err) {
    res.json(error('获取通知失败'))
  }
})

router.get('/notifications/:id', async (req, res) => {
  try {
    const notices = await db.query(
      `SELECT n.*, u.nickname as publisher_name 
       FROM notifications n 
       LEFT JOIN users u ON n.publisher_id=u.id 
       WHERE n.id=?`, 
      [req.params.id]
    )
    if (notices.length === 0) return res.json(error('通知不存在'))
    
    await db.query('UPDATE notifications SET view_count=view_count+1 WHERE id=?', [req.params.id])
    
    if (req.user) {
      await db.query(
        'INSERT IGNORE INTO notification_reads (user_id, notification_id) VALUES (?, ?)',
        [req.user.id, req.params.id]
      )
    }
    
    res.json(success(notices[0]))
  } catch (err) {
    res.json(error('获取通知详情失败'))
  }
})

router.post('/notifications/read-all', auth, async (req, res) => {
  try {
    const notices = await db.query('SELECT id FROM notifications WHERE status=1')
    for (const notice of notices) {
      await db.query(
        'INSERT IGNORE INTO notification_reads (user_id, notification_id) VALUES (?, ?)',
        [req.user.id, notice.id]
      )
    }
    res.json(success(null, '已全部标记为已读'))
  } catch (err) {
    res.json(error('操作失败'))
  }
})

router.get('/screens', async (req, res) => {
  try {
    const screens = await db.query('SELECT * FROM screens WHERE status=1 ORDER BY sort_order ASC, created_at DESC')
    res.json(success(screens))
  } catch (err) {
    res.json(error('获取大屏列表失败'))
  }
})

module.exports = router

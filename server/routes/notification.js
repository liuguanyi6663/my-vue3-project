const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { success, error, pageSuccess } = require('../utils/response')
const { notificationService, NOTIFICATION_TYPES } = require('../services/notification-service')

router.get('/list', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const type = req.query.type
    
    const result = await notificationService.getUserNotifications(req.user.id, page, pageSize)
    
    if (!result.success) {
      return res.json(error(result.error))
    }
    
    res.json(pageSuccess(
      result.data.list,
      result.data.total,
      result.data.page,
      result.data.pageSize
    ))
  } catch (err) {
    console.error('获取通知列表失败:', err)
    res.json(error('获取通知列表失败'))
  }
})

router.get('/unread-count', auth, async (req, res) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id)
    
    if (!result.success) {
      return res.json(error(result.error))
    }
    
    res.json(success({ count: result.count }))
  } catch (err) {
    console.error('获取未读数失败:', err)
    res.json(error('获取未读数失败'))
  }
})

router.post('/mark-read/:id', auth, async (req, res) => {
  try {
    const result = await notificationService.markAsRead(
      req.user.id,
      parseInt(req.params.id)
    )
    
    if (!result.success) {
      return res.json(error(result.error))
    }
    
    res.json(success(null, '标记成功'))
  } catch (err) {
    console.error('标记已读失败:', err)
    res.json(error('标记已读失败'))
  }
})

router.post('/mark-all-read', auth, async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id)
    
    if (!result.success) {
      return res.json(error(result.error))
    }
    
    res.json(success(null, '全部标记已读'))
  } catch (err) {
    console.error('标记全部已读失败:', err)
    res.json(error('标记全部已读失败'))
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await notificationService.deleteNotification(
      req.user.id,
      parseInt(req.params.id)
    )
    
    if (!result.success) {
      return res.json(error(result.error))
    }
    
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('删除通知失败:', err)
    res.json(error('删除通知失败'))
  }
})

router.post('/test-send', auth, async (req, res) => {
  try {
    const { type, title, content } = req.body
    
    if (!type || !title || !content) {
      return res.json(error('请填写完整信息'))
    }
    
    const result = await notificationService.createNotification(
      req.user.id,
      type,
      title,
      content
    )
    
    if (!result.success) {
      return res.json(error(result.error))
    }
    
    res.json(success({ id: result.id }, '发送成功'))
  } catch (err) {
    console.error('测试发送通知失败:', err)
    res.json(error('发送失败'))
  }
})

module.exports = router

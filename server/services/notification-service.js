const db = require('../utils/db')

const NOTIFICATION_TYPES = {
  TIMELINE_REMINDER: 'timeline_reminder',
  NEW_MESSAGE: 'new_message',
  NEW_POST: 'new_post',
  POST_REPLY: 'post_reply',
  POST_LIKE: 'post_like',
  MATERIAL_REVIEW: 'material_review',
  SYSTEM: 'system',
  AUDIT_RESULT: 'audit_result'
}

const notificationService = {
  async createNotification(userId, type, title, content, data = {}) {
    try {
      const result = await db.query(
        `INSERT INTO push_notifications 
         (user_id, type, title, content, data, is_read) 
         VALUES (?, ?, ?, ?, ?, 0)`,
        [userId, type, title, content, JSON.stringify(data)]
      )
      
      return {
        success: true,
        id: result.insertId
      }
    } catch (err) {
      console.error('创建推送通知失败:', err)
      return { success: false, error: err.message }
    }
  },

  async batchCreateNotifications(userIds, type, title, content, data = {}) {
    try {
      const values = userIds.map(userId => [
        userId, type, title, content, JSON.stringify(data), 0
      ])
      
      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(',')
      const flatValues = values.flat()
      
      await db.query(
        `INSERT INTO push_notifications 
         (user_id, type, title, content, data, is_read) 
         VALUES ${placeholders}`,
        flatValues
      )
      
      return { success: true }
    } catch (err) {
      console.error('批量创建推送通知失败:', err)
      return { success: false, error: err.message }
    }
  },

  async getUserNotifications(userId, page = 1, pageSize = 20) {
    try {
      const offset = (page - 1) * pageSize
      const list = await db.query(
        `SELECT * FROM push_notifications 
         WHERE user_id=? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, pageSize, offset]
      )
      
      const totalResult = await db.query(
        'SELECT COUNT(*) as total FROM push_notifications WHERE user_id=?',
        [userId]
      )
      
      return {
        success: true,
        data: {
          list,
          total: totalResult[0].total,
          page,
          pageSize
        }
      }
    } catch (err) {
      console.error('获取用户通知失败:', err)
      return { success: false, error: err.message }
    }
  },

  async getUnreadCount(userId) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM push_notifications WHERE user_id=? AND is_read=0',
        [userId]
      )
      
      return {
        success: true,
        count: result[0].count
      }
    } catch (err) {
      console.error('获取未读数失败:', err)
      return { success: false, error: err.message }
    }
  },

  async markAsRead(userId, notificationId) {
    try {
      await db.query(
        'UPDATE push_notifications SET is_read=1 WHERE user_id=? AND id=?',
        [userId, notificationId]
      )
      return { success: true }
    } catch (err) {
      console.error('标记已读失败:', err)
      return { success: false, error: err.message }
    }
  },

  async markAllAsRead(userId) {
    try {
      await db.query(
        'UPDATE push_notifications SET is_read=1 WHERE user_id=?',
        [userId]
      )
      return { success: true }
    } catch (err) {
      console.error('标记全部已读失败:', err)
      return { success: false, error: err.message }
    }
  },

  async deleteNotification(userId, notificationId) {
    try {
      await db.query(
        'DELETE FROM push_notifications WHERE user_id=? AND id=?',
        [userId, notificationId]
      )
      return { success: true }
    } catch (err) {
      console.error('删除通知失败:', err)
      return { success: false, error: err.message }
    }
  },

  async sendTimelineReminder(userId, node, remindType) {
    const remindTypeNames = {
      '3days': '提前3天',
      '1day': '提前1天',
      'today': '当天'
    }
    
    const title = `考研提醒：${node.name}`
    const content = `${remindTypeNames[remindType]}提醒！距离${node.name}还有${node.daysLeft || 0}天，记得做好准备哦！`
    
    return await this.createNotification(
      userId,
      NOTIFICATION_TYPES.TIMELINE_REMINDER,
      title,
      content,
      { nodeId: node.id, remindType, nodeName: node.name }
    )
  },

  async sendNewMessageNotification(receiverId, senderName, messageContent) {
    const title = '新消息通知'
    const content = `${senderName}: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`
    
    return await this.createNotification(
      receiverId,
      NOTIFICATION_TYPES.NEW_MESSAGE,
      title,
      content,
      { senderName }
    )
  },

  async sendSystemNotification(userId, title, content) {
    return await this.createNotification(
      userId,
      NOTIFICATION_TYPES.SYSTEM,
      title,
      content
    )
  },

  async sendAuditNotification(userId, auditType, status, title) {
    const statusNames = {
      'approved': '已通过',
      'rejected': '未通过',
      'pending': '待审核'
    }
    
    const notificationTitle = '审核结果通知'
    const content = `您的${title}${statusNames[status]}审核！`
    
    return await this.createNotification(
      userId,
      NOTIFICATION_TYPES.AUDIT_RESULT,
      notificationTitle,
      content,
      { auditType, status, title }
    )
  }
}

module.exports = {
  notificationService,
  NOTIFICATION_TYPES
}

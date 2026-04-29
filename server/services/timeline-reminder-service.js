const db = require('../utils/db')
const { notificationService } = require('./notification-service')

const timelineReminderService = {
  async checkAndSendReminders() {
    try {
      console.log('⏰ 开始检查时间线提醒...')
      
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      
      const activeNodes = await db.query(
        'SELECT * FROM timeline_nodes WHERE status=1'
      )
      
      for (const node of activeNodes) {
        const targetDate = new Date(node.target_date)
        const diffTime = targetDate - now
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        console.log(`检查节点: ${node.name}, 目标日期: ${node.target_date}, 剩余天数: ${diffDays}`)
        
        let remindType = null
        
        if (diffDays === 3) {
          remindType = '3days'
        } else if (diffDays === 1) {
          remindType = '1day'
        } else if (diffDays === 0) {
          remindType = 'today'
        }
        
        if (remindType) {
          await this.sendRemindersForNode(node, remindType, diffDays)
        }
      }
      
      console.log('✅ 时间线提醒检查完成')
    } catch (err) {
      console.error('❌ 检查时间线提醒失败:', err)
    }
  },

  async sendRemindersForNode(node, remindType, daysLeft) {
    try {
      const columnName = `remind_${remindType}`
      
      const subscriptions = await db.query(
        `SELECT uts.*, u.nickname 
         FROM user_timeline_subscriptions uts
         JOIN users u ON uts.user_id=u.id
         WHERE uts.node_id=? AND uts.${columnName}=1
         AND NOT EXISTS (
           SELECT 1 FROM reminder_sent_records rsr
           WHERE rsr.user_id=uts.user_id 
           AND rsr.node_id=uts.node_id 
           AND rsr.remind_type=?
           AND DATE(rsr.created_at)=CURDATE()
         )`,
        [node.id, remindType]
      )
      
      console.log(`节点 ${node.name} (${remindType}) 有 ${subscriptions.length} 个订阅需要提醒`)
      
      for (const sub of subscriptions) {
        try {
          const nodeWithDays = { ...node, daysLeft }
          await notificationService.sendTimelineReminder(sub.user_id, nodeWithDays, remindType)
          
          await db.query(
            'INSERT INTO reminder_sent_records (user_id, node_id, remind_type) VALUES (?, ?, ?)',
            [sub.user_id, node.id, remindType]
          )
          
          console.log(`✅ 已向 ${sub.nickname || sub.user_id} 发送 ${node.name} 的${remindType}提醒`)
        } catch (err) {
          console.error(`发送提醒失败 (用户 ${sub.user_id}):`, err)
        }
      }
    } catch (err) {
      console.error('发送节点提醒失败:', err)
    }
  },

  async startScheduler(intervalMinutes = 60) {
    console.log(`⏰ 定时任务已启动，每 ${intervalMinutes} 分钟检查一次提醒`)
    
    await this.checkAndSendReminders()
    
    setInterval(() => {
      this.checkAndSendReminders()
    }, intervalMinutes * 60 * 1000)
  }
}

module.exports = timelineReminderService

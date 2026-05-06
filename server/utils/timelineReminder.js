const db = require('./db')
const wechat = require('./wechat')

// 检查并发送时间线订阅提醒
async function checkTimelineReminders() {
  try {
    console.log('开始检查时间线订阅提醒...')
    
    // 获取当前日期和未来几天的日期
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    const threeDaysLater = new Date()
    threeDaysLater.setDate(today.getDate() + 3)
    const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0]
    
    const oneDayLater = new Date()
    oneDayLater.setDate(today.getDate() + 1)
    const oneDayLaterStr = oneDayLater.toISOString().split('T')[0]
    
    // 查询需要提醒的时间线节点
    const timelineNodes = await db.query(
      `SELECT tn.* 
       FROM timeline_nodes tn 
       WHERE tn.status = 1 
       AND (tn.target_date = ? OR tn.target_date = ? OR tn.target_date = ?)
       ORDER BY tn.target_date ASC`,
      [todayStr, oneDayLaterStr, threeDaysLaterStr]
    )
    
    console.log(`发现 ${timelineNodes.length} 个时间线节点需要检查提醒`)
    
    for (const node of timelineNodes) {
      // 查询订阅了该节点的用户
      const subscriptions = await db.query(
        `SELECT uts.*, u.openid, u.nickname 
         FROM user_timeline_subscriptions uts 
         JOIN users u ON uts.user_id = u.id 
         WHERE uts.node_id = ? 
         AND u.openid IS NOT NULL 
         AND u.status = 1`,
        [node.id]
      )
      
      console.log(`节点"${node.name}"有 ${subscriptions.length} 个订阅用户`)
      
      // 为每个订阅用户发送提醒
      for (const sub of subscriptions) {
        let remindType = ''
        let shouldRemind = false
        
        if (node.target_date === todayStr && sub.remind_today) {
          remindType = '今天'
          shouldRemind = true
        } else if (node.target_date === oneDayLaterStr && sub.remind_1day) {
          remindType = '明天'
          shouldRemind = true
        } else if (node.target_date === threeDaysLaterStr && sub.remind_3days) {
          remindType = '3天后'
          shouldRemind = true
        }
        
        if (shouldRemind) {
          try {
            // 发送订阅消息
            const sent = await wechat.sendSubscribeMessage(
              sub.openid,
              wechat.notificationTemplate,
              {
                thing1: { value: `考研时间线提醒` },
                thing2: { value: `${node.name} - ${remindType}就是${node.target_date}了，请做好准备！` },
                thing3: { value: '提醒' }
              },
              'pages/index/index'
            )
            
            if (sent) {
              console.log(`成功向用户 ${sub.nickname} 发送"${node.name}"提醒`)
            } else {
              console.log(`向用户 ${sub.nickname} 发送提醒失败`)
            }
          } catch (error) {
            console.error(`发送提醒给用户 ${sub.nickname} 失败:`, error)
          }
        }
      }
    }
    
    console.log('时间线提醒检查完成')
  } catch (error) {
    console.error('时间线提醒检查失败:', error)
  }
}

// 启动定时任务，每天早上9点检查一次
function startTimelineReminderJob() {
  console.log('时间线提醒定时任务已启动')
  
  // 立即执行一次
  checkTimelineReminders()
  
  // 计算距离下一个9点的时间
  function scheduleNextCheck() {
    const now = new Date()
    const nextCheck = new Date(now)
    nextCheck.setHours(9, 0, 0, 0)
    
    if (nextCheck <= now) {
      nextCheck.setDate(nextCheck.getDate() + 1)
    }
    
    const delay = nextCheck.getTime() - now.getTime()
    console.log(`下次时间线提醒检查将在 ${nextCheck.toLocaleString('zh-CN')} 执行`)
    
    setTimeout(() => {
      checkTimelineReminders()
      scheduleNextCheck() // 继续安排下一次
    }, delay)
  }
  
  scheduleNextCheck()
}

module.exports = {
  checkTimelineReminders,
  startTimelineReminderJob
}

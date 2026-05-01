const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { auth } = require('../middleware/auth')
const { getTimeSeed, getCurrentYear, getTodayStr, formatLocalDate } = require('../utils/date')

const parseDateOnly = (dateStr) => {
  const [year, month, day] = String(dateStr).split('-').map(Number)
  return new Date(year, month - 1, day)
}

const getDateDiffDays = (later, earlier) => {
  const laterDate = parseDateOnly(later)
  const earlierDate = parseDateOnly(earlier)
  return Math.round((laterDate - earlierDate) / (1000 * 60 * 60 * 24))
}

const buildStreakStats = (dateRows) => {
  const dateStrings = dateRows.map((item) => formatLocalDate(item.checkin_date))
  if (dateStrings.length === 0) {
    return { currentStreak: 0, maxStreak: 0 }
  }

  let maxStreak = 1
  let tempStreak = 1

  for (let i = 1; i < dateStrings.length; i++) {
    if (getDateDiffDays(dateStrings[i - 1], dateStrings[i]) === 1) {
      tempStreak += 1
      if (tempStreak > maxStreak) maxStreak = tempStreak
    } else {
      tempStreak = 1
    }
  }

  const today = getTodayStr()
  const dateSet = new Set(dateStrings)
  let currentStreak = 0
  let cursor = today

  while (dateSet.has(cursor)) {
    currentStreak += 1
    const cursorDate = parseDateOnly(cursor)
    cursorDate.setDate(cursorDate.getDate() - 1)
    cursor = formatLocalDate(cursorDate)
  }

  if (currentStreak === 0) {
    currentStreak = maxStreak
  }

  return { currentStreak, maxStreak }
}

router.get('/plans', auth, async (req, res) => {
  try {
    const { date } = req.query
    const planDate = date || getTodayStr()
    
    const plans = await db.query(
      'SELECT * FROM study_plans WHERE user_id=? AND plan_date=? ORDER BY priority DESC, created_at ASC',
      [req.user.id, planDate]
    )
    
    res.json(success(plans))
  } catch (err) {
    res.json(error('获取计划失败'))
  }
})

router.post('/plans', auth, async (req, res) => {
  try {
    const { subject, task_name, plan_duration, priority, plan_date } = req.body
    if (!subject || !task_name || !plan_date) {
      return res.json(error('请填写完整信息'))
    }
    
    const result = await db.query(
      'INSERT INTO study_plans (user_id, subject, task_name, plan_duration, priority, plan_date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, subject, task_name, plan_duration || 60, priority || 'medium', plan_date]
    )
    
    res.json(success({ id: result.insertId }, '创建成功'))
  } catch (err) {
    res.json(error('创建失败'))
  }
})

router.put('/plans/:id', auth, async (req, res) => {
  try {
    const { subject, task_name, plan_duration, priority, status } = req.body
    await db.query(
      'UPDATE study_plans SET subject=?, task_name=?, plan_duration=?, priority=?, status=? WHERE id=? AND user_id=?',
      [subject, task_name, plan_duration, priority, status, req.params.id, req.user.id]
    )
    res.json(success(null, '更新成功'))
  } catch (err) {
    res.json(error('更新失败'))
  }
})

router.delete('/plans/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM study_plans WHERE id=? AND user_id=?', [req.params.id, req.user.id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    res.json(error('删除失败'))
  }
})

router.post('/checkin', auth, async (req, res) => {
  try {
    const { plan_id, subject, task_name, duration, remark, mood } = req.body
    const finalSubject = subject || '每日打卡'
    const finalTaskName = task_name || '每日打卡'
    
    const today = getTodayStr()

    if (!plan_id) {
      const existing = await db.query(
        'SELECT id FROM study_checkins WHERE user_id=? AND checkin_date=? AND subject=? AND task_name=?',
        [req.user.id, today, finalSubject, finalTaskName]
      )
      if (existing.length > 0) {
        if (mood) {
          await db.query('UPDATE study_checkins SET mood=? WHERE id=?', [mood, existing[0].id])
          return res.json(success({ id: existing[0].id, updated: true }, '心情已更新'))
        }
        return res.json(error('今日已打卡'))
      }
    } else {
      const existing = await db.query(
        'SELECT id FROM study_checkins WHERE user_id=? AND checkin_date=? AND subject=? AND task_name=?',
        [req.user.id, today, finalSubject, finalTaskName]
      )
      if (existing.length > 0) {
        return res.json(error('该任务今日已打卡'))
      }
    }
    
    const result = await db.query(
      'INSERT INTO study_checkins (user_id, plan_id, subject, task_name, duration, remark, mood, checkin_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, plan_id || null, finalSubject, finalTaskName, duration || 0, remark || '', mood || null, today]
    )
    
    if (plan_id) {
      await db.query('UPDATE study_plans SET status=? WHERE id=? AND user_id=?', ['completed', plan_id, req.user.id])
    }
    
    res.json(success({ id: result.insertId }, '打卡成功'))
  } catch (err) {
    console.error(err)
    res.json(error('打卡失败'))
  }
})

router.delete('/checkin', auth, async (req, res) => {
  try {
    const { date } = req.query
    const targetDate = date || getTodayStr()
    const result = await db.query(
      'DELETE FROM study_checkins WHERE user_id=? AND checkin_date=?',
      [req.user.id, targetDate]
    )
    if (result.affectedRows > 0) {
      res.json(success({ affectedRows: result.affectedRows }, '已取消打卡'))
    } else {
      res.json(error('未找到打卡记录'))
    }
  } catch (err) {
    console.error(err)
    res.json(error('取消打卡失败'))
  }
})

router.put('/checkin/mood', auth, async (req, res) => {
  try {
    const { date, mood } = req.body
    const targetDate = date || getTodayStr()
    if (!mood) {
      return res.json(error('请选择心情'))
    }
    const existing = await db.query(
      'SELECT id FROM study_checkins WHERE user_id=? AND checkin_date=? LIMIT 1',
      [req.user.id, targetDate]
    )
    if (existing.length === 0) {
      return res.json(error('当日无打卡记录'))
    }
    await db.query('UPDATE study_checkins SET mood=? WHERE user_id=? AND checkin_date=?', [mood, req.user.id, targetDate])
    res.json(success(null, '心情已更新'))
  } catch (err) {
    console.error(err)
    res.json(error('更新心情失败'))
  }
})

router.get('/checkins', auth, async (req, res) => {
  try {
    const { year, month } = req.query
    const targetYear = year || getCurrentYear()
    const targetMonth = month || (getTimeSeed().getMonth() + 1)
    
    const checkins = await db.query(
      `SELECT checkin_date, COUNT(*) as count, MAX(mood) as mood
       FROM study_checkins 
       WHERE user_id=? AND YEAR(checkin_date)=? AND MONTH(checkin_date)=?
       GROUP BY checkin_date`,
      [req.user.id, targetYear, targetMonth]
    )
    
    const calendar = {}
    checkins.forEach(c => {
      calendar[formatLocalDate(c.checkin_date)] = { count: c.count, mood: c.mood }
    })

    const monthRecords = await db.query(
      `SELECT checkin_date, subject, task_name, duration, remark, mood
       FROM study_checkins
       WHERE user_id=? AND YEAR(checkin_date)=? AND MONTH(checkin_date)=?
       ORDER BY checkin_date DESC, created_at DESC`,
      [req.user.id, targetYear, targetMonth]
    )

    const recordsByDate = {}
    monthRecords.forEach((item) => {
      const dateKey = formatLocalDate(item.checkin_date)
      if (!recordsByDate[dateKey]) {
        recordsByDate[dateKey] = []
      }
      recordsByDate[dateKey].push({
        subject: item.subject,
        task_name: item.task_name,
        duration: item.duration,
        remark: item.remark,
        mood: item.mood
      })
    })

    const allCheckinDates = await db.query(
      'SELECT DISTINCT checkin_date FROM study_checkins WHERE user_id=? ORDER BY checkin_date DESC',
      [req.user.id]
    )

    const { currentStreak, maxStreak } = buildStreakStats(allCheckinDates)

    const stats = await db.query(
      'SELECT COUNT(DISTINCT checkin_date) as total_days, SUM(duration) as total_minutes FROM study_checkins WHERE user_id=?',
      [req.user.id]
    )
    
    res.json(success({
      calendar,
      recordsByDate,
      stats: {
        totalDays: stats[0].total_days || 0,
        totalMinutes: stats[0].total_minutes || 0,
        currentStreak,
        maxStreak: maxStreak || 0
      }
    }))
  } catch (err) {
    console.error(err)
    res.json(error('获取打卡记录失败'))
  }
})

router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        type: 'basic',
        name: '基础阶段模板',
        tasks: [
          { subject: '英语', task_name: '背单词', plan_duration: 30, priority: 'high' },
          { subject: '英语', task_name: '阅读理解', plan_duration: 60, priority: 'high' },
          { subject: '政治', task_name: '知识点学习', plan_duration: 45, priority: 'medium' },
          { subject: '数学/专业课', task_name: '基础复习', plan_duration: 120, priority: 'high' }
        ]
      },
      {
        type: 'strengthen',
        name: '强化阶段模板',
        tasks: [
          { subject: '英语', task_name: '真题阅读', plan_duration: 90, priority: 'high' },
          { subject: '英语', task_name: '作文练习', plan_duration: 45, priority: 'medium' },
          { subject: '政治', task_name: '选择题刷题', plan_duration: 60, priority: 'medium' },
          { subject: '数学/专业课', task_name: '强化复习', plan_duration: 150, priority: 'high' }
        ]
      },
      {
        type: 'sprint',
        name: '冲刺阶段模板',
        tasks: [
          { subject: '英语', task_name: '模拟考试', plan_duration: 180, priority: 'high' },
          { subject: '政治', task_name: '背诵押题', plan_duration: 90, priority: 'high' },
          { subject: '数学/专业课', task_name: '查漏补缺', plan_duration: 120, priority: 'high' },
          { subject: '综合', task_name: '错题回顾', plan_duration: 60, priority: 'medium' }
        ]
      }
    ]
    res.json(success(templates))
  } catch (err) {
    res.json(error('获取模板失败'))
  }
})

router.post('/apply-template', auth, async (req, res) => {
  try {
    const { template_type, date } = req.body
    const templatesRes = await fetch('http://localhost:3000/api/study/templates')
    const { data: templates } = await templatesRes.json()
    const template = templates.find(t => t.type === template_type)
    
    if (!template) return res.json(error('模板不存在'))
    
    const planDate = date || getTodayStr()
    
    await db.query(
      'DELETE FROM study_plans WHERE user_id=? AND plan_date=?',
      [req.user.id, planDate]
    )
    
    for (const task of template.tasks) {
      await db.query(
        'INSERT INTO study_plans (user_id, subject, task_name, plan_duration, priority, plan_date, template_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, task.subject, task.task_name, task.plan_duration, task.priority, planDate, template_type]
      )
    }
    
    res.json(success(null, '应用模板成功'))
  } catch (err) {
    res.json(error('应用模板失败'))
  }
})

router.get('/heatmap', auth, async (req, res) => {
  try {
    const now = getTimeSeed()
    const todayEnd = formatLocalDate(now)
    const currentSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const startRef = new Date(currentSunday.getFullYear(), currentSunday.getMonth(), currentSunday.getDate() - 52 * 7)
    const todayStart = formatLocalDate(startRef)

    const rows = await db.query(
      `SELECT checkin_date, COUNT(*) as count, SUM(duration) as duration
       FROM study_checkins
       WHERE user_id=? AND checkin_date BETWEEN ? AND ?
       GROUP BY checkin_date`,
      [req.user.id, todayStart, todayEnd]
    )

    const heatmap = {}
    let maxCount = 0
    rows.forEach(r => {
      const key = formatLocalDate(r.checkin_date)
      heatmap[key] = { count: r.count, duration: r.duration || 0 }
      if (r.count > maxCount) maxCount = r.count
    })

    res.json(success({ heatmap, startDate: todayStart, endDate: todayEnd, maxCount }))
  } catch (err) {
    console.error(err)
    res.json(error('获取热力图数据失败'))
  }
})

router.get('/mood-trend', auth, async (req, res) => {
  try {
    const now = getTimeSeed()
    const endDate = formatLocalDate(now)
    const startDateRef = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    const startDate = formatLocalDate(startDateRef)

    const rows = await db.query(
      `SELECT checkin_date, MAX(mood) as mood
       FROM study_checkins
       WHERE user_id=? AND checkin_date BETWEEN ? AND ? AND mood IS NOT NULL
       GROUP BY checkin_date
       ORDER BY checkin_date ASC`,
      [req.user.id, startDate, endDate]
    )

    const moodScoreMap = { happy: 5, calm: 4, anxious: 2, tired: 2, sad: 1 }
    const moodEmojiMap = { happy: '😊', calm: '😌', anxious: '😰', tired: '😫', sad: '😢' }

    const trend = []
    const cursor = new Date(startDateRef)
    const dateMoodMap = {}
    rows.forEach(r => {
      dateMoodMap[formatLocalDate(r.checkin_date)] = r.mood
    })

    for (let i = 0; i < 30; i++) {
      const dateStr = formatLocalDate(cursor)
      const mood = dateMoodMap[dateStr] || null
      trend.push({
        date: dateStr,
        mood,
        score: mood ? (moodScoreMap[mood] || 0) : 0,
        emoji: mood ? (moodEmojiMap[mood] || '') : ''
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    let lowStreak = 0
    let tempStreak = 0
    for (const item of trend) {
      if (item.mood === 'anxious' || item.mood === 'sad') {
        tempStreak++
        if (tempStreak > lowStreak) lowStreak = tempStreak
      } else if (item.mood) {
        tempStreak = 0
      }
    }

    const comfortQuotes = [
      '每一次焦虑都是成长的前奏，你比想象中更坚强 💪',
      '休息不是放弃，是为了走更远的路 🌈',
      '你已经很努力了，给自己一个拥抱吧 🤗',
      '考研路上，你不是一个人在战斗 🌟',
      '今天的疲惫，是明天上岸的基石 🏔️',
      '允许自己偶尔低落，但别忘了抬头看星空 ✨',
      '坚持到现在的你，已经赢过了大多数人 🏆'
    ]

    const needComfort = lowStreak >= 3
    const comfortQuote = needComfort ? comfortQuotes[Math.floor(Math.random() * comfortQuotes.length)] : null

    res.json(success({ trend, lowStreak, needComfort, comfortQuote }))
  } catch (err) {
    console.error(err)
    res.json(error('获取心情趋势失败'))
  }
})

module.exports = router

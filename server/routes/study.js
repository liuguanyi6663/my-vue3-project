const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { auth } = require('../middleware/auth')
const { getTimeSeed, getCurrentYear, getTodayStr } = require('../utils/date')

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
    const { plan_id, subject, task_name, duration, remark } = req.body
    if (!subject || !task_name) {
      return res.json(error('请填写科目和任务名称'))
    }
    
    const today = getTodayStr()
    const existing = await db.query(
      'SELECT * FROM study_checkins WHERE user_id=? AND checkin_date=? AND subject=? AND task_name=?',
      [req.user.id, today, subject, task_name]
    )
    
    if (existing.length > 0) {
      return res.json(error('该任务今日已打卡'))
    }
    
    const result = await db.query(
      'INSERT INTO study_checkins (user_id, plan_id, subject, task_name, duration, remark, checkin_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, plan_id || null, subject, task_name, duration || 0, remark || '', today]
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

router.get('/checkins', auth, async (req, res) => {
  try {
    const { year, month } = req.query
    const targetYear = year || getCurrentYear()
    const targetMonth = month || (getTimeSeed().getMonth() + 1)
    
    const checkins = await db.query(
      `SELECT checkin_date, COUNT(*) as count 
       FROM study_checkins 
       WHERE user_id=? AND YEAR(checkin_date)=? AND MONTH(checkin_date)=?
       GROUP BY checkin_date`,
      [req.user.id, targetYear, targetMonth]
    )
    
    const calendar = {}
    checkins.forEach(c => {
      calendar[c.checkin_date] = c.count
    })
    
    let currentStreak = 0
    let maxStreak = 0
    let tempStreak = 0
    
    const allCheckinDates = await db.query(
      'SELECT DISTINCT checkin_date FROM study_checkins WHERE user_id=? ORDER BY checkin_date DESC',
      [req.user.id]
    )
    
    for (let i = 0; i < allCheckinDates.length; i++) {
      const d = allCheckinDates[i].checkin_date
      if (i === 0) {
        const today = getTimeSeed()
        const checkDate = new Date(d)
        const diffDays = Math.floor((today - checkDate) / (1000 * 60 * 60 * 24))
        if (diffDays <= 1) {
          currentStreak = 1
          tempStreak = 1
        }
      } else {
        const prevDate = new Date(allCheckinDates[i-1].checkin_date)
        const currDate = new Date(d)
        const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          tempStreak++
          if (currentStreak > 0) currentStreak++
        } else {
          if (tempStreak > maxStreak) maxStreak = tempStreak
          tempStreak = 1
          if (i > 0 && currentStreak > maxStreak) maxStreak = currentStreak
          currentStreak = 0
        }
      }
    }
    if (tempStreak > maxStreak) maxStreak = tempStreak
    if (currentStreak > maxStreak) maxStreak = currentStreak
    
    const stats = await db.query(
      'SELECT COUNT(*) as total_days, SUM(duration) as total_minutes FROM study_checkins WHERE user_id=?',
      [req.user.id]
    )
    
    res.json(success({
      calendar,
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

module.exports = router

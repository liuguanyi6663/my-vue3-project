const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { adminAuth } = require('../middleware/auth')
const upload = require('../middleware/upload')
const { getCurrentYear } = require('../utils/date')

router.get('/users', adminAuth, async (req, res) => {
  try {
    const { keyword, role, page = 1, pageSize = 20 } = req.query
    const offset = (page - 1) * pageSize
    
    let sql = `SELECT u.id, u.openid, u.phone, u.student_id, u.nickname, u.avatar, u.college, u.major, u.target_school, u.target_major, u.exam_year, u.role, u.status, u.is_banned, u.created_at,
       kr.math_score, kr.english_score, kr.politics_score, kr.professional_score, kr.is_admitted
       FROM users u
       LEFT JOIN student_kaoyan_records kr ON kr.user_id = u.id AND kr.id = (
         SELECT id FROM student_kaoyan_records
         WHERE user_id = u.id AND status = 'approved'
         ORDER BY created_at DESC LIMIT 1
       )
       WHERE 1=1`
    const params = []
    
    if (keyword) {
      sql += ' AND (u.nickname LIKE ? OR u.student_id LIKE ? OR u.phone LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (role) {
      sql += ' AND u.role=?'
      params.push(role)
    }
    
    sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(pageSize), parseInt(offset))
    
    const list = await db.query(sql, params)
    
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1'
    const countParams = []
    if (keyword) {
      countSql += ' AND (nickname LIKE ? OR student_id LIKE ? OR phone LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (role) {
      countSql += ' AND role=?'
      countParams.push(role)
    }
    const totalResult = await db.query(countSql, countParams)
    
    res.json(pageSuccess(list, totalResult[0].total, parseInt(page), parseInt(pageSize)))
  } catch (err) {
    console.error('获取用户列表失败:', err)
    res.json(error('获取用户列表失败'))
  }
})

router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const allowedFields = ['nickname', 'phone', 'student_id', 'college', 'major', 'target_school', 'target_major', 'exam_year']
    const fields = []
    const values = []
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        fields.push(`${key}=?`)
        values.push(req.body[key])
      }
    }
    if (fields.length === 0) return res.json(error('没有需要更新的字段'))
    values.push(req.params.id)
    await db.query(`UPDATE users SET ${fields.join(',')} WHERE id=?`, values)
    res.json(success(null, '更新成功'))
  } catch (err) {
    console.error(err)
    res.json(error('更新失败'))
  }
})

router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id
    const currentUserId = req.user.id

    if (parseInt(userId) === parseInt(currentUserId)) {
      return res.json({ code: 403, msg: '不能删除自己的账号', data: null })
    }

    const user = await db.query('SELECT id FROM users WHERE id=?', [userId])
    if (user.length === 0) {
      return res.json(error('用户不存在'))
    }

    const userPosts = await db.query('SELECT id FROM forum_posts WHERE user_id=?', [userId])
    const postIds = userPosts.map(p => p.id)

    if (postIds.length > 0) {
      await db.query('DELETE FROM forum_comments WHERE post_id IN (?)', [postIds])
      await db.query('DELETE FROM forum_likes WHERE target_id IN (?) AND target_type="post"', [postIds])
      await db.query('DELETE FROM forum_favorites WHERE post_id IN (?)', [postIds])
      await db.query('DELETE FROM forum_posts WHERE id IN (?)', [postIds])
    }

    const userMaterials = await db.query('SELECT id FROM materials WHERE uploader_id=?', [userId])
    const materialIds = userMaterials.map(m => m.id)

    if (materialIds.length > 0) {
      const reviewIds = (await db.query('SELECT id FROM material_reviews WHERE material_id IN (?)', [materialIds])).map(r => r.id)
      if (reviewIds.length > 0) {
        await db.query('DELETE FROM review_likes WHERE review_id IN (?)', [reviewIds])
      }
      await db.query('DELETE FROM material_reviews WHERE material_id IN (?)', [materialIds])
      await db.query('DELETE FROM material_favorites WHERE material_id IN (?)', [materialIds])
      await db.query('DELETE FROM download_logs WHERE material_id IN (?)', [materialIds])
      await db.query('DELETE FROM materials WHERE id IN (?)', [materialIds])
    }

    await db.query('DELETE FROM forum_comments WHERE user_id=?', [userId])
    await db.query('DELETE FROM forum_likes WHERE user_id=?', [userId])
    await db.query('DELETE FROM forum_favorites WHERE user_id=?', [userId])
    await db.query('DELETE FROM material_reviews WHERE user_id=?', [userId])
    await db.query('DELETE FROM review_likes WHERE user_id=?', [userId])
    await db.query('DELETE FROM material_favorites WHERE user_id=?', [userId])
    await db.query('DELETE FROM material_folders WHERE user_id=?', [userId])
    await db.query('DELETE FROM download_logs WHERE user_id=?', [userId])
    await db.query('DELETE FROM study_checkins WHERE user_id=?', [userId])
    await db.query('DELETE FROM study_plans WHERE user_id=?', [userId])
    await db.query('DELETE FROM reports WHERE reporter_id=?', [userId])
    await db.query('DELETE FROM messages WHERE sender_id=? OR receiver_id=?', [userId, userId])
    await db.query('DELETE FROM student_kaoyan_records WHERE user_id=?', [userId])
    await db.query('DELETE FROM ai_records WHERE user_id=?', [userId])
    await db.query('DELETE FROM user_timeline_subscriptions WHERE user_id=?', [userId])
    await db.query('DELETE FROM notification_reads WHERE user_id=?', [userId])

    await db.query('DELETE FROM users WHERE id=?', [userId])

    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('删除用户失败:', err)
    res.json(error('删除失败'))
  }
})

router.put('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, is_banned, role } = req.body
    await db.query(
      'UPDATE users SET status=COALESCE(?,status), is_banned=COALESCE(?,is_banned), role=COALESCE(?,role) WHERE id=?',
      [status, is_banned, role, req.params.id]
    )
    res.json(success(null, '更新成功'))
  } catch (err) {
    res.json(error('更新失败'))
  }
})

router.get('/materials/pending', adminAuth, async (req, res) => {
  try {
    const materials = await db.query(
      `SELECT m.*, mc.name as category_name, u.nickname as uploader_name 
       FROM materials m 
       LEFT JOIN material_categories mc ON m.category_id=mc.id 
       LEFT JOIN users u ON m.uploader_id=u.id 
       WHERE m.audit_status='pending' 
       ORDER BY m.created_at DESC`
    )
    res.json(success(materials))
  } catch (err) {
    res.json(error('获取待审核资料失败'))
  }
})

router.put('/materials/:id/audit', adminAuth, async (req, res) => {
  try {
    const { audit_status } = req.body
    if (!['approved', 'rejected'].includes(audit_status)) {
      return res.json(error('无效的审核状态'))
    }
    
    await db.query(
      "UPDATE materials SET audit_status=?, status=? WHERE id=?",
      [audit_status, audit_status === 'approved' ? 1 : 0, req.params.id]
    )
    res.json(success(null, '审核成功'))
  } catch (err) {
    res.json(error('审核失败'))
  }
})

router.get('/posts/pending', adminAuth, async (req, res) => {
  try {
    const posts = await db.query(
      `SELECT p.*, u.nickname as author_name 
       FROM forum_posts p 
       LEFT JOIN users u ON p.user_id=u.id 
       WHERE p.audit_status='pending' 
       ORDER BY p.created_at DESC`
    )
    res.json(success(posts))
  } catch (err) {
    res.json(error('获取待审核帖子失败'))
  }
})

router.put('/posts/:id/audit', adminAuth, async (req, res) => {
  try {
    const { audit_status } = req.body
    await db.query(
      "UPDATE forum_posts SET audit_status=?, status=? WHERE id=?",
      [audit_status, audit_status === 'approved' ? 1 : 0, req.params.id]
    )
    res.json(success(null, '审核成功'))
  } catch (err) {
    res.json(error('审核失败'))
  }
})

router.put('/posts/:id/top', adminAuth, async (req, res) => {
  try {
    const { is_top, is_essence } = req.body
    await db.query(
      'UPDATE forum_posts SET is_top=COALESCE(?,is_top), is_essence=COALESCE(?,is_essence) WHERE id=?',
      [is_top, is_essence, req.params.id]
    )
    res.json(success(null, '操作成功'))
  } catch (err) {
    res.json(error('操作失败'))
  }
})

router.get('/reports', adminAuth, async (req, res) => {
  try {
    const { status, target_type, page = 1, pageSize = 20 } = req.query
    const pageNum = parseInt(page) || 1
    const size = parseInt(pageSize) || 20
    const offset = (pageNum - 1) * size
    
    let sql = `SELECT r.*, u.nickname as reporter_name 
       FROM reports r 
       LEFT JOIN users u ON r.reporter_id=u.id 
       WHERE 1=1`
    const params = []
    
    if (status) {
      sql += ' AND r.status=?'
      params.push(status)
    }
    if (target_type) {
      sql += ' AND r.target_type=?'
      params.push(target_type)
    }
    
    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(size), parseInt(offset))
    
    const reports = await db.query(sql, params)
    
    for (const report of reports) {
      report.target_content = null
      report.target_author = null
      
      if (report.target_type === 'review') {
        const review = await db.query(
          `SELECT r.comment, r.score, u.nickname as author_name 
           FROM material_reviews r LEFT JOIN users u ON r.user_id=u.id 
           WHERE r.id=?`,
          [report.target_id]
        )
        if (review.length > 0) {
          report.target_content = review[0].comment || `评分: ${review[0].score}分`
          report.target_author = review[0].author_name
        }
      } else if (report.target_type === 'comment') {
        const comment = await db.query(
          `SELECT c.content, u.nickname as author_name 
           FROM forum_comments c LEFT JOIN users u ON c.user_id=u.id 
           WHERE c.id=?`,
          [report.target_id]
        )
        if (comment.length > 0) {
          report.target_content = comment[0].content
          report.target_author = comment[0].author_name
        }
      } else if (report.target_type === 'post') {
        const post = await db.query(
          `SELECT p.title, p.content, u.nickname as author_name 
           FROM forum_posts p LEFT JOIN users u ON p.user_id=u.id 
           WHERE p.id=?`,
          [report.target_id]
        )
        if (post.length > 0) {
          report.target_content = post[0].title + ': ' + (post[0].content || '').substring(0, 100)
          report.target_author = post[0].author_name
        }
      } else if (report.target_type === 'material') {
        const material = await db.query(
          `SELECT m.title, u.nickname as author_name 
           FROM materials m LEFT JOIN users u ON m.uploader_id=u.id 
           WHERE m.id=?`,
          [report.target_id]
        )
        if (material.length > 0) {
          report.target_content = material[0].title
          report.target_author = material[0].author_name
        }
      }
    }
    
    let countSql = 'SELECT COUNT(*) as total FROM reports WHERE 1=1'
    const countParams = []
    if (status) {
      countSql += ' AND status=?'
      countParams.push(status)
    }
    if (target_type) {
      countSql += ' AND target_type=?'
      countParams.push(target_type)
    }
    const totalResult = await db.query(countSql, countParams)
    
    res.json(pageSuccess(reports, totalResult[0].total, pageNum, size))
  } catch (err) {
    console.error(err)
    res.json(error('获取举报列表失败'))
  }
})

router.put('/reports/:id/handle', adminAuth, async (req, res) => {
  try {
    const { status, handle_result, action } = req.body
    
    const report = await db.query('SELECT * FROM reports WHERE id=?', [req.params.id])
    if (report.length === 0) return res.json(error('举报记录不存在'))
    
    await db.query(
      'UPDATE reports SET status=?, handle_result=?, handler_id=?, handled_at=NOW() WHERE id=?',
      [status, handle_result || '', req.user.id, req.params.id]
    )
    
    if (action === 'delete_content' && status === 'processed') {
      const r = report[0]
      if (r.target_type === 'review') {
        await db.query('DELETE FROM review_likes WHERE review_id=?', [r.target_id])
        await db.query('DELETE FROM material_reviews WHERE id=?', [r.target_id])
      } else if (r.target_type === 'comment') {
        await db.query('DELETE FROM forum_likes WHERE target_id=? AND target_type="comment"', [r.target_id])
        await db.query('DELETE FROM forum_comments WHERE id=?', [r.target_id])
      } else if (r.target_type === 'post') {
        await db.query('DELETE FROM forum_comments WHERE post_id=?', [r.target_id])
        await db.query('DELETE FROM forum_likes WHERE target_id=? AND target_type="post"', [r.target_id])
        await db.query('DELETE FROM forum_favorites WHERE post_id=?', [r.target_id])
        await db.query('DELETE FROM forum_posts WHERE id=?', [r.target_id])
      } else if (r.target_type === 'material') {
        await db.query('DELETE FROM material_likes WHERE material_id=?', [r.target_id])
        await db.query('DELETE FROM material_favorites WHERE material_id=?', [r.target_id])
        await db.query('DELETE FROM material_reviews WHERE material_id=?', [r.target_id])
        await db.query('DELETE FROM download_logs WHERE material_id=?', [r.target_id])
        await db.query('DELETE FROM materials WHERE id=?', [r.target_id])
      }
    }
    
    res.json(success(null, '处理完成'))
  } catch (err) {
    console.error(err)
    res.json(error('处理失败'))
  }
})

router.get('/kaoyan-data', adminAuth, async (req, res) => {
  try {
    const { year, college } = req.query
    let sql = 'SELECT * FROM kaoyan_data WHERE 1=1'
    const params = []
    if (year) { sql += ' AND year=?'; params.push(year) }
    if (college) { sql += ' AND college=?'; params.push(college) }
    sql += ' ORDER BY year DESC, college ASC'
    
    const data = await db.query(sql, params)
    res.json(success(data))
  } catch (err) {
    res.json(error('获取考研数据失败'))
  }
})

router.post('/kaoyan-data', adminAuth, upload.single('file'), async (req, res) => {
  try {
    if (req.file) {
      res.json(success({ message: 'Excel文件已上传，请使用前端解析导入' }))
    } else {
      const { year, college, major, total_applicants, admitted_count, cross_major_count, cross_target_major, target_school } = req.body
      await db.query(
        `INSERT INTO kaoyan_data (year, college, major, total_applicants, admitted_count, cross_major_count, cross_target_major, target_school) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [year, college, major, total_applicants, admitted_count, cross_major_count, cross_target_major, target_school]
      )
      res.json(success(null, '添加成功'))
    }
  } catch (err) {
    console.error(err)
    res.json(error('添加失败'))
  }
})

router.put('/kaoyan-data/:id', adminAuth, async (req, res) => {
  try {
    const data = req.body
    const fields = []
    const values = []
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id') {
        fields.push(`${key}=?`)
        values.push(value)
      }
    }
    values.push(req.params.id)
    await db.query(`UPDATE kaoyan_data SET ${fields.join(',')} WHERE id=?`, values)
    res.json(success(null, '更新成功'))
  } catch (err) {
    res.json(error('更新失败'))
  }
})

router.delete('/kaoyan-data/:id', adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM kaoyan_data WHERE id=?', [req.params.id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    res.json(error('删除失败'))
  }
})

router.get('/public/kaoyan-data', async (req, res) => {
  try {
    const { year, college } = req.query
    
    const years = await db.query('SELECT DISTINCT year FROM kaoyan_data ORDER BY year DESC LIMIT 5')
    const targetYear = year || (years.length > 0 ? years[0].year : getCurrentYear())
    
    let overview = {}
    if (!college) {
      const schoolData = await db.query(
        'SELECT SUM(total_applicants) as applicants, SUM(admitted_count) as admitted, SUM(cross_major_count) as cross FROM kaoyan_data WHERE year=?',
        [targetYear]
      )
      const rate = schoolData[0].admitted > 0 ? ((schoolData[0].admitted / schoolData[0].applicants) * 100).toFixed(2) : 0
      const crossRate = schoolData[0].applicants > 0 ? ((schoolData[0].cross / schoolData[0].applicants) * 100).toFixed(2) : 0
      
      overview = {
        year: targetYear,
        totalApplicants: schoolData[0].applicants || 0,
        totalAdmitted: schoolData[0].admitted || 0,
        admissionRate: parseFloat(rate),
        crossMajorCount: schoolData[0].cross || 0,
        crossRate: parseFloat(crossRate)
      }
      
      const collegeData = await db.query(
        'SELECT college, SUM(total_applicants) as applicants, SUM(admitted_count) as admitted, SUM(cross_major_count) as cross FROM kaoyan_data WHERE year=? GROUP BY college',
        [targetYear]
      )
      overview.colleges = collegeData.map(c => ({
        ...c,
        admissionRate: c.applicants > 0 ? ((c.admitted / c.applicants) * 100).toFixed(2) : 0,
        crossRate: c.applicants > 0 ? ((c.cross / c.applicants) * 100).toFixed(2) : 0
      }))
    }
    
    const trendData = await db.query(
      `SELECT year, 
              SUM(total_applicants) as applicants, 
              SUM(admitted_count) as admitted, 
              SUM(cross_major_count) as cross 
       FROM kaoyan_data 
       GROUP BY year 
       ORDER BY year DESC LIMIT 3`
    )
    overview.trend = trendData.map(t => ({
      ...t,
      admissionRate: t.applicants > 0 ? ((t.admitted / t.applicants) * 100).toFixed(2) : 0,
      crossRate: t.applicants > 0 ? ((t.cross / t.applicants) * 100).toFixed(2) : 0
    }))
    
    res.json(success(overview))
  } catch (err) {
    console.error(err)
    res.json(error('获取考研数据失败'))
  }
})

router.get('/notifications', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const pageNum = parseInt(page) || 1
    const size = parseInt(pageSize) || 20
    const offset = (pageNum - 1) * size

    const list = await db.query(
      `SELECT n.*, u.nickname as publisher_name 
       FROM notifications n 
       LEFT JOIN users u ON n.publisher_id=u.id 
       ORDER BY n.is_top DESC, n.created_at DESC 
       LIMIT ? OFFSET ?`,
      [size, offset]
    )

    const totalResult = await db.query('SELECT COUNT(*) as total FROM notifications')
    
    res.json(pageSuccess(list, totalResult[0].total, pageNum, size))
  } catch (err) {
    console.error('获取通知列表失败:', err)
    res.json(error('获取通知列表失败'))
  }
})

router.post('/notifications', adminAuth, async (req, res) => {
  try {
    const { title, content, type, is_top, is_strong_remind } = req.body
    const result = await db.query(
      'INSERT INTO notifications (title, content, type, is_top, is_strong_remind, publisher_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, type || 'notice', is_top ? 1 : 0, is_strong_remind ? 1 : 0, req.user.id]
    )
    res.json(success({ id: result.insertId }, '发布成功'))
  } catch (err) {
    res.json(error('发布失败'))
  }
})

router.put('/notifications/:id', adminAuth, async (req, res) => {
  try {
    const { title, content, type, is_top, is_strong_remind, status } = req.body
    await db.query(
      'UPDATE notifications SET title=COALESCE(?,title), content=COALESCE(?,content), type=COALESCE(?,type), is_top=COALESCE(?,is_top), is_strong_remind=COALESCE(?,is_strong_remind), status=COALESCE(?,status) WHERE id=?',
      [title, content, type, is_top, is_strong_remind, status, req.params.id]
    )
    res.json(success(null, '更新成功'))
  } catch (err) {
    res.json(error('更新失败'))
  }
})

router.delete('/notifications/:id', adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE id=?', [req.params.id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    res.json(error('删除失败'))
  }
})

router.post('/ads', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, link_url, link_type, position, sort_order, start_time, end_time } = req.body
    if (!req.file) return res.json(error('请上传广告图片'))
    
    const result = await db.query(
      'INSERT INTO ads (title, image_url, link_url, link_type, position, sort_order, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title || '', '/uploads/' + req.file.filename, link_url || '', link_type || 'page', position || 'banner', sort_order || 0, start_time || null, end_time || null]
    )
    res.json(success({ id: result.insertId }, '添加成功'))
  } catch (err) {
    res.json(error('添加失败'))
  }
})

router.put('/ads/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const data = req.body
    if (req.file) {
      data.image_url = '/uploads/' + req.file.filename
    }
    const fields = []
    const values = []
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key}=?`)
      values.push(value)
    }
    values.push(req.params.id)
    await db.query(`UPDATE ads SET ${fields.join(',')} WHERE id=?`, values)
    res.json(success(null, '更新成功'))
  } catch (err) {
    res.json(error('更新失败'))
  }
})

router.put('/ads/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body
    await db.query('UPDATE ads SET status=? WHERE id=?', [status, req.params.id])
    res.json(success(null, '操作成功'))
  } catch (err) {
    res.json(error('操作失败'))
  }
})

// 大屏管理
router.get('/screens', adminAuth, async (req, res) => {
  try {
    const screens = await db.query('SELECT * FROM screens ORDER BY sort_order ASC, created_at DESC')
    res.json(success(screens))
  } catch (err) {
    res.json(error('获取大屏列表失败'))
  }
})

router.post('/screens', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, sort_order } = req.body
    if (!req.file) return res.json(error('请上传图片'))
    
    const result = await db.query(
      'INSERT INTO screens (name, image_url, sort_order) VALUES (?, ?, ?)',
      [name || '', '/uploads/' + req.file.filename, sort_order || 0]
    )
    res.json(success({ id: result.insertId }, '添加成功'))
  } catch (err) {
    res.json(error('添加失败'))
  }
})

router.put('/screens/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const data = req.body
    if (req.file) {
      data.image_url = '/uploads/' + req.file.filename
    }
    const fields = []
    const values = []
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key}=?`)
      values.push(value)
    }
    values.push(req.params.id)
    await db.query(`UPDATE screens SET ${fields.join(',')} WHERE id=?`, values)
    res.json(success(null, '更新成功'))
  } catch (err) {
    res.json(error('更新失败'))
  }
})

router.put('/screens/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body
    await db.query('UPDATE screens SET status=? WHERE id=?', [status, req.params.id])
    res.json(success(null, '操作成功'))
  } catch (err) {
    res.json(error('操作失败'))
  }
})

router.delete('/screens/:id', adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM screens WHERE id=?', [req.params.id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    res.json(error('删除失败'))
  }
})

router.get('/ai-usage', adminAuth, async (req, res) => {
  try {
    const usage = await db.query(
      `SELECT u.nickname, u.student_id, COUNT(*) as usage_count, 
              SUM(CASE WHEN a.status='success' THEN 1 ELSE 0 END) as success_count,
              AVG(CASE WHEN a.score IS NOT NULL THEN a.score ELSE NULL END) as avg_score
       FROM ai_records a 
       LEFT JOIN users u ON a.user_id=u.id 
       GROUP BY a.user_id 
       ORDER BY usage_count DESC 
       LIMIT 50`
    )
    res.json(success(usage))
  } catch (err) {
    res.json(error('获取AI使用统计失败'))
  }
})

router.get('/interview-audit/list', adminAuth, async (req, res) => {
  try {
    const { status, category, page = 1, pageSize = 20 } = req.query
    const pageNum = parseInt(page) || 1
    const size = parseInt(pageSize) || 20
    const offset = (pageNum - 1) * size

    let allItems = []

    if (!category || category === 'oral') {
      let oralSql = `SELECT oq.*, u.nickname as uploader_name, 'oral' as _type FROM oral_questions_user oq LEFT JOIN users u ON oq.user_id=u.id WHERE 1=1`
      const oralParams = []
      if (status) { oralSql += ' AND oq.audit_status=?'; oralParams.push(status) }
      oralSql += ' ORDER BY oq.created_at DESC'
      const oralItems = await db.query(oralSql, oralParams)
      allItems = allItems.concat(oralItems)
    }

    if (!category || category === 'resume') {
      let resumeSql = `SELECT rt.*, u.nickname as uploader_name, 'resume' as _type FROM resume_templates_user rt LEFT JOIN users u ON rt.user_id=u.id WHERE 1=1`
      const resumeParams = []
      if (status) { resumeSql += ' AND rt.audit_status=?'; resumeParams.push(status) }
      resumeSql += ' ORDER BY rt.created_at DESC'
      const resumeItems = await db.query(resumeSql, resumeParams)
      allItems = allItems.concat(resumeItems)
    }

    if (!category || category === 'email') {
      let emailSql = `SELECT et.*, u.nickname as uploader_name, 'email' as _type FROM email_templates_user et LEFT JOIN users u ON et.user_id=u.id WHERE 1=1`
      const emailParams = []
      if (status) { emailSql += ' AND et.audit_status=?'; emailParams.push(status) }
      emailSql += ' ORDER BY et.created_at DESC'
      const emailItems = await db.query(emailSql, emailParams)
      allItems = allItems.concat(emailItems)
    }

    allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const total = allItems.length
    const pagedItems = allItems.slice(offset, offset + size)

    res.json(pageSuccess(pagedItems, total, pageNum, size))
  } catch (err) {
    console.error('获取复试资料审批列表失败:', err)
    res.json(error('获取审批列表失败'))
  }
})

router.get('/interview-audit/stats', adminAuth, async (req, res) => {
  try {
    const tables = ['oral_questions_user', 'resume_templates_user', 'email_templates_user']
    let pending = 0, approved = 0, rejected = 0

    for (const table of tables) {
      const counts = await db.query(
        `SELECT audit_status, COUNT(*) as cnt FROM ${table} GROUP BY audit_status`
      )
      for (const row of counts) {
        if (row.audit_status === 'pending') pending += row.cnt
        else if (row.audit_status === 'approved') approved += row.cnt
        else if (row.audit_status === 'rejected') rejected += row.cnt
      }
    }

    res.json(success({ pending, approved, rejected }))
  } catch (err) {
    console.error('获取复试资料审批统计失败:', err)
    res.json(error('获取统计失败'))
  }
})

router.put('/interview-audit/:type/:id', adminAuth, async (req, res) => {
  try {
    const { type, id } = req.params
    const { audit_status } = req.body

    if (!['approved', 'rejected'].includes(audit_status)) {
      return res.json(error('无效的审核状态'))
    }

    const tableMap = {
      oral: 'oral_questions_user',
      resume: 'resume_templates_user',
      email: 'email_templates_user'
    }

    const tableName = tableMap[type]
    if (!tableName) {
      return res.json(error('无效的资料类型'))
    }

    await db.query(
      `UPDATE ${tableName} SET audit_status=? WHERE id=?`,
      [audit_status, id]
    )
    res.json(success(null, '审核成功'))
  } catch (err) {
    console.error('审核复试资料失败:', err)
    res.json(error('审核失败'))
  }
})

module.exports = router

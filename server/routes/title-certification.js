const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { auth, adminAuth } = require('../middleware/auth')
const upload = require('../middleware/upload')

router.post('/apply', auth, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json(error('请上传上岸截图'))
    }

    const { description } = req.body
    const screenshotUrl = '/uploads/' + req.file.filename

    const existing = await db.query(
      "SELECT id FROM title_certifications WHERE user_id=? AND status='pending'",
      [req.user.id]
    )
    if (existing.length > 0) {
      return res.json(error('您已有待审核的申请，请等待审核'))
    }

    const landed = await db.query('SELECT is_landed FROM users WHERE id=?', [req.user.id])
    if (landed.length > 0 && landed[0].is_landed === 1) {
      return res.json(error('您已获得"已上岸"头衔认证'))
    }

    const result = await db.query(
      'INSERT INTO title_certifications (user_id, screenshot, description) VALUES (?, ?, ?)',
      [req.user.id, screenshotUrl, description || null]
    )

    res.json(success({ id: result.insertId }, '申请提交成功，请等待审核'))
  } catch (err) {
    console.error('提交头衔认证申请失败:', err)
    res.json(error('提交申请失败'))
  }
})

router.get('/my', auth, async (req, res) => {
  try {
    const records = await db.query(
      'SELECT * FROM title_certifications WHERE user_id=? ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(success(records))
  } catch (err) {
    console.error('获取认证记录失败:', err)
    res.json(error('获取认证记录失败'))
  }
})

router.get('/status', auth, async (req, res) => {
  try {
    const user = await db.query('SELECT is_landed FROM users WHERE id=?', [req.user.id])
    const pending = await db.query(
      "SELECT id FROM title_certifications WHERE user_id=? AND status='pending'",
      [req.user.id]
    )
    res.json(success({
      is_landed: user.length > 0 ? user[0].is_landed : 0,
      has_pending: pending.length > 0
    }))
  } catch (err) {
    console.error('获取认证状态失败:', err)
    res.json(error('获取认证状态失败'))
  }
})

router.get('/list', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query
    const pageNum = parseInt(page) || 1
    const size = parseInt(pageSize) || 20
    const offset = (pageNum - 1) * size

    let sql = `SELECT tc.*, u.nickname, u.avatar, u.college, u.major, u.student_id
       FROM title_certifications tc
       LEFT JOIN users u ON tc.user_id=u.id
       WHERE 1=1`
    const params = []

    if (status) {
      sql += ' AND tc.status=?'
      params.push(status)
    }

    sql += ' ORDER BY tc.created_at DESC LIMIT ? OFFSET ?'
    params.push(size, offset)

    const list = await db.query(sql, params)

    let countSql = 'SELECT COUNT(*) as total FROM title_certifications WHERE 1=1'
    const countParams = []
    if (status) {
      countSql += ' AND status=?'
      countParams.push(status)
    }
    const totalResult = await db.query(countSql, countParams)

    res.json(pageSuccess(list, totalResult[0].total, pageNum, size))
  } catch (err) {
    console.error('获取头衔认证列表失败:', err)
    res.json(error('获取列表失败'))
  }
})

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const counts = await db.query(
      "SELECT status, COUNT(*) as cnt FROM title_certifications GROUP BY status"
    )
    let pending = 0, approved = 0, rejected = 0
    for (const row of counts) {
      if (row.status === 'pending') pending = row.cnt
      else if (row.status === 'approved') approved = row.cnt
      else if (row.status === 'rejected') rejected = row.cnt
    }
    res.json(success({ pending, approved, rejected }))
  } catch (err) {
    console.error('获取头衔认证统计失败:', err)
    res.json(error('获取统计失败'))
  }
})

router.put('/audit/:id', adminAuth, async (req, res) => {
  try {
    const { status, review_remark } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.json(error('无效的审核状态'))
    }

    const record = await db.query('SELECT * FROM title_certifications WHERE id=?', [req.params.id])
    if (record.length === 0) {
      return res.json(error('认证记录不存在'))
    }

    if (record[0].status !== 'pending') {
      return res.json(error('该申请已被审核'))
    }

    await db.query(
      'UPDATE title_certifications SET status=?, reviewer_id=?, review_remark=?, reviewed_at=NOW() WHERE id=?',
      [status, req.user.id, review_remark || null, req.params.id]
    )

    if (status === 'approved') {
      await db.query('UPDATE users SET is_landed=1 WHERE id=?', [record[0].user_id])
    }

    res.json(success(null, status === 'approved' ? '已通过审核，用户获得"已上岸"头衔' : '已拒绝该申请'))
  } catch (err) {
    console.error('审核头衔认证失败:', err)
    res.json(error('审核失败'))
  }
})

router.put('/revoke/:userId', adminAuth, async (req, res) => {
  try {
    await db.query('UPDATE users SET is_landed=0 WHERE id=?', [req.params.userId])
    res.json(success(null, '已撤销该用户的"已上岸"头衔'))
  } catch (err) {
    console.error('撤销头衔失败:', err)
    res.json(error('撤销失败'))
  }
})

module.exports = router

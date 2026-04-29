const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { auth, adminAuth } = require('../middleware/auth')

router.post('/submit', auth, async (req, res) => {
  try {
    const { content } = req.body
    if (!content || !content.trim()) {
      return res.json(error('反馈内容不能为空'))
    }

    const result = await db.query(
      'INSERT INTO feedbacks (user_id, content) VALUES (?, ?)',
      [req.user.id, content.trim()]
    )

    res.json(success({ id: result.insertId }, '提交成功'))
  } catch (err) {
    console.error('提交意见反馈失败:', err)
    res.json(error('提交失败'))
  }
})

router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const pageNum = parseInt(page, 10) || 1
    const size = parseInt(pageSize, 10) || 20
    const offset = (pageNum - 1) * size

    const list = await db.query(
      `SELECT f.*, u.nickname AS handler_name
       FROM feedbacks f
       LEFT JOIN users u ON f.handler_id = u.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, size, offset]
    )

    const totalResult = await db.query(
      'SELECT COUNT(*) AS total FROM feedbacks WHERE user_id = ?',
      [req.user.id]
    )

    res.json(pageSuccess(list, totalResult[0].total, pageNum, size))
  } catch (err) {
    console.error('获取我的反馈失败:', err)
    res.json(error('获取失败'))
  }
})

router.get('/list', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query
    const pageNum = parseInt(page, 10) || 1
    const size = parseInt(pageSize, 10) || 20
    const offset = (pageNum - 1) * size

    let sql = `SELECT f.*, u.nickname AS user_name, u.student_id, u.college, u.major,
               h.nickname AS handler_name
               FROM feedbacks f
               LEFT JOIN users u ON f.user_id = u.id
               LEFT JOIN users h ON f.handler_id = h.id
               WHERE 1 = 1`
    const params = []

    if (status) {
      sql += ' AND f.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?'
    params.push(size, offset)

    const list = await db.query(sql, params)

    let countSql = 'SELECT COUNT(*) AS total FROM feedbacks WHERE 1 = 1'
    const countParams = []
    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }

    const totalResult = await db.query(countSql, countParams)
    res.json(pageSuccess(list, totalResult[0].total, pageNum, size))
  } catch (err) {
    console.error('获取意见反馈列表失败:', err)
    res.json(error('获取失败'))
  }
})

const saveFeedbackHandle = async (req, res) => {
  try {
    const nextStatus = req.body.status || 'processed'
    const handleResult = typeof req.body.handle_result === 'string'
      ? req.body.handle_result
      : ''

    if (!['pending', 'processed'].includes(nextStatus)) {
      return res.json(error('无效的处理状态'))
    }

    const feedback = await db.query('SELECT * FROM feedbacks WHERE id = ?', [req.params.id])
    if (feedback.length === 0) {
      return res.json(error('反馈记录不存在'))
    }

    if (nextStatus === 'processed') {
      await db.query(
        'UPDATE feedbacks SET status = ?, handle_result = ?, handler_id = ?, handled_at = NOW() WHERE id = ?',
        [nextStatus, handleResult, req.user.id, req.params.id]
      )
    } else {
      await db.query(
        'UPDATE feedbacks SET status = ?, handle_result = ?, handler_id = NULL, handled_at = NULL WHERE id = ?',
        [nextStatus, handleResult, req.params.id]
      )
    }

    res.json(success(null, '处理成功'))
  } catch (err) {
    console.error('处理意见反馈失败:', err)
    res.json(error('处理失败'))
  }
}

router.put('/:id/handle', adminAuth, saveFeedbackHandle)
router.post('/:id/handle', adminAuth, saveFeedbackHandle)

router.delete('/:id', auth, async (req, res) => {
  try {
    const feedback = await db.query(
      'SELECT * FROM feedbacks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (feedback.length === 0) {
      return res.json(error('反馈记录不存在或无权删除'))
    }

    await db.query('DELETE FROM feedbacks WHERE id = ?', [req.params.id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('删除反馈失败:', err)
    res.json(error('删除失败'))
  }
})

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const pendingResult = await db.query(
      "SELECT COUNT(*) AS count FROM feedbacks WHERE status = 'pending'"
    )
    const processedResult = await db.query(
      "SELECT COUNT(*) AS count FROM feedbacks WHERE status = 'processed'"
    )
    const totalResult = await db.query(
      'SELECT COUNT(*) AS count FROM feedbacks'
    )

    res.json(success({
      pending: pendingResult[0].count,
      processed: processedResult[0].count,
      total: totalResult[0].count
    }))
  } catch (err) {
    console.error('获取反馈统计失败:', err)
    res.json(error('获取统计失败'))
  }
})

module.exports = router

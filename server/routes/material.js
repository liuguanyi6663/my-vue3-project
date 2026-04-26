const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { auth, optionalAuth } = require('../middleware/auth')
const upload = require('../middleware/upload')

const getStoredFileType = (file) => {
  const ext = path.extname(file.originalname || '').toLowerCase().replace('.', '')
  if (ext) return ext

  const mime = (file.mimetype || '').toLowerCase()
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  }

  return mimeMap[mime] || 'unknown'
}

const normalizeYear = (year) => {
  if (year === undefined || year === null) return null

  const value = String(year).trim()
  if (!value) return null
  if (!/^\d{4}$/.test(value)) return null

  const num = Number(value)
  if (num < 1901 || num > 2155) return null

  return num
}

router.get('/categories', async (req, res) => {
  try {
    const { type, college } = req.query
    let sql = 'SELECT * FROM material_categories WHERE status=1 AND parent_id=0'
    const params = []
    
    if (type) {
      sql += ' AND type=?'
      params.push(type)
    }
    if (college) {
      sql += ' AND college=?'
      params.push(college)
    }
    
    sql += ' ORDER BY sort_order ASC'
    const categories = await db.query(sql, params)
    
    for (const cat of categories) {
      const children = await db.query(
        'SELECT * FROM material_categories WHERE parent_id=? AND status=1 ORDER BY sort_order ASC',
        [cat.id]
      )
      cat.children = children
    }
    
    res.json(success(categories))
  } catch (err) {
    res.json(error('获取分类失败'))
  }
})

router.get('/list', async (req, res) => {
  try {
    const { category_id, keyword, page = 1, pageSize = 10, sort = 'created_at' } = req.query
    const pageNum = parseInt(page) || 1
    const size = parseInt(pageSize) || 10
    const offset = (pageNum - 1) * size
    
    let sql = `SELECT m.*, mc.name as category_name, u.nickname as uploader_name 
               FROM materials m 
               LEFT JOIN material_categories mc ON m.category_id=mc.id 
               LEFT JOIN users u ON m.uploader_id=u.id 
               WHERE m.audit_status='approved' AND m.status=1`
    const listParams = []

    if (category_id) {
      sql += ' AND m.category_id=?'
      listParams.push(category_id)
    }
    if (keyword) {
      sql += ' AND (m.title LIKE ? OR m.description LIKE ?)'
      listParams.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    const sortOrder = sort === 'download_count' ? 'm.download_count DESC' : 
                      sort === 'like_count' ? 'm.like_count DESC' : 
                      'm.created_at DESC'
    sql += ` ORDER BY ${sortOrder} LIMIT ? OFFSET ?`
    listParams.push(size, offset)

    const list = await db.query(sql, listParams)
    
    let countSql = `SELECT COUNT(*) as total FROM materials m WHERE m.audit_status='approved' AND m.status=1`
    const countParams = []
    if (category_id) {
      countSql += ' AND m.category_id=?'
      countParams.push(category_id)
    }
    if (keyword) {
      countSql += ' AND (m.title LIKE ? OR m.description LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`)
    }
    const totalResult = await db.query(countSql, countParams)
    
    res.json(pageSuccess(list, totalResult[0].total, parseInt(page), parseInt(pageSize)))
  } catch (err) {
    console.error(err)
    res.json(error('获取资料列表失败'))
  }
})

router.get('/detail/:id', optionalAuth, async (req, res) => {
  try {
    const materials = await db.query(
      `SELECT m.*, mc.name as category_name, u.nickname as uploader_name 
       FROM materials m 
       LEFT JOIN material_categories mc ON m.category_id=mc.id 
       LEFT JOIN users u ON m.uploader_id=u.id 
       WHERE m.id=?`,
      [req.params.id]
    )
    
    if (materials.length === 0) return res.json(error('资料不存在'))
    
    await db.query('UPDATE materials SET view_count=view_count+1 WHERE id=?', [req.params.id])
    
    const material = materials[0]
    
    const reviews = await db.query(
      `SELECT r.*, u.nickname, u.avatar
       FROM material_reviews r
       LEFT JOIN users u ON r.user_id=u.id
       WHERE r.material_id=? AND r.parent_id=0
       ORDER BY r.created_at DESC LIMIT 50`,
      [req.params.id]
    )

    if (req.user) {
      for (const review of reviews) {
        const likeRecord = await db.query(
          'SELECT * FROM review_likes WHERE user_id=? AND review_id=?',
          [req.user.id, review.id]
        )
        review.isLiked = likeRecord.length > 0

        const replyCount = await db.query(
          'SELECT COUNT(*) as cnt FROM material_reviews WHERE parent_id=?',
          [review.id]
        )
        review.total_replies = replyCount[0].cnt

        const replies = await db.query(
          `SELECT r.*, u.nickname, u.avatar,
           ru.nickname as reply_to_nickname
           FROM material_reviews r
           LEFT JOIN users u ON r.user_id=u.id
           LEFT JOIN users ru ON r.reply_to_user_id=ru.id
           WHERE r.parent_id=?
           ORDER BY r.created_at ASC LIMIT 20`,
          [review.id]
        )
        for (const reply of replies) {
          const replyLike = await db.query(
            'SELECT * FROM review_likes WHERE user_id=? AND review_id=?',
            [req.user.id, reply.id]
          )
          reply.isLiked = replyLike.length > 0
        }
        review.replies = replies
      }
    } else {
      for (const review of reviews) {
        const replyCount = await db.query(
          'SELECT COUNT(*) as cnt FROM material_reviews WHERE parent_id=?',
          [review.id]
        )
        review.total_replies = replyCount[0].cnt

        const replies = await db.query(
          `SELECT r.*, u.nickname, u.avatar,
           ru.nickname as reply_to_nickname
           FROM material_reviews r
           LEFT JOIN users u ON r.user_id=u.id
           LEFT JOIN users ru ON r.reply_to_user_id=ru.id
           WHERE r.parent_id=?
           ORDER BY r.created_at ASC LIMIT 20`,
          [review.id]
        )
        for (const reply of replies) {
          reply.isLiked = false
        }
        review.replies = replies
      }
    }
    
    material.reviews = reviews
    
    let isFavorited = false
    let isLiked = false
    if (req.user) {
      const fav = await db.query(
        'SELECT * FROM material_favorites WHERE user_id=? AND material_id=?',
        [req.user.id, req.params.id]
      )
      isFavorited = fav.length > 0
      
      const like = await db.query(
        'SELECT * FROM material_likes WHERE user_id=? AND material_id=?',
        [req.user.id, req.params.id]
      )
      isLiked = like.length > 0
    }
    material.isFavorited = isFavorited
    material.isLiked = isLiked
    
    res.json(success(material))
  } catch (err) {
    res.json(error('获取资料详情失败'))
  }
})

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { category_id, title, description, year } = req.body
    if (!category_id || !title || !req.file) {
      return res.json(error('请填写完整信息并上传文件'))
    }

    const fileType = getStoredFileType(req.file)
    const normalizedYear = normalizeYear(year)
    
    console.log('资料上传请求:', {
      userId: req.user && req.user.id,
      category_id,
      title,
      year,
      normalizedYear,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileType
      } : null
    })

    const result = await db.query(
      `INSERT INTO materials (category_id, title, description, file_name, file_path, file_size, file_type, uploader_id, year, audit_status, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1)`,
      [category_id, title, description || '', req.file.originalname, '/uploads/' + req.file.filename,
       req.file.size, fileType, req.user.id, normalizedYear]
    )
    
    res.json(success({ id: result.insertId }, '上传成功'))
  } catch (err) {
    console.error('资料上传失败:', err)
    res.json(error(err.message || '上传失败'))
  }
})

router.get('/download/:id', auth, async (req, res) => {
  try {
    const materials = await db.query('SELECT * FROM materials WHERE id=? AND audit_status="approved" AND status=1', [req.params.id])
    if (materials.length === 0) return res.status(404).json(error('资料不存在或未审核通过'))
    
    const material = materials[0]
    
    const filePath = path.join(__dirname, '..', material.file_path)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(error('文件不存在'))
    }
    
    await db.query('UPDATE materials SET download_count=download_count+1 WHERE id=?', [req.params.id])
    await db.query(
      'INSERT INTO download_logs (user_id, material_id) VALUES (?, ?)',
      [req.user.id, req.params.id]
    )
    
    res.download(filePath, material.file_name)
  } catch (err) {
    console.error(err)
    res.status(500).json(error('下载失败'))
  }
})

router.post('/:id/review', auth, async (req, res) => {
  try {
    const { score, comment, parent_id, reply_to_user_id } = req.body
    const materialId = req.params.id
    const parentId = parent_id || 0

    if (parentId === 0) {
      if (!score || score < 1 || score > 5) {
        return res.json(error('请输入1-5的评分'))
      }
    }

    if (!comment || comment.trim() === '') {
      return res.json(error('请输入评论内容'))
    }

    let replyToUserId = 0
    if (parentId !== 0) {
      if (reply_to_user_id) {
        replyToUserId = reply_to_user_id
      } else {
        const parentReview = await db.query('SELECT user_id FROM material_reviews WHERE id=?', [parentId])
        replyToUserId = parentReview.length > 0 ? parentReview[0].user_id : 0
      }
    }

    const result = await db.query(
      'INSERT INTO material_reviews (material_id, user_id, parent_id, reply_to_user_id, score, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [materialId, req.user.id, parentId, replyToUserId, parentId === 0 ? score : null, comment.trim()]
    )

    if (parentId === 0) {
      const avgResult = await db.query(
        'SELECT AVG(score) as avg, COUNT(*) as cnt FROM material_reviews WHERE material_id=? AND parent_id=0',
        [materialId]
      )
      const rawAvg = parseFloat(avgResult[0].avg) || 0
      await db.query(
        'UPDATE materials SET avg_score=?, review_count=? WHERE id=?',
        [rawAvg.toFixed(1), avgResult[0].cnt, materialId]
      )
    } else {
      await db.query(
        'UPDATE material_reviews SET reply_count=reply_count+1 WHERE id=?',
        [parentId]
      )
    }

    res.json(success({ id: result.insertId }, parentId === 0 ? '评价成功' : '回复成功'))
  } catch (err) {
    console.error(err)
    res.json(error('评论失败'))
  }
})

router.post('/reviews/:reviewId/like', auth, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT * FROM review_likes WHERE user_id=? AND review_id=?',
      [req.user.id, req.params.reviewId]
    )
    
    if (existing.length > 0) {
      await db.query('DELETE FROM review_likes WHERE id=?', [existing[0].id])
      await db.query('UPDATE material_reviews SET like_count=GREATEST(like_count-1,0) WHERE id=?', [req.params.reviewId])
      const row = await db.query('SELECT like_count FROM material_reviews WHERE id=?', [req.params.reviewId])
      res.json(success({ isLiked: false, likeCount: row[0].like_count }, '已取消点赞'))
    } else {
      const review = await db.query('SELECT * FROM material_reviews WHERE id=?', [req.params.reviewId])
      if (review.length === 0) return res.json(error('评论不存在'))
      
      await db.query(
        'INSERT INTO review_likes (user_id, review_id) VALUES (?, ?)',
        [req.user.id, req.params.reviewId]
      )
      await db.query('UPDATE material_reviews SET like_count=like_count+1 WHERE id=?', [req.params.reviewId])
      const row = await db.query('SELECT like_count FROM material_reviews WHERE id=?', [req.params.reviewId])
      res.json(success({ isLiked: true, likeCount: row[0].like_count }, '点赞成功'))
    }
  } catch (err) {
    console.error(err)
    res.json(error('操作失败'))
  }
})

router.post('/reviews/:reviewId/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body
    if (!reason) {
      return res.json(error('请选择举报原因'))
    }
    
    const review = await db.query('SELECT * FROM material_reviews WHERE id=?', [req.params.reviewId])
    if (review.length === 0) return res.json(error('评论不存在'))
    
    await db.query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason, description) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'review', req.params.reviewId, reason, description || '']
    )
    
    res.json(success(null, '举报成功，我们会尽快处理'))
  } catch (err) {
    console.error(err)
    res.json(error('举报失败'))
  }
})

router.delete('/reviews/:reviewId', auth, async (req, res) => {
  try {
    const review = await db.query('SELECT * FROM material_reviews WHERE id=?', [req.params.reviewId])
    if (review.length === 0) return res.json(error('评论不存在'))

    const r = review[0]
    if (r.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.json(error('只能删除自己的评论'))
    }

    if (r.parent_id === 0) {
      await db.query('DELETE FROM review_likes WHERE review_id IN (SELECT id FROM material_reviews WHERE parent_id=?)', [r.id])
      await db.query('DELETE FROM material_reviews WHERE parent_id=?', [r.id])
      await db.query('DELETE FROM review_likes WHERE review_id=?', [r.id])
      await db.query('DELETE FROM reports WHERE target_type="review" AND target_id=?', [r.id])
      await db.query('DELETE FROM material_reviews WHERE id=?', [r.id])

      const avgResult = await db.query(
        'SELECT AVG(score) as avg, COUNT(*) as cnt FROM material_reviews WHERE material_id=? AND parent_id=0',
        [r.material_id]
      )
      const rawAvg = parseFloat(avgResult[0].avg) || 0
      await db.query(
        'UPDATE materials SET avg_score=?, review_count=? WHERE id=?',
        [rawAvg.toFixed(1), avgResult[0].cnt, r.material_id]
      )
    } else {
      await db.query('DELETE FROM review_likes WHERE review_id=?', [r.id])
      await db.query('DELETE FROM reports WHERE target_type="review" AND target_id=?', [r.id])
      await db.query('DELETE FROM material_reviews WHERE id=?', [r.id])
      await db.query(
        'UPDATE material_reviews SET reply_count=GREATEST(reply_count-1,0) WHERE id=?',
        [r.parent_id]
      )
    }

    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error(err)
    res.json(error('删除失败'))
  }
})

router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT * FROM material_favorites WHERE user_id=? AND material_id=?',
      [req.user.id, req.params.id]
    )
    
    if (existing.length > 0) {
      await db.query('DELETE FROM material_favorites WHERE id=?', [existing[0].id])
      res.json(success({ isFavorite: false }, '已取消收藏'))
    } else {
      await db.query(
        'INSERT INTO material_favorites (user_id, material_id) VALUES (?, ?)',
        [req.user.id, req.params.id]
      )
      res.json(success({ isFavorite: true }, '收藏成功'))
    }
  } catch (err) {
    res.json(error('操作失败'))
  }
})

router.post('/:id/like', auth, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT * FROM material_likes WHERE user_id=? AND material_id=?',
      [req.user.id, req.params.id]
    )
    
    if (existing.length > 0) {
      await db.query('DELETE FROM material_likes WHERE id=?', [existing[0].id])
      await db.query('UPDATE materials SET like_count=like_count-1 WHERE id=?', [req.params.id])
      res.json(success({ isLiked: false, likeCount: Math.max(0, (await db.query('SELECT like_count FROM materials WHERE id=?', [req.params.id]))[0].like_count - 1) }, '已取消点赞'))
    } else {
      await db.query(
        'INSERT INTO material_likes (user_id, material_id) VALUES (?, ?)',
        [req.user.id, req.params.id]
      )
      await db.query('UPDATE materials SET like_count=like_count+1 WHERE id=?', [req.params.id])
      const row = await db.query('SELECT like_count FROM materials WHERE id=?', [req.params.id])
      res.json(success({ isLiked: true, likeCount: row[0].like_count }, '点赞成功'))
    }
  } catch (err) {
    console.error(err)
    res.json(error('操作失败'))
  }
})

router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json(error('权限不足'))
    }
    
    const material = await db.query('SELECT * FROM materials WHERE id=?', [req.params.id])
    if (material.length === 0) return res.json(error('资料不存在'))
    
    await db.query('DELETE FROM material_likes WHERE material_id=?', [req.params.id])
    await db.query('DELETE FROM material_favorites WHERE material_id=?', [req.params.id])
    await db.query('DELETE FROM material_reviews WHERE material_id=?', [req.params.id])
    await db.query('DELETE FROM download_logs WHERE material_id=?', [req.params.id])
    await db.query('DELETE FROM materials WHERE id=?', [req.params.id])
    
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error(err)
    res.json(error('删除失败'))
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const material = await db.query('SELECT * FROM materials WHERE id=?', [req.params.id])
    if (material.length === 0) return res.json(error('资料不存在'))
    
    const m = material[0]
    if (m.uploader_id !== req.user.id && req.user.role !== 'admin') {
      return res.json(error('只能删除自己的资料'))
    }
    
    await db.query('DELETE FROM material_likes WHERE material_id=?', [req.params.id])
    await db.query('DELETE FROM material_favorites WHERE material_id=?', [req.params.id])
    await db.query('DELETE FROM material_reviews WHERE material_id=?', [req.params.id])
    await db.query('DELETE FROM download_logs WHERE material_id=?', [req.params.id])
    await db.query('DELETE FROM materials WHERE id=?', [req.params.id])
    
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error(err)
    res.json(error('删除失败'))
  }
})

router.get('/favorites', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const offset = (page - 1) * pageSize
    
    const list = await db.query(
      `SELECT m.*, mf.created_at as favorited_at 
       FROM material_favorites mf 
       INNER JOIN materials m ON mf.material_id=m.id 
       WHERE mf.user_id=? AND m.audit_status='approved' AND m.status=1
       ORDER BY mf.created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, pageSize, offset]
    )
    
    const totalResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM material_favorites mf 
       INNER JOIN materials m ON mf.material_id=m.id 
       WHERE mf.user_id=? AND m.status=1`,
      [req.user.id]
    )
    
    res.json(pageSuccess(list, totalResult[0].total, page, pageSize))
  } catch (err) {
    console.error('获取收藏列表失败:', err)
    res.json(error('获取收藏列表失败'))
  }
})

router.get('/folders', auth, async (req, res) => {
  try {
    const folders = await db.query(
      'SELECT f.*, (SELECT COUNT(*) FROM material_favorites WHERE folder_id=f.id) as count FROM material_folders f WHERE f.user_id=? ORDER BY f.created_at DESC',
      [req.user.id]
    )
    res.json(success(folders))
  } catch (err) {
    res.json(error('获取文件夹失败'))
  }
})

router.post('/folders', auth, async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.json(error('请输入文件夹名称'))
    
    const result = await db.query(
      'INSERT INTO material_folders (user_id, name) VALUES (?, ?)',
      [req.user.id, name]
    )
    res.json(success({ id: result.insertId }, '创建成功'))
  } catch (err) {
    res.json(error('创建失败'))
  }
})

router.get('/my-uploads', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const offset = (page - 1) * pageSize
    const auditStatus = req.query.audit_status

    let countSql = 'SELECT COUNT(*) as total FROM materials WHERE uploader_id=?'
    let listSql = `SELECT m.*, mc.name as category_name 
                   FROM materials m 
                   LEFT JOIN material_categories mc ON m.category_id=mc.id 
                   WHERE m.uploader_id=?`
    const countParams = [req.user.id]
    const listParams = [req.user.id]

    if (auditStatus) {
      countSql += ' AND audit_status=?'
      listSql += ' AND m.audit_status=?'
      countParams.push(auditStatus)
      listParams.push(auditStatus)
    }

    listSql += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?'
    listParams.push(pageSize, offset)

    const list = await db.query(listSql, listParams)
    const totalResult = await db.query(countSql, countParams)

    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN audit_status='pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN audit_status='approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN audit_status='rejected' THEN 1 ELSE 0 END) as rejected_count
       FROM materials WHERE uploader_id=?`,
      [req.user.id]
    )

    res.json(pageSuccess(list, totalResult[0].total, page, pageSize, {
      stats: statsResult[0]
    }))
  } catch (err) {
    console.error(err)
    res.json(error('获取上传记录失败'))
  }
})

module.exports = router

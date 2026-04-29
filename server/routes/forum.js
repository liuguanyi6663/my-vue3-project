const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { auth, optionalAuth } = require('../middleware/auth')
const upload = require('../middleware/upload')

router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { category, keyword, page = 1, pageSize = 10, sort = 'created_at' } = req.query
    const pageNum = parseInt(page) || 1
    const size = parseInt(pageSize) || 10
    const offset = (pageNum - 1) * size
    
    console.log('获取帖子列表请求，参数:', { category, keyword, page, pageSize, sort })
    
    let sql = `SELECT p.*, u.nickname as author_name, u.avatar as author_avatar,
               CASE WHEN p.is_anonymous=1 THEN '匿名用户' ELSE u.nickname END as display_name
               FROM forum_posts p 
               LEFT JOIN users u ON p.user_id=u.id 
               WHERE p.status=1`
    
    if (category) {
      sql += ` AND p.category='${category}'`
    }
    if (keyword) {
      sql += ` AND (p.title LIKE '%${keyword}%' OR p.content LIKE '%${keyword}%')`
    }
    
    const sortOrder = sort === 'hot' ? 'p.like_count DESC' :
                      sort === 'comment' ? 'p.comment_count DESC' : 
                      sort === 'popular' ? '(p.like_count + p.comment_count) DESC' :
                      'p.is_top DESC, p.created_at DESC'
    sql += ` ORDER BY ${sortOrder} LIMIT ${size} OFFSET ${offset}`
    
    console.log('查询SQL:', sql)
    
    const list = await db.query(sql)
    console.log('查询到的帖子列表:', list)
    
    let countSql = `SELECT COUNT(*) as total FROM forum_posts p WHERE p.status=1`
    const countParams = []
    if (category) {
      countSql += ' AND p.category=?'
      countParams.push(category)
    }
    if (keyword) {
      countSql += ' AND (p.title LIKE ? OR p.content LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`)
    }
    const totalResult = await db.query(countSql, countParams)
    console.log('总数查询结果:', totalResult)
    
    for (const post of list) {
      if (req.user) {
        const liked = await db.query(
          'SELECT * FROM forum_likes WHERE user_id=? AND target_id=? AND target_type="post"',
          [req.user.id, post.id]
        )
        post.isLiked = liked.length > 0
        
        const favorited = await db.query(
          'SELECT * FROM forum_favorites WHERE user_id=? AND post_id=?',
          [req.user.id, post.id]
        )
        post.isFavorited = favorited.length > 0
        
        // 标记是否是帖子作者或管理员
        post.isOwner = post.user_id === req.user.id
        post.canDelete = post.user_id === req.user.id || req.user.role === 'admin' || req.user.role === 'super_admin'
      } else {
        post.isLiked = false
        post.isFavorited = false
        post.isOwner = false
        post.canDelete = false
      }
    }
    
    res.json(pageSuccess(list, totalResult[0].total, parseInt(page), parseInt(pageSize)))
  } catch (err) {
    console.error(err)
    res.json(error('获取帖子列表失败'))
  }
})

router.get('/posts/:id', optionalAuth, async (req, res) => {
  try {
    const posts = await db.query(
      `SELECT p.*, u.nickname as author_name, u.avatar as author_avatar,
       CASE WHEN p.is_anonymous=1 THEN '匿名用户' ELSE u.nickname END as display_name
       FROM forum_posts p 
       LEFT JOIN users u ON p.user_id=u.id 
       WHERE p.id=?`,
      [req.params.id]
    )

    if (posts.length === 0) return res.json(error('帖子不存在'))

    await db.query('UPDATE forum_posts SET view_count=view_count+1 WHERE id=?', [req.params.id])

    const post = posts[0]

    // 添加删除权限判断
    if (req.user) {
      post.isOwner = post.user_id === req.user.id
      post.canDelete = post.user_id === req.user.id || req.user.role === 'admin' || req.user.role === 'super_admin'
    } else {
      post.isOwner = false
      post.canDelete = false
    }

    const comments = await db.query(
      `SELECT c.*, u.nickname, u.avatar,
       CASE WHEN c.user_id=? THEN 1 ELSE 0 END as is_owner
       FROM forum_comments c 
       LEFT JOIN users u ON c.user_id=u.id 
       WHERE c.post_id=? AND c.status=1 AND c.parent_id=0
       ORDER BY c.created_at DESC LIMIT 50`,
      [req.user?.id || 0, req.params.id]
    )

    if (req.user) {
      for (const comment of comments) {
        const likeRecord = await db.query(
          'SELECT * FROM forum_likes WHERE user_id=? AND target_id=? AND target_type="comment"',
          [req.user.id, comment.id]
        )
        comment.isLiked = likeRecord.length > 0

        const replyCount = await db.query(
          'SELECT COUNT(*) as cnt FROM forum_comments WHERE parent_id=? AND status=1',
          [comment.id]
        )
        comment.total_replies = replyCount[0].cnt
        comment.reply_count = replyCount[0].cnt

        const replies = await db.query(
          `SELECT c.*, u.nickname, u.avatar,
           ru.nickname as reply_to_nickname
           FROM forum_comments c
           LEFT JOIN users u ON c.user_id=u.id
           LEFT JOIN users ru ON c.reply_to_user_id=ru.id
           WHERE c.post_id=? AND c.parent_id=? AND c.status=1
           ORDER BY c.created_at ASC LIMIT 20`,
          [req.params.id, comment.id]
        )
        for (const reply of replies) {
          const replyLike = await db.query(
            'SELECT * FROM forum_likes WHERE user_id=? AND target_id=? AND target_type="comment"',
            [req.user.id, reply.id]
          )
          reply.isLiked = replyLike.length > 0
        }
        comment.replies = replies
      }
    } else {
      for (const comment of comments) {
        const replyCount = await db.query(
          'SELECT COUNT(*) as cnt FROM forum_comments WHERE parent_id=? AND status=1',
          [comment.id]
        )
        comment.total_replies = replyCount[0].cnt
        comment.reply_count = replyCount[0].cnt

        const replies = await db.query(
          `SELECT c.*, u.nickname, u.avatar,
           ru.nickname as reply_to_nickname
           FROM forum_comments c
           LEFT JOIN users u ON c.user_id=u.id
           LEFT JOIN users ru ON c.reply_to_user_id=ru.id
           WHERE c.post_id=? AND c.parent_id=? AND c.status=1
           ORDER BY c.created_at ASC LIMIT 20`,
          [req.params.id, comment.id]
        )
        for (const reply of replies) {
          reply.isLiked = false
        }
        comment.replies = replies
        comment.isLiked = false
      }
    }

    post.comments = comments

    if (req.user) {
      const liked = await db.query(
        'SELECT * FROM forum_likes WHERE user_id=? AND target_id=? AND target_type="post"',
        [req.user.id, req.params.id]
      )
      post.isLiked = liked.length > 0

      const favorited = await db.query(
        'SELECT * FROM forum_favorites WHERE user_id=? AND post_id=?',
        [req.user.id, req.params.id]
      )
      post.isFavorited = favorited.length > 0
    } else {
      post.isLiked = false
      post.isFavorited = false
    }

    res.json(success(post))
  } catch (err) {
    console.error(err)
    res.json(error('获取帖子详情失败'))
  }
})

router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.is_banned === 1) {
      return res.json({ code: 403, msg: '你已被禁言，请联系管理员解决', data: null })
    }
    if (!req.file) {
      return res.json(error('请上传图片'))
    }
    
    res.json(success({ url: '/uploads/' + req.file.filename }, '上传成功'))
  } catch (err) {
    console.error(err)
    res.json(error('上传失败'))
  }
})

router.post('/posts', auth, async (req, res) => {
  try {
    if (req.user.is_banned === 1) {
      return res.json({ code: 403, msg: '你已被禁言，请联系管理员解决', data: null })
    }
    const { category, title, content, images, tags, is_anonymous } = req.body
    if (!category || !title || !content) {
      return res.json(error('请填写完整信息'))
    }
    
    try {
      const sensitiveWords = await db.query('SELECT word FROM sensitive_words WHERE status=1')
      for (const sw of sensitiveWords) {
        if (content.includes(sw.word) || title.includes(sw.word)) {
          return res.json(error('内容包含敏感词，请修改后提交'))
        }
      }
    } catch (e) {
      console.warn('敏感词表查询失败，跳过检测:', e.message)
    }
    
    // 如果是匿名树洞分类，强制匿名
    const finalIsAnonymous = category === 'treehole' ? 1 : (is_anonymous ? 1 : 0)
    
    const result = await db.query(
      `INSERT INTO forum_posts (user_id, category, title, content, images, tags, is_anonymous, audit_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [req.user.id, category, title, content, JSON.stringify(images || []), JSON.stringify(tags || []), finalIsAnonymous]
    )
    
    res.json(success({ id: result.insertId }, '发布成功'))
  } catch (err) {
    console.error(err)
    res.json(error('发布失败: ' + err.message))
  }
})

router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const posts = await db.query('SELECT * FROM forum_posts WHERE id=?', [req.params.id])
    if (posts.length === 0) return res.json(error('帖子不存在'))
    
    const post = posts[0]
    // 检查权限：只能删除自己的帖子或管理员
    if (post.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.json(error('无权限删除该帖子'))
    }
    
    // 删除相关的点赞、收藏、评论、举报
    await db.query('DELETE FROM forum_likes WHERE target_id=? AND target_type="post"', [req.params.id])
    await db.query('DELETE FROM forum_favorites WHERE post_id=?', [req.params.id])
    
    // 删除评论及其相关数据
    const comments = await db.query('SELECT id FROM forum_comments WHERE post_id=?', [req.params.id])
    for (const comment of comments) {
      await db.query('DELETE FROM forum_likes WHERE target_id=? AND target_type="comment"', [comment.id])
    }
    await db.query('DELETE FROM forum_comments WHERE post_id=?', [req.params.id])
    await db.query('DELETE FROM reports WHERE target_type="post" AND target_id=?', [req.params.id])
    
    // 删除帖子（设置status=0而不是物理删除）
    await db.query('UPDATE forum_posts SET status=0 WHERE id=?', [req.params.id])
    
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error(err)
    res.json(error('删除失败'))
  }
})

router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT * FROM forum_likes WHERE user_id=? AND target_id=? AND target_type="post"',
      [req.user.id, req.params.id]
    )
    
    if (existing.length > 0) {
      await db.query('DELETE FROM forum_likes WHERE id=?', [existing[0].id])
      await db.query('UPDATE forum_posts SET like_count=GREATEST(like_count-1,0) WHERE id=?', [req.params.id])
      res.json(success({ isLiked: false, likeCount: Math.max(0, (await db.query('SELECT like_count FROM forum_posts WHERE id=?', [req.params.id]))[0].like_count - 1) }, '已取消点赞'))
    } else {
      await db.query(
        'INSERT INTO forum_likes (user_id, target_id, target_type) VALUES (?, ?, "post")',
        [req.user.id, req.params.id]
      )
      await db.query('UPDATE forum_posts SET like_count=like_count+1 WHERE id=?', [req.params.id])
      const post = await db.query('SELECT like_count FROM forum_posts WHERE id=?', [req.params.id])
      res.json(success({ isLiked: true, likeCount: post[0].like_count }, '点赞成功'))
    }
  } catch (err) {
    res.json(error('操作失败'))
  }
})

router.post('/posts/:id/favorite', auth, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT * FROM forum_favorites WHERE user_id=? AND post_id=?',
      [req.user.id, req.params.id]
    )
    
    if (existing.length > 0) {
      await db.query('DELETE FROM forum_favorites WHERE id=?', [existing[0].id])
      res.json(success({ isFavorited: false }, '已取消收藏'))
    } else {
      await db.query(
        'INSERT INTO forum_favorites (user_id, post_id) VALUES (?, ?)',
        [req.user.id, req.params.id]
      )
      res.json(success({ isFavorited: true }, '收藏成功'))
    }
  } catch (err) {
    res.json(error('操作失败'))
  }
})

router.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    if (req.user.is_banned === 1) {
      return res.json({ code: 403, msg: '你已被禁言，请联系管理员解决', data: null })
    }
    const { content, parent_id, reply_to_user_id } = req.body
    if (!content) return res.json(error('请输入评论内容'))

    try {
      const sensitiveWords = await db.query('SELECT word FROM sensitive_words WHERE status=1')
      for (const sw of sensitiveWords) {
        if (content.includes(sw.word)) {
          return res.json(error('评论包含敏感词'))
        }
      }
    } catch (e) {
      console.warn('敏感词表查询失败，跳过检测:', e.message)
    }

    const parentId = parent_id || 0
    let replyToUserId = null

    if (parentId !== 0) {
      if (reply_to_user_id) {
        replyToUserId = reply_to_user_id
      } else {
        const parentComment = await db.query('SELECT user_id FROM forum_comments WHERE id=?', [parentId])
        replyToUserId = parentComment.length > 0 ? parentComment[0].user_id : null
      }
    }

    const result = await db.query(
      'INSERT INTO forum_comments (post_id, user_id, parent_id, reply_to_user_id, content) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, parentId, replyToUserId, content]
    )

    if (parentId === 0) {
      await db.query('UPDATE forum_posts SET comment_count=comment_count+1 WHERE id=?', [req.params.id])
    } else {
      await db.query('UPDATE forum_comments SET reply_count=reply_count+1 WHERE id=?', [parentId])
      await db.query('UPDATE forum_posts SET comment_count=comment_count+1 WHERE id=?', [req.params.id])
    }

    res.json(success({ id: result.insertId }, parentId === 0 ? '评论成功' : '回复成功'))
  } catch (err) {
    console.error(err)
    res.json(error('评论失败'))
  }
})

router.post('/comments/:id/like', auth, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT * FROM forum_likes WHERE user_id=? AND target_id=? AND target_type="comment"',
      [req.user.id, req.params.id]
    )

    if (existing.length > 0) {
      await db.query('DELETE FROM forum_likes WHERE id=?', [existing[0].id])
      await db.query('UPDATE forum_comments SET like_count=GREATEST(like_count-1,0) WHERE id=?', [req.params.id])
      const row = await db.query('SELECT like_count FROM forum_comments WHERE id=?', [req.params.id])
      res.json(success({ isLiked: false, likeCount: row[0].like_count }, '已取消点赞'))
    } else {
      const comment = await db.query('SELECT * FROM forum_comments WHERE id=?', [req.params.id])
      if (comment.length === 0) return res.json(error('评论不存在'))

      await db.query(
        'INSERT INTO forum_likes (user_id, target_id, target_type) VALUES (?, ?, "comment")',
        [req.user.id, req.params.id]
      )
      await db.query('UPDATE forum_comments SET like_count=like_count+1 WHERE id=?', [req.params.id])
      const row = await db.query('SELECT like_count FROM forum_comments WHERE id=?', [req.params.id])
      res.json(success({ isLiked: true, likeCount: row[0].like_count }, '点赞成功'))
    }
  } catch (err) {
    console.error(err)
    res.json(error('操作失败'))
  }
})

router.post('/comments/:id/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body
    if (!reason) {
      return res.json(error('请选择举报原因'))
    }

    const comment = await db.query('SELECT * FROM forum_comments WHERE id=?', [req.params.id])
    if (comment.length === 0) return res.json(error('评论不存在'))

    await db.query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason, description) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'forum_comment', req.params.id, reason, description || '']
    )

    res.json(success(null, '举报成功，我们会尽快处理'))
  } catch (err) {
    console.error(err)
    res.json(error('举报失败'))
  }
})

router.delete('/comments/:id', auth, async (req, res) => {
  try {
    const comment = await db.query('SELECT * FROM forum_comments WHERE id=?', [req.params.id])
    if (comment.length === 0) return res.json(error('评论不存在'))

    const c = comment[0]
    if (c.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.json(error('只能删除自己的评论'))
    }

    if (c.parent_id === 0) {
      await db.query('DELETE FROM forum_likes WHERE target_id IN (SELECT id FROM forum_comments WHERE parent_id=?) AND target_type="comment"', [c.id])
      await db.query('DELETE FROM forum_comments WHERE parent_id=?', [c.id])
      await db.query('DELETE FROM forum_likes WHERE target_id=? AND target_type="comment"', [c.id])
      await db.query('DELETE FROM reports WHERE target_type="forum_comment" AND target_id=?', [c.id])
      await db.query('DELETE FROM forum_comments WHERE id=?', [c.id])

      const countResult = await db.query(
        'SELECT COUNT(*) as cnt FROM forum_comments WHERE post_id=? AND status=1 AND parent_id=0',
        [c.post_id]
      )
      await db.query(
        'UPDATE forum_posts SET comment_count=? WHERE id=?',
        [countResult[0].cnt, c.post_id]
      )
    } else {
      await db.query('DELETE FROM forum_likes WHERE target_id=? AND target_type="comment"', [c.id])
      await db.query('DELETE FROM reports WHERE target_type="forum_comment" AND target_id=?', [c.id])
      await db.query('DELETE FROM forum_comments WHERE id=?', [c.id])
      await db.query(
        'UPDATE forum_comments SET reply_count=GREATEST(reply_count-1,0) WHERE id=?',
        [c.parent_id]
      )

      const countResult = await db.query(
        'SELECT COUNT(*) as cnt FROM forum_comments WHERE post_id=? AND status=1 AND parent_id=0',
        [c.post_id]
      )
      await db.query(
        'UPDATE forum_posts SET comment_count=? WHERE id=?',
        [countResult[0].cnt, c.post_id]
      )
    }

    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error(err)
    res.json(error('删除失败'))
  }
})

router.get('/favorites', auth, async (req, res) => {
  try {
    console.log('=== 获取收藏帖子 ===')
    console.log('用户ID:', req.user.id)

    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const offset = (page - 1) * pageSize

    // 先查询所有收藏记录
    const allFavorites = await db.query(
      'SELECT * FROM forum_favorites WHERE user_id=?',
      [req.user.id]
    )
    console.log('所有收藏记录:', allFavorites)

    // 查询总数
    const totalResult = await db.query(
      'SELECT COUNT(*) as total FROM forum_favorites WHERE user_id=?',
      [req.user.id]
    )
    console.log('总数:', totalResult[0].total)

    // 查询列表
    const list = await db.query(
      `SELECT p.*, ff.created_at as favorited_at,
       CASE WHEN p.is_anonymous=1 THEN '匿名用户' ELSE u.nickname END as display_name
       FROM forum_favorites ff 
       INNER JOIN forum_posts p ON ff.post_id=p.id 
       LEFT JOIN users u ON p.user_id=u.id 
       WHERE ff.user_id=? AND p.status=1
       ORDER BY ff.created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, pageSize, offset]
    )
    console.log('查询到的列表:', list)

    res.json(pageSuccess(list, totalResult[0].total, page, pageSize))
  } catch (err) {
    console.error('获取收藏失败:', err)
    res.json(error('获取收藏失败'))
  }
})

router.get('/test-favorites', async (req, res) => {
  try {
    console.log('=== 测试收藏接口 - 开始 ===')
    
    const testUserId = 1
    console.log('测试用户ID:', testUserId)
    
    console.log('1. 查询收藏总数...')
    const totalResult = await db.query(
      'SELECT COUNT(*) as total FROM forum_favorites WHERE user_id=?',
      [testUserId]
    )
    console.log('总数结果:', totalResult)

    console.log('2. 查询收藏列表...')
    const list = await db.query(
      `SELECT p.*, ff.created_at as favorited_at,
       CASE WHEN p.is_anonymous=1 THEN '匿名用户' ELSE u.nickname END as display_name
       FROM forum_favorites ff 
       INNER JOIN forum_posts p ON ff.post_id=p.id 
       LEFT JOIN users u ON p.user_id=u.id 
       WHERE ff.user_id=? AND p.status=1
       ORDER BY ff.created_at DESC LIMIT 10 OFFSET 0`,
      [testUserId]
    )
    console.log('列表结果:', list)

    const response = pageSuccess(list, totalResult[0].total, 1, 10)
    console.log('响应:', response)

    res.json(response)
  } catch (err) {
    console.error('=== 测试收藏接口 - 失败 ===')
    console.error('错误:', err)
    res.json({ code: 500, msg: '测试失败: ' + err.message, data: null })
  }
})

router.get('/my-posts', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const offset = (page - 1) * pageSize
    const category = req.query.category

    let countSql = 'SELECT COUNT(*) as total FROM forum_posts WHERE user_id=? AND status=1'
    let listSql = `SELECT p.*, 
                   CASE WHEN p.is_anonymous=1 THEN '匿名用户' ELSE u.nickname END as display_name
                   FROM forum_posts p 
                   LEFT JOIN users u ON p.user_id=u.id 
                   WHERE p.user_id=? AND p.status=1`
    const countParams = [req.user.id]
    const listParams = [req.user.id]

    if (category) {
      countSql += ' AND category=?'
      listSql += ' AND p.category=?'
      countParams.push(category)
      listParams.push(category)
    }

    listSql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?'
    listParams.push(pageSize, offset)

    const list = await db.query(listSql, listParams)
    const totalResult = await db.query(countSql, countParams)

    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN category='study' THEN 1 ELSE 0 END) as study_count,
        SUM(CASE WHEN category='experience' THEN 1 ELSE 0 END) as experience_count,
        SUM(CASE WHEN category='help' THEN 1 ELSE 0 END) as help_count,
        SUM(CASE WHEN category='adjust' THEN 1 ELSE 0 END) as adjust_count,
        SUM(CASE WHEN category='treehole' THEN 1 ELSE 0 END) as treehole_count
       FROM forum_posts WHERE user_id=? AND status=1`,
      [req.user.id]
    )

    for (const post of list) {
      let parsedImages = []
      try {
        if (post.images) {
          parsedImages = typeof post.images === 'string' ? JSON.parse(post.images) : post.images
        }
      } catch (e) {}
      post.images = parsedImages

      let parsedTags = []
      try {
        if (post.tags) {
          parsedTags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags
        }
      } catch (e) {}
      post.tags = parsedTags
    }

    res.json(pageSuccess(list, totalResult[0].total, page, pageSize, {
      stats: statsResult[0]
    }))
  } catch (err) {
    console.error(err)
    res.json(error('获取我的帖子失败'))
  }
})

router.post('/report', auth, async (req, res) => {
  try {
    const { target_type, target_id, reason, description } = req.body
    if (!target_type || !target_id || !reason) {
      return res.json(error('请填写完整举报信息'))
    }
    
    await db.query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason, description) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, target_type, target_id, reason, description || '']
    )
    
    res.json(success(null, '举报成功，我们会尽快处理'))
  } catch (err) {
    res.json(error('举报失败'))
  }
})

module.exports = router

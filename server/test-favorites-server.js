const express = require('express')
const cors = require('cors')
const db = require('./utils/db')
const { success, error, pageSuccess } = require('./utils/response')

const app = express()
app.use(cors())
app.use(express.json())

// 简单的 mock auth
app.use((req, res, next) => {
  req.user = { id: 1 }
  next()
})

app.get('/test-favorites', async (req, res) => {
  console.log('=== 测试收藏接口 ===')
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const offset = (page - 1) * pageSize
    
    console.log('参数:', { page, pageSize, offset })
    
    const sql = `SELECT p.*, ff.created_at as favorited_at,
       CASE WHEN p.is_anonymous=1 THEN '匿名用户' ELSE u.nickname END as display_name
       FROM forum_favorites ff 
       INNER JOIN forum_posts p ON ff.post_id=p.id 
       LEFT JOIN users u ON p.user_id=u.id 
       WHERE ff.user_id=? AND p.status=1
       ORDER BY ff.created_at DESC LIMIT ? OFFSET ?`
    
    console.log('执行SQL...')
    const list = await db.query(sql, [1, pageSize, offset])
    console.log('查询到:', list.length, '条数据')
    
    const totalResult = await db.query(
      'SELECT COUNT(*) as total FROM forum_favorites WHERE user_id=?',
      [1]
    )
    console.log('总数:', totalResult[0].total)
    
    const response = pageSuccess(list, totalResult[0].total, page, pageSize)
    console.log('返回:', response)
    
    res.json(response)
  } catch (err) {
    console.error('错误:', err)
    res.json(error('失败: ' + err.message))
  }
})

app.listen(3001, () => {
  console.log('测试服务器在 http://127.0.0.1:3001/test-favorites 运行')
})

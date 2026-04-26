const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())

// 简单测试接口
app.get('/api/forum/posts-test', async (req, res) => {
  console.log('收到测试请求，参数:', req.query)
  
  try {
    const db = require('./server/utils/db')
    const { category, page = 1, pageSize = 10 } = req.query
    const pageNum = parseInt(page) || 1
    const size = parseInt(pageSize) || 10
    const offset = (pageNum - 1) * size
    
    console.log('查询参数:', { category, pageNum, size, offset })
    
    let sql = `SELECT p.*, u.nickname as author_name, u.avatar as author_avatar,
               CASE WHEN p.is_anonymous=1 THEN '匿名用户' ELSE u.nickname END as display_name
               FROM forum_posts p 
               LEFT JOIN users u ON p.user_id=u.id 
               WHERE p.status=1`
    
    if (category) {
      sql += ` AND p.category='${category}'`
    }
    
    sql += ` ORDER BY p.is_top DESC, p.created_at DESC LIMIT ${size} OFFSET ${offset}`
    
    console.log('执行SQL:', sql)
    
    const list = await db.query(sql)
    console.log('查询结果:', list)
    
    const totalResult = await db.query('SELECT COUNT(*) as total FROM forum_posts p WHERE p.status=1')
    
    const response = {
      code: 200,
      msg: 'success',
      data: {
        list,
        total: totalResult[0].total,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(totalResult[0].total / size)
      }
    }
    
    console.log('返回数据:', response)
    res.json(response)
    
  } catch (err) {
    console.error('查询失败:', err)
    res.json({
      code: 500,
      msg: '查询失败',
      data: null
    })
  }
})

const TEST_PORT = 3001
app.listen(TEST_PORT, () => {
  console.log(`测试服务器运行在 http://127.0.0.1:${TEST_PORT}`)
  console.log(`测试接口: http://127.0.0.1:${TEST_PORT}/api/forum/posts-test?category=study`)
})

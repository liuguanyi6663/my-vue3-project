const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { auth } = require('../middleware/auth')

router.get('/', async (req, res) => {
  try {
    const { region, type, keyword, page = 1, pageSize = 20 } = req.query
    
    let sql = 'SELECT * FROM school_websites WHERE status=1'
    let countSql = 'SELECT COUNT(*) as total FROM school_websites WHERE status=1'
    const params = []
    
    if (region) {
      sql += ' AND region=?'
      countSql += ' AND region=?'
      params.push(region)
    }
    
    if (type) {
      sql += ' AND type=?'
      countSql += ' AND type=?'
      params.push(type)
    }
    
    if (keyword) {
      sql += ' AND name LIKE ?'
      countSql += ' AND name LIKE ?'
      params.push(`%${keyword}%`)
    }
    
    sql += ' ORDER BY sort_order ASC, click_count DESC, created_at DESC'
    
    const offset = (page - 1) * pageSize
    sql += ' LIMIT ? OFFSET ?'
    params.push(Number(pageSize), Number(offset))
    
    const list = await db.query(sql, params)
    const countResult = await db.query(countSql, params.slice(0, -2))
    const total = countResult[0].total
    
    res.json(pageSuccess(list, total, page, pageSize))
  } catch (err) {
    res.json(error('获取学校官网列表失败'))
  }
})

router.get('/regions', async (req, res) => {
  try {
    const regions = await db.query(
      'SELECT DISTINCT region FROM school_websites WHERE status=1 AND region IS NOT NULL ORDER BY region'
    )
    res.json(success(regions.map(r => r.region)))
  } catch (err) {
    res.json(error('获取地区列表失败'))
  }
})

router.post('/:id/click', async (req, res) => {
  try {
    await db.query('UPDATE school_websites SET click_count=click_count+1 WHERE id=?', [req.params.id])
    res.json(success(null))
  } catch (err) {
    res.json(error('记录点击失败'))
  }
})

router.get('/admin/list', auth, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.json(error('无权限'))
    }
    
    const { page = 1, pageSize = 20, keyword } = req.query
    
    let sql = 'SELECT * FROM school_websites WHERE 1=1'
    let countSql = 'SELECT COUNT(*) as total FROM school_websites WHERE 1=1'
    const params = []
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR region LIKE ? OR website LIKE ?)'
      countSql += ' AND (name LIKE ? OR region LIKE ? OR website LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    sql += ' ORDER BY sort_order ASC, created_at DESC'
    
    const offset = (page - 1) * pageSize
    sql += ' LIMIT ? OFFSET ?'
    params.push(Number(pageSize), Number(offset))
    
    const list = await db.query(sql, params)
    const countResult = await db.query(countSql, params.slice(0, -2))
    const total = countResult[0].total
    
    res.json(pageSuccess(list, total, page, pageSize))
  } catch (err) {
    res.json(error('获取学校列表失败'))
  }
})

router.post('/admin/create', auth, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.json(error('无权限'))
    }
    
    const { name, website, type, region, logo_url, sort_order } = req.body
    
    if (!name || !website) {
      return res.json(error('学校名称和官网地址不能为空'))
    }
    
    await db.query(
      `INSERT INTO school_websites (name, website, type, region, logo_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, website, type || '普通', region || null, logo_url || null, sort_order || 0]
    )
    
    res.json(success(null, '添加学校成功'))
  } catch (err) {
    res.json(error('添加学校失败'))
  }
})

router.put('/admin/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.json(error('无权限'))
    }
    
    const { name, website, type, region, logo_url, sort_order, status } = req.body
    
    await db.query(
      `UPDATE school_websites 
       SET name=?, website=?, type=?, region=?, logo_url=?, sort_order=?, status=?
       WHERE id=?`,
      [name, website, type, region, logo_url, sort_order, status, req.params.id]
    )
    
    res.json(success(null, '更新学校信息成功'))
  } catch (err) {
    res.json(error('更新学校信息失败'))
  }
})

router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.json(error('无权限'))
    }
    
    await db.query('DELETE FROM school_websites WHERE id=?', [req.params.id])
    
    res.json(success(null, '删除学校成功'))
  } catch (err) {
    res.json(error('删除学校失败'))
  }
})

module.exports = router

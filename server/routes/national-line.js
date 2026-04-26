const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { adminAuth } = require('../middleware/auth')

router.get('/list', async (req, res) => {
  try {
    const { year, region, category } = req.query

    const systemYear = new Date().getFullYear()
    const years = await db.query('SELECT DISTINCT year FROM national_lines ORDER BY year DESC LIMIT 4')
    const targetYear = parseInt(year) || systemYear

    let yearList = years.map(y => y.year)
    if (!yearList.includes(targetYear)) {
      yearList.unshift(targetYear)
    }
    yearList = yearList.slice(0, 4)

    let sql = 'SELECT * FROM national_lines WHERE year=?'
    const params = [targetYear]

    if (region) {
      sql += ' AND region=?'
      params.push(region)
    }
    if (category) {
      sql += ' AND category=?'
      params.push(category)
    }

    sql += ' ORDER BY region ASC, category ASC, subject_type ASC'

    const list = await db.query(sql, params)

    const grouped = { academic: { A: [], B: [] }, professional: { A: [], B: [] } }
    for (const item of list) {
      if (grouped[item.category] && grouped[item.category][item.region]) {
        grouped[item.category][item.region].push(item)
      }
    }

    res.json(success({
      years: yearList,
      currentYear: targetYear,
      data: grouped
    }))
  } catch (err) {
    console.error('获取国家线数据失败:', err)
    res.json(error('获取国家线数据失败'))
  }
})

router.get('/years', async (req, res) => {
  try {
    const years = await db.query('SELECT DISTINCT year FROM national_lines ORDER BY year DESC LIMIT 4')
    res.json(success(years.map(y => y.year)))
  } catch (err) {
    res.json(error('获取年份列表失败'))
  }
})

router.get('/admin/list', adminAuth, async (req, res) => {
  try {
    const { year, region, category, page = 1, pageSize = 20 } = req.query
    const pageNum = parseInt(page) || 1
    const size = parseInt(pageSize) || 20
    const offset = (pageNum - 1) * size

    let sql = 'SELECT * FROM national_lines WHERE 1=1'
    const params = []

    if (year) {
      sql += ' AND year=?'
      params.push(year)
    }
    if (region) {
      sql += ' AND region=?'
      params.push(region)
    }
    if (category) {
      sql += ' AND category=?'
      params.push(category)
    }

    let countSql = 'SELECT COUNT(*) as total FROM national_lines WHERE 1=1'
    const countParams = []

    if (year) {
      countSql += ' AND year=?'
      countParams.push(year)
    }
    if (region) {
      countSql += ' AND region=?'
      countParams.push(region)
    }
    if (category) {
      countSql += ' AND category=?'
      countParams.push(category)
    }

    sql += ' ORDER BY year DESC, region ASC, category ASC, subject_type ASC LIMIT ? OFFSET ?'
    params.push(size, offset)

    const list = await db.query(sql, params)
    const totalResult = await db.query(countSql, countParams)

    res.json(pageSuccess(list, totalResult[0].total, pageNum, size))
  } catch (err) {
    console.error('获取国家线列表失败:', err)
    res.json(error('获取国家线列表失败'))
  }
})

router.post('/admin/add', adminAuth, async (req, res) => {
  try {
    const { year, region, category, subject_type, total_score, politics_score, foreign_score, subject1_score, subject2_score } = req.body

    if (!year || !region || !category || !subject_type || total_score === undefined) {
      return res.json(error('请填写必要字段'))
    }

    const existing = await db.query(
      'SELECT id FROM national_lines WHERE year=? AND region=? AND category=? AND subject_type=?',
      [year, region, category, subject_type]
    )

    if (existing.length > 0) {
      return res.json(error('该年份、区域、类别、学科门类的数据已存在'))
    }

    await db.query(
      'INSERT INTO national_lines (year, region, category, subject_type, total_score, politics_score, foreign_score, subject1_score, subject2_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [year, region, category, subject_type, total_score, politics_score || null, foreign_score || null, subject1_score || null, subject2_score || null]
    )

    res.json(success(null, '添加成功'))
  } catch (err) {
    console.error('添加国家线数据失败:', err)
    res.json(error('添加失败'))
  }
})

router.put('/admin/update/:id', adminAuth, async (req, res) => {
  try {
    const allowedFields = ['year', 'region', 'category', 'subject_type', 'total_score', 'politics_score', 'foreign_score', 'subject1_score', 'subject2_score']
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
    await db.query(`UPDATE national_lines SET ${fields.join(',')} WHERE id=?`, values)
    res.json(success(null, '更新成功'))
  } catch (err) {
    console.error('更新国家线数据失败:', err)
    res.json(error('更新失败'))
  }
})

router.delete('/admin/delete/:id', adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM national_lines WHERE id=?', [req.params.id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('删除国家线数据失败:', err)
    res.json(error('删除失败'))
  }
})

router.post('/admin/batch', adminAuth, async (req, res) => {
  try {
    const { year, region, category, items } = req.body

    if (!year || !region || !category || !items || !items.length) {
      return res.json(error('请填写必要字段'))
    }

    for (const item of items) {
      const existing = await db.query(
        'SELECT id FROM national_lines WHERE year=? AND region=? AND category=? AND subject_type=?',
        [year, region, category, item.subject_type]
      )

      if (existing.length > 0) {
        await db.query(
          'UPDATE national_lines SET total_score=?, politics_score=?, foreign_score=?, subject1_score=?, subject2_score=? WHERE id=?',
          [item.total_score, item.politics_score || null, item.foreign_score || null, item.subject1_score || null, item.subject2_score || null, existing[0].id]
        )
      } else {
        await db.query(
          'INSERT INTO national_lines (year, region, category, subject_type, total_score, politics_score, foreign_score, subject1_score, subject2_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [year, region, category, item.subject_type, item.total_score, item.politics_score || null, item.foreign_score || null, item.subject1_score || null, item.subject2_score || null]
        )
      }
    }

    res.json(success(null, '批量保存成功'))
  } catch (err) {
    console.error('批量保存国家线数据失败:', err)
    res.json(error('批量保存失败'))
  }
})

router.delete('/admin/batch-by-year/:year', adminAuth, async (req, res) => {
  try {
    const { region, category } = req.query
    let sql = 'DELETE FROM national_lines WHERE year=?'
    const params = [req.params.year]

    if (region) {
      sql += ' AND region=?'
      params.push(region)
    }
    if (category) {
      sql += ' AND category=?'
      params.push(category)
    }

    await db.query(sql, params)
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('批量删除国家线数据失败:', err)
    res.json(error('删除失败'))
  }
})

module.exports = router

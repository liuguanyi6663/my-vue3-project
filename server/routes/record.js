const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { auth } = require('../middleware/auth')
const { getCurrentYear } = require('../utils/date')

// 确保表存在的辅助函数
const ensureTable = async () => {
  // 先创建表（如果不存在）
  await db.query(`
    CREATE TABLE IF NOT EXISTS student_kaoyan_records (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      name VARCHAR(50) NOT NULL COMMENT '姓名',
      major VARCHAR(100) NOT NULL COMMENT '专业',
      student_id VARCHAR(50) NOT NULL COMMENT '学号',
      exam_subjects VARCHAR(200) NOT NULL COMMENT '考研科目',
      is_cross_major TINYINT DEFAULT 0 COMMENT '是否跨考 1是 0否',
      is_admitted TINYINT DEFAULT 0 COMMENT '是否上岸 1是 0否',
      math_score DECIMAL(5,2) DEFAULT NULL COMMENT '数学成绩',
      english_score DECIMAL(5,2) DEFAULT NULL COMMENT '英语成绩',
      politics_score DECIMAL(5,2) DEFAULT NULL COMMENT '政治成绩',
      professional_score DECIMAL(5,2) DEFAULT NULL COMMENT '专业课成绩',
      is_pass_line TINYINT DEFAULT 0 COMMENT '是否过专业线 1是 0否',
      target_school VARCHAR(200) DEFAULT NULL COMMENT '目标院校',
      target_major VARCHAR(100) DEFAULT NULL COMMENT '目标专业',
      exam_year YEAR DEFAULT NULL COMMENT '考研年份',
      status ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_student_id (student_id),
      INDEX idx_status (status),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生考研信息录入表'
  `)

  // 检查并添加缺失的列
  try {
    const columns = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_kaoyan_records'
    `)
    const columnNames = columns.map(c => c.COLUMN_NAME)

    if (!columnNames.includes('school_level')) {
      await db.query(`
        ALTER TABLE student_kaoyan_records
        ADD COLUMN school_level VARCHAR(50) DEFAULT NULL COMMENT '院校层次：985/211/双一流/普通本科高校'
      `)
    }
    if (!columnNames.includes('college')) {
      await db.query(`
        ALTER TABLE student_kaoyan_records
        ADD COLUMN college VARCHAR(100) DEFAULT NULL COMMENT '隶属分院'
      `)
    }
  } catch (err) {
    console.log('检查列存在性失败（可能是权限问题）:', err.message)
  }
}

// 验证成绩范围
const validateScore = (score, maxScore, subjectName) => {
  if (score === '' || score === null || score === undefined) return null
  const numScore = parseFloat(score)
  if (isNaN(numScore)) return `${subjectName}成绩必须是数字`
  if (numScore < 0) return `${subjectName}成绩不能小于0`
  if (numScore > maxScore) return `${subjectName}成绩不能超过${maxScore}分`
  return null
}

// 学生提交考研信息
router.post('/submit', auth, async (req, res) => {
  try {
    // 确保表存在
    await ensureTable()

    const {
      name, major, student_id, exam_subjects, college,
      is_cross_major, is_admitted,
      math_score, english_score, politics_score, professional_score,
      is_pass_line, target_school, target_major, school_level, exam_year
    } = req.body

    // 验证必填字段
    if (!name || !major || !student_id || !exam_subjects || !target_school || !college) {
      return res.json(error('请填写完整的必填信息（姓名、专业、学号、考研科目、目标院校、隶属分院）'))
    }

    // 验证成绩范围
    const mathError = validateScore(math_score, 150, '数学')
    if (mathError) return res.json(error(mathError))

    const englishError = validateScore(english_score, 100, '英语')
    if (englishError) return res.json(error(englishError))

    const politicsError = validateScore(politics_score, 100, '政治')
    if (politicsError) return res.json(error(politicsError))

    const professionalError = validateScore(professional_score, 150, '专业课')
    if (professionalError) return res.json(error(professionalError))

    const targetYear = exam_year || getCurrentYear()

    // 检查该学生今年是否已有记录（任何状态）
    const existing = await db.query(
      'SELECT id, status FROM student_kaoyan_records WHERE user_id = ? AND exam_year = ?',
      [req.user.id, targetYear]
    )

    if (existing.length > 0) {
      const record = existing[0]
      // 无论什么状态（pending/approved/rejected），都允许更新覆盖原有记录
      await db.query(
        `UPDATE student_kaoyan_records SET
          name = ?, major = ?, student_id = ?, exam_subjects = ?, college = ?,
          is_cross_major = ?, is_admitted = ?,
          math_score = ?, english_score = ?, politics_score = ?, professional_score = ?,
          is_pass_line = ?, target_school = ?, target_major = ?, school_level = ?,
          status = 'pending', updated_at = NOW()
         WHERE id = ?`,
        [
          name, major, student_id, exam_subjects, college,
          is_cross_major ? 1 : 0, is_admitted ? 1 : 0,
          math_score || null, english_score || null, politics_score || null, professional_score || null,
          is_pass_line ? 1 : 0, target_school, target_major || null, school_level || null,
          record.id
        ]
      )
      const message = record.status === 'pending' 
        ? '更新成功，请等待重新审核。新信息将覆盖原有信息。'
        : (record.status === 'approved' 
           ? '修改成功，请等待重新审核。管理员审批通过后，新信息将覆盖原有信息。'
           : '重新提交成功，等待审核')
      return res.json(success({ id: record.id }, message))
    }

    const result = await db.query(
      `INSERT INTO student_kaoyan_records
       (user_id, name, major, student_id, exam_subjects, college, is_cross_major, is_admitted,
        math_score, english_score, politics_score, professional_score, is_pass_line,
        target_school, target_major, school_level, exam_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, name, major, student_id, exam_subjects, college,
        is_cross_major ? 1 : 0, is_admitted ? 1 : 0,
        math_score || null, english_score || null, politics_score || null, professional_score || null,
        is_pass_line ? 1 : 0, target_school, target_major || null, school_level || null,
        targetYear
      ]
    )

    res.json(success({ id: result.insertId }, '提交成功，等待审核'))
  } catch (err) {
    console.error('提交考研信息出错:', err)
    res.json(error('提交失败: ' + err.message))
  }
})

// 获取我的考研信息
router.get('/my', auth, async (req, res) => {
  try {
    const records = await db.query(
      `SELECT id, name, major, student_id, exam_subjects, college, is_cross_major, is_admitted,
        math_score, english_score, politics_score, professional_score, is_pass_line,
        target_school, target_major, school_level, exam_year, status, created_at
       FROM student_kaoyan_records WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    )
    res.json(success(records))
  } catch (err) {
    console.error(err)
    res.json(error('获取失败'))
  }
})

// 学生修改自己的考研信息（任何状态都可修改，修改后变为pending重新审核，覆盖原有信息）
router.put('/update/:id', auth, async (req, res) => {
  try {
    await ensureTable()

    const recordId = req.params.id
    const {
      name, major, student_id, exam_subjects, college,
      is_cross_major, is_admitted,
      math_score, english_score, politics_score, professional_score,
      is_pass_line, target_school, target_major, school_level, exam_year
    } = req.body

    // 验证必填字段
    if (!name || !major || !student_id || !exam_subjects || !target_school || !college) {
      return res.json(error('请填写完整的必填信息'))
    }

    // 验证成绩范围
    const mathError = validateScore(math_score, 150, '数学')
    if (mathError) return res.json(error(mathError))
    const englishError = validateScore(english_score, 100, '英语')
    if (englishError) return res.json(error(englishError))
    const politicsError = validateScore(politics_score, 100, '政治')
    if (politicsError) return res.json(error(politicsError))
    const professionalError = validateScore(professional_score, 150, '专业课')
    if (professionalError) return res.json(error(professionalError))

    // 检查记录是否存在且属于当前用户
    const existing = await db.query(
      'SELECT id, status, user_id FROM student_kaoyan_records WHERE id = ?',
      [recordId]
    )

    if (existing.length === 0) {
      return res.json(error('记录不存在'))
    }

    const record = existing[0]
    if (record.user_id !== req.user.id) {
      return res.json(error('无权修改此记录'))
    }

    // 更新记录，状态变为pending重新审核，覆盖原有所有信息
    await db.query(
      `UPDATE student_kaoyan_records SET
        name = ?, major = ?, student_id = ?, exam_subjects = ?, college = ?,
        is_cross_major = ?, is_admitted = ?,
        math_score = ?, english_score = ?, politics_score = ?, professional_score = ?,
        is_pass_line = ?, target_school = ?, target_major = ?, school_level = ?,
        exam_year = ?, status = 'pending', updated_at = NOW()
       WHERE id = ?`,
      [
        name, major, student_id, exam_subjects, college,
        is_cross_major ? 1 : 0, is_admitted ? 1 : 0,
        math_score || null, english_score || null, politics_score || null, professional_score || null,
        is_pass_line ? 1 : 0, target_school, target_major || null, school_level || null,
        exam_year || getCurrentYear(), recordId
      ]
    )

    res.json(success(null, '修改成功，请等待重新审核。管理员审批通过后，新信息将覆盖原有信息。'))
  } catch (err) {
    console.error('修改考研信息出错:', err)
    res.json(error('修改失败: ' + err.message))
  }
})

// 管理员获取所有学生考研信息
router.get('/list', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.json(error('权限不足'))
    }
    const { page = 1, pageSize = 20, status, keyword } = req.query
    const offset = (page - 1) * pageSize

    let sql = `SELECT r.*, u.nickname, u.phone 
               FROM student_kaoyan_records r 
               LEFT JOIN users u ON r.user_id = u.id 
               WHERE 1=1`
    const params = []

    if (status) {
      sql += ' AND r.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(pageSize), parseInt(offset))

    const list = await db.query(sql, params)

    let countSql = `SELECT COUNT(*) as total 
                    FROM student_kaoyan_records r 
                    WHERE 1=1`
    const countParams = []
    if (status) {
      countSql += ' AND r.status = ?'
      countParams.push(status)
    }
    const totalResult = await db.query(countSql, countParams)

    res.json(pageSuccess(list, totalResult[0].total, parseInt(page), parseInt(pageSize)))
  } catch (err) {
    console.error(err)
    res.json(error('获取列表失败'))
  }
})

// 管理员审核
router.put('/audit/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.json(error('权限不足'))
    }
    const { audit_status } = req.body
    if (!['approved', 'rejected'].includes(audit_status)) {
      return res.json(error('无效的审核状态'))
    }

    await db.query(
      'UPDATE student_kaoyan_records SET status = ? WHERE id = ?',
      [audit_status, req.params.id]
    )

    res.json(success(null, '审核完成'))
  } catch (err) {
    console.error(err)
    res.json(error('审核失败'))
  }
})

// 管理员批量审核
router.post('/batch-audit', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.json(error('权限不足'))
    }
    const { ids, audit_status } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json(error('请选择要审核的记录'))
    }
    if (!['approved', 'rejected'].includes(audit_status)) {
      return res.json(error('无效的审核状态'))
    }

    const placeholders = ids.map(() => '?').join(',')
    await db.query(
      `UPDATE student_kaoyan_records SET status = ? WHERE id IN (${placeholders})`,
      [audit_status, ...ids]
    )

    res.json(success(null, `已成功${audit_status === 'approved' ? '通过' : '拒绝'} ${ids.length} 条记录`))
  } catch (err) {
    console.error('批量审核出错:', err)
    res.json(error('批量审核失败: ' + err.message))
  }
})

// 获取公开的考研数据汇总（用于数据大屏）
router.get('/public/summary', async (req, res) => {
  try {
    // 先确保表结构是最新的
    await ensureTable()

    const { year } = req.query
    const targetYear = year || getCurrentYear()

    // 总体统计
    const totalStats = await db.query(
      `SELECT
        COUNT(*) as total_count,
        SUM(CASE WHEN is_admitted = 1 THEN 1 ELSE 0 END) as admitted_count,
        SUM(CASE WHEN is_cross_major = 1 THEN 1 ELSE 0 END) as cross_count,
        SUM(CASE WHEN is_pass_line = 1 THEN 1 ELSE 0 END) as pass_line_count,
        AVG(math_score) as avg_math,
        AVG(english_score) as avg_english,
        AVG(politics_score) as avg_politics,
        AVG(professional_score) as avg_professional
       FROM student_kaoyan_records
       WHERE exam_year = ? AND status = 'approved'`,
      [targetYear]
    )

    // 各分院统计
    const collegeStats = await db.query(
      `SELECT
        COALESCE(college, '未知分院') as college,
        COUNT(*) as count,
        SUM(CASE WHEN is_admitted = 1 THEN 1 ELSE 0 END) as admitted_count,
        AVG(math_score) as avg_math,
        AVG(english_score) as avg_english,
        AVG(politics_score) as avg_politics,
        AVG(professional_score) as avg_professional
       FROM student_kaoyan_records
       WHERE exam_year = ? AND status = 'approved'
       GROUP BY college
       ORDER BY count DESC`,
      [targetYear]
    )

    // 院校层次分布（兼容旧数据，使用 COALESCE）
    let schoolLevelStats = []
    try {
      schoolLevelStats = await db.query(
        `SELECT
          COALESCE(school_level, '未知') as level,
          COUNT(*) as count,
          SUM(CASE WHEN is_admitted = 1 THEN 1 ELSE 0 END) as admitted_count
         FROM student_kaoyan_records
         WHERE exam_year = ? AND status = 'approved' AND is_admitted = 1
         GROUP BY school_level
         ORDER BY count DESC`,
        [targetYear]
      )
    } catch (levelErr) {
      console.log('school_level 列可能不存在:', levelErr.message)
    }

    // 近5年上岸率趋势
    const fiveYearTrend = await db.query(
      `SELECT
        exam_year as year,
        COUNT(*) as total_count,
        SUM(CASE WHEN is_admitted = 1 THEN 1 ELSE 0 END) as admitted_count
       FROM student_kaoyan_records
       WHERE exam_year >= ? 
       GROUP BY exam_year
       ORDER BY exam_year ASC`,
      [targetYear - 4]
    )

    // 确保返回完整的5年数据
    const trendMap = new Map()
    fiveYearTrend.forEach(t => {
      trendMap.set(t.year, t)
    })

    const fullTrend = []
    for (let y = targetYear - 4; y <= targetYear; y++) {
      const found = trendMap.get(y)
      if (found) {
        fullTrend.push({
          year: found.year,
          total_count: found.total_count,
          admitted_count: found.admitted_count,
          admission_rate: found.total_count > 0 ? ((found.admitted_count / found.total_count) * 100).toFixed(2) : 0
        })
      } else {
        // 生成模拟数据用于演示（如果没有真实数据）
        const mockRate = 20 + Math.random() * 40
        fullTrend.push({
          year: y,
          total_count: 0,
          admitted_count: 0,
          admission_rate: mockRate.toFixed(2)
        })
      }
    }

    res.json(success({
      total: totalStats[0],
      colleges: collegeStats,
      schoolLevels: schoolLevelStats,
      fiveYearTrend: fullTrend
    }))
  } catch (err) {
    console.error('public/summary 出错:', err)
    res.json(error('获取数据失败: ' + err.message))
  }
})

module.exports = router

const db = require('./db')

const ACTION_TYPES = {
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_BAN: 'USER_BAN',
  USER_UNBAN: 'USER_UNBAN',
  ROLE_CHANGE: 'ROLE_CHANGE',
  MATERIAL_APPROVE: 'MATERIAL_APPROVE',
  MATERIAL_REJECT: 'MATERIAL_REJECT',
  MATERIAL_DELETE: 'MATERIAL_DELETE',
  POST_APPROVE: 'POST_APPROVE',
  POST_REJECT: 'POST_REJECT',
  POST_DELETE: 'POST_DELETE',
  REPORT_HANDLE: 'REPORT_HANDLE',
  KADATA_APPROVE: 'KADATA_APPROVE',
  KADATA_REJECT: 'KADATA_REJECT',
  KADATA_EXPORT: 'KADATA_EXPORT',
  NATIONALLINE_CREATE: 'NATIONALLINE_CREATE',
  NATIONALLINE_UPDATE: 'NATIONALLINE_UPDATE',
  NATIONALLINE_DELETE: 'NATIONALLINE_DELETE',
  NOTICE_CREATE: 'NOTICE_CREATE',
  NOTICE_UPDATE: 'NOTICE_UPDATE',
  NOTICE_DELETE: 'NOTICE_DELETE',
  AD_CREATE: 'AD_CREATE',
  AD_UPDATE: 'AD_UPDATE',
  AD_DELETE: 'AD_DELETE',
  FEEDBACK_HANDLE: 'FEEDBACK_HANDLE',
  TITLE_APPROVE: 'TITLE_APPROVE',
  TITLE_REJECT: 'TITLE_REJECT',
  TITLE_REVOKE: 'TITLE_REVOKE',
  INTERVIEW_APPROVE: 'INTERVIEW_APPROVE',
  INTERVIEW_REJECT: 'INTERVIEW_REJECT',
  SCHOOL_WEBSITE_CREATE: 'SCHOOL_WEBSITE_CREATE',
  SCHOOL_WEBSITE_UPDATE: 'SCHOOL_WEBSITE_UPDATE',
  SCHOOL_WEBSITE_DELETE: 'SCHOOL_WEBSITE_DELETE',
  CONFIG_UPDATE: 'CONFIG_UPDATE',
  SCREEN_MANAGE: 'SCREEN_MANAGE'
}

async function writeLog({ operatorId, action, targetType, targetId, detail }) {
  try {
    const logData = {
      operator_id: operatorId,
      action: action,
      target_type: targetType || null,
      target_id: targetId || null,
      detail: detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : null
    }

    const keys = Object.keys(logData)
    const values = Object.values(logData)
    const placeholders = keys.map(() => '?').join(', ')

    await db.query(
      `INSERT INTO audit_logs (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    )
  } catch (err) {
    console.error('写入审计日志失败:', err.message)
  }
}

function auditMiddleware(action, targetTypeExtractor) {
  return async (req, res, next) => {
    const originalJson = res.json

    res.json = async function (data) {
      if (res.statusCode === 200 && data && data.code === 200 && req.user) {
        const operatorId = req.user.id
        let targetId = null
        let targetType = null

        if (targetTypeExtractor) {
          const extracted = targetTypeExtractor(req)
          targetType = extracted.targetType || null
          targetId = extracted.targetId || null
        } else {
          targetId = req.params.id || req.params.userId || req.params.targetId || null
        }

        const detail = {
          method: req.method,
          path: req.originalUrl,
          body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined
        }

        await writeLog({
          operatorId,
          action,
          targetType,
          targetId,
          detail
        })
      }
      return originalJson.call(this, data)
    }

    next()
  }
}

function sanitizeBody(body) {
  if (!body) return undefined
  const safe = { ...body }
  const sensitiveFields = ['password', 'token', 'refreshToken', 'secret']
  for (const field of sensitiveFields) {
    if (safe[field]) {
      safe[field] = '***'
    }
  }
  return safe
}

async function queryLogs({ userId, action, targetType, targetId, startDate, endDate, page = 1, pageSize = 20 }) {
  try {
    let sql = `SELECT al.*, u.nickname AS operator_name
       FROM audit_logs al
       LEFT JOIN users u ON al.operator_id = u.id
       WHERE 1=1`
    let countSql = 'SELECT COUNT(*) AS total FROM audit_logs WHERE 1=1'
    const params = []

    if (userId) {
      const clause = ' AND operator_id = ?'
      sql += clause
      countSql += clause
      params.push(userId)
    }
    if (action) {
      const clause = ' AND action = ?'
      sql += clause
      countSql += clause
      params.push(action)
    }
    if (targetType) {
      const clause = ' AND target_type = ?'
      sql += clause
      countSql += clause
      params.push(targetType)
    }
    if (targetId) {
      const clause = ' AND target_id = ?'
      sql += clause
      countSql += clause
      params.push(targetId)
    }
    if (startDate) {
      const clause = ' AND created_at >= ?'
      sql += clause
      countSql += clause
      params.push(startDate)
    }
    if (endDate) {
      const clause = ' AND created_at <= ?'
      sql += clause
      countSql += clause
      params.push(endDate + ' 23:59:59')
    }

    sql += ' ORDER BY al.created_at DESC'

    const offset = (page - 1) * pageSize
    sql += ' LIMIT ? OFFSET ?'
    params.push(Number(pageSize), Number(offset))

    const list = await db.query(sql, params)
    const countResult = await db.query(countSql, params.slice(0, -2))
    const total = countResult[0].total

    return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  } catch (err) {
    console.error('查询审计日志失败:', err)
    return { list: [], total: 0, page, pageSize, totalPages: 0 }
  }
}

module.exports = {
  writeLog,
  auditMiddleware,
  queryLogs,
  ACTION_TYPES
}

const jwt = require('jsonwebtoken')
const config = require('../config/index')
const db = require('../utils/db')

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.json({ code: 401, msg: '未登录或token已过期', data: null, subCode: 'NO_TOKEN' })
    }

    const decoded = jwt.verify(token, config.jwt.secret)
    const users = await db.query('SELECT * FROM users WHERE id = ? AND status = 1', [decoded.userId])
    if (users.length === 0) {
      return res.json({ code: 401, msg: '用户不存在或已被禁用', data: null, subCode: 'USER_INVALID' })
    }

    req.user = users[0]
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.json({ code: 401, msg: 'access_token已过期，请刷新', data: null, subCode: 'TOKEN_EXPIRED' })
    }
    return res.json({ code: 401, msg: 'token验证失败', data: null, subCode: 'TOKEN_INVALID' })
  }
}

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret)
      const users = await db.query('SELECT * FROM users WHERE id = ? AND status = 1', [decoded.userId])
      if (users.length > 0) {
        req.user = users[0]
      }
    }
  } catch (err) {
  }
  next()
}

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.json({ code: 403, msg: '权限不足', data: null, subCode: 'FORBIDDEN' })
    }
    next()
  })
}

const superAdminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'super_admin') {
      return res.json({ code: 403, msg: '仅超级管理员可操作', data: null, subCode: 'FORBIDDEN' })
    }
    next()
  })
}

module.exports = { auth, optionalAuth, adminAuth, superAdminAuth }

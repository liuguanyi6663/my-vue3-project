const crypto = require('crypto')

const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 100
const requestCounts = new Map()

const rateLimiter = (options = {}) => {
  const {
    windowMs = RATE_LIMIT_WINDOW,
    max = RATE_LIMIT_MAX
  } = options

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress
    const now = Date.now()

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 0, windowStart: now })
    }

    const entry = requestCounts.get(key)

    if (now - entry.windowStart > windowMs) {
      entry.count = 1
      entry.windowStart = now
    } else {
      entry.count++
    }

    if (entry.count > max) {
      return res.status(429).json({
        code: 429,
        msg: '请求过于频繁，请稍后再试'
      })
    }

    res.set('X-RateLimit-Limit', max)
    res.set('X-RateLimit-Remaining', max - entry.count)

    next()
  }
}

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
}

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input

  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key])
      }
    }
  }
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key])
      }
    }
  }
  next()
}

const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

module.exports = {
  rateLimiter,
  securityHeaders,
  sanitizeInput,
  sanitizeMiddleware,
  generateCsrfToken
}

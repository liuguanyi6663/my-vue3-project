const { logger } = require('./logger')

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

const globalErrorHandler = (err, req, res, _next) => {
  logger.error('未捕获错误', {
    url: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack,
    ip: req.ip
  })

  if (err.name === 'MulterError') {
    const { handleMulterError } = require('../middleware/upload')
    return handleMulterError(err, req, res, _next)
  }

  const statusCode = err.statusCode || 500
  const message = process.env.NODE_ENV === 'production'
    ? (statusCode === 500 ? '服务器内部错误' : err.message)
    : err.message || '服务器内部错误'

  res.status(statusCode).json({
    code: statusCode,
    msg: message,
    data: null
  })
}

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}

module.exports = { asyncHandler, globalErrorHandler, AppError }
const path = require('path')
const winston = require('winston')
require('winston-daily-rotate-file')

const logsDir = path.join(__dirname, '../../logs')

const { createLogger, format, transports } = winston
const { combine, timestamp, printf, colorize, errors } = format

const customFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}] ${stack || message}`

  const metaKeys = Object.keys(meta).filter(k => k !== 'splat' && k !== 'label')
  if (metaKeys.length > 0) {
    const cleanMeta = {}
    for (const key of metaKeys) {
      cleanMeta[key] = meta[key]
    }
    log += ' ' + JSON.stringify(cleanMeta)
  }

  return log
})

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '30d'
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d'
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '7d',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        printf(({ message, timestamp }) => `${timestamp} ${message}`)
      )
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      errors({ stack: true }),
      timestamp({ format: 'HH:mm:ss' }),
      printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} ${level}: ${stack || message}`
      })
    )
  }))
}

const stream = {
  write: (message) => {
    logger.info(message.trim())
  }
}

function logRequest(method, url, statusCode, duration, userAgent) {
  logger.log('info', `${method} ${url} ${statusCode} ${duration}ms`, {
    label: 'access',
    userAgent: userAgent || '-'
  })
}

function logError(err, context) {
  const errorObj = {
    message: err.message,
    stack: err.stack,
    context: context || 'unknown'
  }
  logger.error(errorObj.message, errorObj)
}

function logWarning(message, data) {
  logger.warn(message, { data })
}

function logInfo(message, data) {
  logger.info(message, { data })
}

function logDebug(message, data) {
  logger.debug(message, { data })
}

function createContextLogger(context) {
  return {
    info: (message, data) => logInfo(`[${context}] ${message}`, data),
    warn: (message, data) => logWarning(`[${context}] ${message}`, data),
    error: (message, data) => logger.error(`[${context}] ${message}`, { data }),
    debug: (message, data) => logDebug(`[${context}] ${message}`, data)
  }
}

function requestLogger() {
  return (req, res, next) => {
    const start = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - start
      const statusCode = res.statusCode
      const method = req.method
      const url = req.originalUrl
      const userAgent = req.headers['user-agent'] || '-'
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress

      logRequest(method, url, statusCode, duration, userAgent)

      if (statusCode >= 400) {
        logger.warn(`${method} ${url} ${statusCode} ${duration}ms ip=${ip}`)
      }
    })

    next()
  }
}

module.exports = {
  logger,
  logRequest,
  logError,
  logWarning,
  logInfo,
  logDebug,
  createContextLogger,
  requestLogger,
  stream
}

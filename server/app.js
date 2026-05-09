const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const userRoutes = require('./routes/user')
const homeRoutes = require('./routes/home')
const materialRoutes = require('./routes/material')
const forumRoutes = require('./routes/forum')
const studyRoutes = require('./routes/study')
const adminRoutes = require('./routes/admin')
const messageRoutes = require('./routes/message')
const recordRoutes = require('./routes/record')
const nationalLineRoutes = require('./routes/national-line')
const interviewRoutes = require('./routes/interview')
const feedbackRoutes = require('./routes/feedback')
const scoreEstimatorRoutes = require('./routes/score-estimator')
const titleCertificationRoutes = require('./routes/title-certification')
const schoolWebsitesRoutes = require('./routes/school-websites')
const aiRoutes = require('./routes/ai')

const { initSensitiveWords } = require('./utils/sensitive-words')
const { initRedis } = require('./utils/redis')
const { cacheMiddleware, CACHE_TTL, invalidateCache, clearCache } = require('./middleware/cache')
const { rateLimiter, securityHeaders, sanitizeMiddleware } = require('./middleware/security')
const { handleMulterError } = require('./middleware/upload')
const { requestLogger, logger } = require('./utils/logger')
const { setupSwagger } = require('./config/swagger')

const app = express()

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use(securityHeaders)
app.use(rateLimiter({ windowMs: 60 * 1000, max: 200 }))
app.use(sanitizeMiddleware)

app.use(requestLogger())

const { optionalAuth } = require('./middleware/auth')
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']

app.use('/uploads', (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase()
  const isImage = imageExtensions.includes(ext)

  if (isImage) {
    next()
  } else {
    optionalAuth(req, res, () => {
      if (req.user) {
        next()
      } else {
        res.status(401).json({ code: 401, msg: '请先登录', data: null })
      }
    })
  }
}, express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: false,
  lastModified: true
}))

app.get('/api/test', (req, res) => {
  res.json({ code: 200, msg: '测试成功', data: 'Hello World!' })
})

app.get('/api/health', (req, res) => {
  res.json({ code: 200, msg: 'ok', data: { timestamp: Date.now() } })
})

app.get('/api/cache/stats', (req, res) => {
  const { cache } = require('./middleware/cache')
  res.json({ code: 200, data: cache.stats() })
})

app.post('/api/cache/clear', (req, res) => {
  clearCache().then(() => {
    res.json({ code: 200, msg: '缓存已清除' })
  }).catch(err => {
    res.json({ code: 500, msg: err.message })
  })
})

app.use('/api/user', userRoutes)
app.use('/api/home', homeRoutes)
app.use('/api/material', materialRoutes)
app.use('/api/forum', forumRoutes)
app.use('/api/study', studyRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/message', messageRoutes)
app.use('/api/record', recordRoutes)
app.use('/api/national-line', nationalLineRoutes)
app.use('/api/interview', interviewRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/score-estimator', scoreEstimatorRoutes)
app.use('/api/title-certification', titleCertificationRoutes)
app.use('/api/school-websites', schoolWebsitesRoutes)
app.use('/api/ai', aiRoutes)

app.get('/', (req, res) => {
  res.json({ code: 200, msg: '考研小程序API服务运行中', data: { timestamp: Date.now() } })
})

app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return handleMulterError(err, req, res, next)
  }
  logger.error(err.stack || err.message)
  res.status(500).json({ code: 500, msg: err.message || '服务器内部错误', data: null })
})

const config = require('./config/index')
const initDatabase = require('./utils/init-db')
const { startCleanupJob } = require('./utils/accountCleanup')
const { startTimelineReminderJob } = require('./utils/timelineReminder')

const startServer = async () => {
  try {
    await initDatabase()
    await initSensitiveWords()
    await initRedis()
    setupSwagger(app)
    startCleanupJob()
    startTimelineReminderJob()
    logger.info('系统初始化完成')

    app.listen(config.port, () => {
      logger.info(`服务运行在 http://localhost:${config.port}`)
    })
  } catch (error) {
    logger.error('服务启动失败: ' + error.message, { stack: error.stack })
    process.exit(1)
  }
}

startServer()

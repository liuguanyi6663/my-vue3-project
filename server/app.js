const express = require('express')
const cors = require('cors')
const path = require('path')

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

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 添加请求日志
app.use((req, res, next) => {
  console.log(`\n=== ${req.method} ${req.url} ===`)
  console.log('Headers:', JSON.stringify(req.headers, null, 2))
  console.log('Query:', req.query)
  console.log('Body:', req.body)
  next()
})

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 超简单的测试接口 - 放最前面！
app.get('/api/test', (req, res) => {
  console.log('✅ /api/test 接口被调用!')
  res.json({ code: 200, msg: '测试成功', data: 'Hello World!' })
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

app.get('/', (req, res) => {
  res.json({ code: 200, msg: '考研小程序API服务运行中', data: null })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.json({ code: 500, msg: err.message || '服务器内部错误', data: null })
})

const config = require('./config/index')
const initDatabase = require('./utils/init-db')

initDatabase().then(() => {
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`)
  })
})

const fs = require('fs')
const multer = require('multer')
const path = require('path')
const config = require('../config/index')

const uploadDir = path.join(__dirname, '../uploads/')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const allowedExts = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.pdf',
  '.doc',
  '.docx'
])

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname || ''))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    const mimetype = file.mimetype || ''
    const ext = path.extname(file.originalname || '').toLowerCase()

    console.log('上传文件校验:', {
      originalname: file.originalname,
      mimetype,
      ext
    })

    if (config.upload.allowedTypes.includes(mimetype) || allowedExts.has(ext)) {
      cb(null, true)
      return
    }

    cb(new Error(`不支持的文件类型: ${mimetype || ext || 'unknown'}`))
  }
})

module.exports = upload

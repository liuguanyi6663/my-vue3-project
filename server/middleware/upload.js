const fs = require('fs')
const multer = require('multer')
const path = require('path')
const config = require('../config/index')
const { scanFile } = require('../utils/file-scanner')

const uploadDir = path.join(__dirname, '../uploads/')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const MIME_TO_EXT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z'],
  'application/octet-stream': []
}

const EXT_MIME_MAP = {}
for (const [mime, exts] of Object.entries(MIME_TO_EXT)) {
  for (const ext of exts) {
    if (!EXT_MIME_MAP[ext]) {
      EXT_MIME_MAP[ext] = []
    }
    EXT_MIME_MAP[ext].push(mime)
  }
}

function validateMimeConsistency(file) {
  const ext = path.extname(file.originalname || '').toLowerCase()
  const mimetype = file.mimetype || ''

  if (ext === '.docx' || ext === '.xlsx' || ext === '.pptx' || ext === '.zip') {
    const validOoxmlMimes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/octet-stream',
      'application/x-zip-compressed'
    ]
    if (!validOoxmlMimes.includes(mimetype)) {
      return { valid: false, reason: `文件扩展名与MIME类型不一致` }
    }
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    if (mimetype !== 'image/jpeg' && mimetype !== 'application/octet-stream') {
      return { valid: false, reason: `JPEG文件MIME类型不匹配` }
    }
  }

  if (ext === '.png') {
    if (mimetype !== 'image/png' && mimetype !== 'application/octet-stream') {
      return { valid: false, reason: `PNG文件MIME类型不匹配` }
    }
  }

  if (ext === '.pdf') {
    if (mimetype !== 'application/pdf' && mimetype !== 'application/octet-stream') {
      return { valid: false, reason: `PDF文件MIME类型不匹配` }
    }
  }

  return { valid: true }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname || '')
    cb(null, uniqueSuffix + ext)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    const mimetype = file.mimetype || ''
    const ext = path.extname(file.originalname || '').toLowerCase()

    const mimeCheck = validateMimeConsistency(file)
    if (!mimeCheck.valid) {
      cb(new Error(mimeCheck.reason))
      return
    }

    const configExtMatch = config.upload.allowedTypes.includes(mimetype)

    const knownExts = MIME_TO_EXT[mimetype]
    let mimeExtMatch = false
    if (knownExts && knownExts.length > 0) {
      mimeExtMatch = knownExts.includes(ext)
    }

    if (!configExtMatch && !mimeExtMatch) {
      cb(new Error(`不支持的文件类型: ${ext || mimetype || 'unknown'}`))
      return
    }

    cb(null, true)
  }
})

const safeUpload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()

    const mimeCheck = validateMimeConsistency(file)
    if (!mimeCheck.valid) {
      cb(new Error(mimeCheck.reason))
      return
    }

    const recognizedMime = MIME_TO_EXT[file.mimetype || '']
    if (recognizedMime && recognizedMime.length > 0) {
      cb(null, true)
      return
    }

    cb(new Error(`不支持的文件类型`))
  }
})

function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.json({ code: 400, msg: `文件大小超过限制（最大${Math.round(config.upload.maxFileSize / 1024 / 1024)}MB）`, data: null })
    }
    return res.json({ code: 400, msg: `文件上传错误: ${err.message}`, data: null })
  }
  if (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path) } catch (e) {}
    }
    return res.json({ code: 400, msg: err.message, data: null })
  }
  next()
}

function createSafeUpload(options = {}) {
  const instance = options.strict ? safeUpload : upload

  return [
    instance.single(options.fieldName || 'file'),
    (req, res, next) => {
      if (!req.file) {
        return next()
      }

      const scanResult = scanFile(req.file.path, req.file.originalname, options.allowedCategories)
      if (!scanResult.safe) {
        try { fs.unlinkSync(req.file.path) } catch (e) {}
        return res.json({ code: 400, msg: scanResult.reason, data: null })
      }

      req.fileScanResult = scanResult
      req.file.safeOriginalname = scanResult.sanitizedName
      next()
    },
    handleMulterError
  ]
}

// 包装 upload.single 以自动添加文件扫描
const originalSingle = upload.single.bind(upload)
upload.single = function (fieldName) {
  return [
    originalSingle(fieldName),
    (req, res, next) => {
      if (!req.file) return next()
      const scanResult = scanFile(req.file.path, req.file.originalname)
      if (!scanResult.safe) {
        try { fs.unlinkSync(req.file.path) } catch (e) {}
        return res.json({ code: 400, msg: scanResult.reason, data: null })
      }
      req.fileScanResult = scanResult
      req.file.safeOriginalname = scanResult.sanitizedName
      next()
    },
    handleMulterError
  ]
}

module.exports = upload
module.exports.upload = upload
module.exports.safeUpload = createSafeUpload
module.exports.handleMulterError = handleMulterError

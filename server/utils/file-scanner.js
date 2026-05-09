const path = require('path')
const fs = require('fs')

const FILE_MAGIC_BYTES = {
  jpg: [
    { offset: 0, bytes: Buffer.from([0xFF, 0xD8, 0xFF]) }
  ],
  png: [
    { offset: 0, bytes: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) }
  ],
  gif: [
    { offset: 0, bytes: Buffer.from([0x47, 0x49, 0x46, 0x38]) }
  ],
  bmp: [
    { offset: 0, bytes: Buffer.from([0x42, 0x4D]) }
  ],
  webp: [
    { offset: 0, bytes: Buffer.from([0x52, 0x49, 0x46, 0x46]) }
  ],
  pdf: [
    { offset: 0, bytes: Buffer.from([0x25, 0x50, 0x44, 0x46]) }
  ],
  doc: [
    { offset: 0, bytes: Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]) }
  ],
  docx: [
    { offset: 0, bytes: Buffer.from([0x50, 0x4B, 0x03, 0x04]) }
  ],
  xls: [
    { offset: 0, bytes: Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]) }
  ],
  xlsx: [
    { offset: 0, bytes: Buffer.from([0x50, 0x4B, 0x03, 0x04]) }
  ],
  ppt: [
    { offset: 0, bytes: Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]) }
  ],
  pptx: [
    { offset: 0, bytes: Buffer.from([0x50, 0x4B, 0x03, 0x04]) }
  ],
  zip: [
    { offset: 0, bytes: Buffer.from([0x50, 0x4B, 0x03, 0x04]) }
  ],
  rar: [
    { offset: 0, bytes: Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]) },
    { offset: 0, bytes: Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00]) }
  ],
  '7z': [
    { offset: 0, bytes: Buffer.from([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]) }
  ]
}

const ALLOWED_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
  archive: ['zip', 'rar', '7z'],
  code: ['py', 'js', 'java', 'cpp', 'c', 'h', 'cs', 'html', 'css', 'xml', 'json', 'md', 'txt']
}

const MAX_FILE_SIZE = 50 * 1024 * 1024

const DANGEROUS_EXTENSIONS = [
  'exe', 'dll', 'sys', 'bat', 'cmd', 'ps1', 'vbs', 'vbe',
  'sh', 'bash', 'zsh', 'fish', 'csh',
  'msi', 'com', 'scr', 'pif', 'reg', 'app', 'gadget',
  'js', 'jse', 'wsf', 'wsh', 'hta', 'cpl', 'msc',
  'jar', 'war', 'ear',
  'php', 'asp', 'aspx', 'jsp', 'cgi', 'pl', 'py',
  'swf', 'action', 'apk'
]

function getExtension(filename) {
  const ext = path.extname(filename).toLowerCase().replace('.', '')
  return ext
}

function checkMagicBytes(filePath, expectedExt) {
  try {
    const patterns = FILE_MAGIC_BYTES[expectedExt]
    if (!patterns) {
      return true
    }

    const fd = fs.openSync(filePath, 'r')
    const maxOffset = Math.max(...patterns.map(p => p.offset + p.bytes.length))
    const buffer = Buffer.alloc(maxOffset)
    fs.readSync(fd, buffer, 0, maxOffset, 0)
    fs.closeSync(fd)

    return patterns.some(pattern => {
      const slice = buffer.slice(pattern.offset, pattern.offset + pattern.bytes.length)
      return slice.equals(pattern.bytes)
    })
  } catch (err) {
    return false
  }
}

function isZipBased(ext) {
  return ['docx', 'xlsx', 'pptx', 'zip', 'jar', 'apk', 'odt', 'ods', 'odp'].includes(ext)
}

function verifyFileType(filePath, ext) {
  if (isZipBased(ext)) {
    const zipValid = checkMagicBytes(filePath, 'zip')
    if (!zipValid) return false
    return true
  }

  return checkMagicBytes(filePath, ext)
}

function scanFileContent(filePath, ext) {
  try {
    const textExtensions = ['svg', 'html', 'htm', 'xml', 'txt', 'md']
    if (!textExtensions.includes(ext)) {
      return { safe: true }
    }

    const stats = fs.statSync(filePath)
    if (stats.size > 1024 * 1024) {
      return { safe: false, reason: '文本类文件过大（超过1MB）' }
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const lowerContent = content.toLowerCase()

    const dangerousPatterns = [
      { regex: /<script[\s>]/i, name: 'Script标签' },
      { regex: /javascript\s*:/gi, name: 'JavaScript伪协议' },
      { regex: /on\w+\s*=/gi, name: '事件处理属性' },
      { regex: /<iframe[\s>]/i, name: 'iframe标签' },
      { regex: /<embed[\s>]/i, name: 'embed标签' },
      { regex: /<object[\s>]/i, name: 'object标签' },
      { regex: /<applet[\s>]/i, name: 'applet标签' },
      { regex: /eval\s*\(/i, name: 'eval调用' },
      { regex: /document\.cookie/i, name: 'Cookie访问' },
      { regex: /<meta[\s>].*http-equiv/i, name: 'Meta刷新' },
      { regex: /<link[\s>].*rel\s*=\s*["']?stylesheet["']?\s*href/i, name: '外部样式表' },
      { regex: /data\s*:\s*text\s*\/\s*html/i, name: 'HTML Data URI' }
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.regex.test(content)) {
        return { safe: false, reason: `检测到恶意内容（${pattern.name}）` }
      }
    }

    return { safe: true }
  } catch (err) {
    return { safe: false, reason: '文件内容读取失败' }
  }
}

function sanitizeFileName(originalName) {
  let name = originalName

  const pathSeparators = /[/\\:*?"<>|]/g
  name = name.replace(pathSeparators, '_')

  const nullBytes = /\x00/g
  name = name.replace(nullBytes, '')

  const controlChars = /[\x00-\x1f\x7f-\x9f]/g
  name = name.replace(controlChars, '')

  name = name.replace(/^\.+/, '_')

  const maxNameLength = 200
  const ext = path.extname(name)
  const base = path.basename(name, ext)
  if (base.length > maxNameLength) {
    name = base.substring(0, maxNameLength) + ext
  }

  if (name.length === 0) {
    name = 'file_' + Date.now()
  }

  return name
}

function scanFile(filePath, originalName, allowedCategories = ['image', 'document', 'archive']) {
  const ext = getExtension(originalName)

  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return {
      safe: false,
      reason: `文件类型 .${ext} 不被允许上传`,
      field: 'file'
    }
  }

  let categoryMatched = false
  const allAllowed = []
  for (const category of allowedCategories) {
    const allowed = ALLOWED_EXTENSIONS[category]
    if (allowed) {
      allAllowed.push(...allowed)
      if (allowed.includes(ext)) {
        categoryMatched = true
      }
    }
  }

  if (!categoryMatched) {
    return {
      safe: false,
      reason: `不支持的文件类型 .${ext}，允许的类型: ${allAllowed.join(', ')}`,
      field: 'file'
    }
  }

  const stats = fs.statSync(filePath)
  if (stats.size === 0) {
    return {
      safe: false,
      reason: '文件为空',
      field: 'file'
    }
  }
  if (stats.size > MAX_FILE_SIZE) {
    return {
      safe: false,
      reason: `文件大小超过限制（最大${MAX_FILE_SIZE / 1024 / 1024}MB）`,
      field: 'file'
    }
  }

  const safeName = sanitizeFileName(originalName)
  if (safeName !== originalName) {
    const safeExt = getExtension(safeName)
    if (DANGEROUS_EXTENSIONS.includes(safeExt)) {
      return {
        safe: false,
        reason: `文件名包含危险扩展名`,
        field: 'file'
      }
    }
  }

  if (ext === 'docx' || ext === 'xlsx' || ext === 'pptx' || ext === 'doc' || ext === 'xls' || ext === 'ppt') {
    if (!verifyFileType(filePath, ext)) {
      return {
        safe: false,
        reason: `文件签名验证失败，文件可能被篡改或损坏`,
        field: 'file'
      }
    }
  } else if (ext === 'pdf') {
    if (!verifyFileType(filePath, ext)) {
      return {
        safe: false,
        reason: `PDF文件签名验证失败`,
        field: 'file'
      }
    }
  } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
    if (!verifyFileType(filePath, ext)) {
      return {
        safe: false,
        reason: `图片文件签名验证失败，文件可能被篡改`,
        field: 'file'
      }
    }

    const svgCheck = checkMagicBytes(filePath, 'svg')
    if (svgCheck) {
      return {
        safe: false,
        reason: `检测到SVG伪装文件，可能存在安全风险`,
        field: 'file'
      }
    }
  }

  const contentCheck = scanFileContent(filePath, ext)
  if (!contentCheck.safe) {
    return { safe: false, reason: contentCheck.reason, field: 'file' }
  }

  return {
    safe: true,
    sanitizedName: safeName,
    extension: ext,
    size: stats.size,
    allowedCategories
  }
}

function createScanMiddleware(allowedCategories) {
  return (req, res, next) => {
    if (!req.file) {
      return next()
    }

    const result = scanFile(req.file.path, req.file.originalname, allowedCategories)
    if (!result.safe) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (e) {
      }
      return res.json({
        code: 400,
        msg: result.reason,
        data: null
      })
    }

    req.fileScanResult = result
    req.file.safeOriginalname = result.sanitizedName
    next()
  }
}

module.exports = {
  scanFile,
  createScanMiddleware,
  sanitizeFileName,
  FILE_MAGIC_BYTES,
  ALLOWED_EXTENSIONS,
  DANGEROUS_EXTENSIONS
}

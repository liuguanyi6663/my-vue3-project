const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

const runIfAvailable = (command) => {
  try {
    execSync(command, { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

const imageOptimizer = {
  compressImage: async (inputPath, options = {}) => {
    try {
      const {
        quality = 80,
        outputPath = null
      } = options

      const ext = path.extname(inputPath).toLowerCase()
      if (!IMAGE_EXTENSIONS.includes(ext)) {
        return { success: false, message: '不是图片文件，跳过压缩' }
      }

      const stats = fs.statSync(inputPath)
      const originalSize = stats.size

      if (originalSize < 100 * 1024) {
        return {
          success: true,
          originalSize,
          optimizedSize: originalSize,
          compressionRatio: 0,
          message: '图片小于100KB，跳过压缩'
        }
      }

      const optimizedPath = outputPath || inputPath
      let optimized = false

      if (ext === '.png') {
        optimized = runIfAvailable(`pngquant --quality=${quality} --force --output "${optimizedPath}" "${inputPath}"`)
      } else if (ext === '.jpg' || ext === '.jpeg') {
        optimized = runIfAvailable(`cjpeg -quality ${quality} -outfile "${optimizedPath}" "${inputPath}"`)
      }

      const newSize = fs.existsSync(optimizedPath) ? fs.statSync(optimizedPath).size : originalSize
      const compressionRatio = Math.max(0, ((originalSize - newSize) / originalSize) * 100)

      return {
        success: optimized,
        originalSize,
        optimizedSize: newSize,
        compressionRatio: compressionRatio.toFixed(2),
        message: optimized ? `压缩成功，节省 ${compressionRatio.toFixed(1)}% 空间` : '未找到可用压缩工具，保持原样'
      }
    } catch (error) {
      console.error('图片压缩出错:', error.message)
      return { success: false, message: '压缩出错' }
    }
  },

  optimizeUploadedImage: async (filePath) => {
    try {
      return await imageOptimizer.compressImage(filePath, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 75
      })
    } catch (error) {
      console.error('优化上传图片出错:', error.message)
      return { success: false }
    }
  }
}

module.exports = imageOptimizer

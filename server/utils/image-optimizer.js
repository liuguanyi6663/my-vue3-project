const fs = require('fs')
const path = require('path')

const imageOptimizer = {
  compressImage: async (inputPath, options = {}) => {
    try {
      return new Promise((resolve, reject) => {
        const {
          maxWidth = 1920,
          maxHeight = 1080,
          quality = 80,
          outputPath = null
        } = options

        const ext = path.extname(inputPath).toLowerCase()
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)

        if (!isImage) {
          resolve({ success: false, message: '不是图片文件，跳过压缩' })
          return
        }

        const stats = fs.statSync(inputPath)
        const originalSize = stats.size

        if (originalSize < 100 * 1024) {
          resolve({
            success: true,
            originalSize,
            optimizedSize: originalSize,
            compressionRatio: 0,
            message: '图片小于100KB，跳过压缩'
          })
          return
        }

        let optimizedPath = outputPath || inputPath

        try {
          const { exec = require('child_process').execSync
          let command = ''

          if (ext === '.png') {
            command = `pngquant --quality=${quality} --output "${optimizedPath}" "${inputPath}" 2>/dev/null || true`
          } else if (ext === '.jpg' || ext === '.jpeg') {
            command = `cjpeg -quality ${quality} -outfile "${optimizedPath}" "${inputPath}" 2>/dev/null || true`
          }

          if (command) {
            try {
              exec(command, { stdio: 'ignore' })
            } catch (e) {
            }
          }

          const newStats = fs.statSync(optimizedPath)
          const newSize = newStats.size
          const compressionRatio = ((originalSize - newSize) / originalSize * 100

          resolve({
            success: true,
            originalSize,
            optimizedSize: newSize,
            compressionRatio: compressionRatio.toFixed(2),
            message: `压缩成功，节省 ${compressionRatio.toFixed(1)}% 空间`
          })
        } catch (error) {
          resolve({
            success: false,
            originalSize,
            optimizedSize: originalSize,
            compressionRatio: 0,
            message: `压缩失败，保持原样'
          })
        }
      })
    } catch (error) {
      console.error('❌ 图片压缩出错:', error.message)
      return { success: false, message: '压缩出错' }
    }
  },

  optimizeUploadedImage: async (filePath) => {
    try {
      const result = await imageOptimizer.compressImage(filePath, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 75
      })
      return result
    } catch (error) {
      console.error('❌ 优化上传图片出错:', error.message)
      return { success: false }
    }
  }
}

module.exports = imageOptimizer

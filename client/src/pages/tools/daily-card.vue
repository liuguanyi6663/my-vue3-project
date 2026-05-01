<template>
  <view class="page">
    <view class="preview-card">
      <canvas
        canvas-id="dailyCard"
        class="card-canvas"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      ></canvas>
    </view>

    <view class="action-buttons">
      <button class="btn-save" @click="saveToAlbum">保存到相册</button>
      <button class="btn-share" @click="shareCard">分享</button>
    </view>

    <view class="tips">
      <text class="tip-text">✨ 每日生成一张专属考研日签，记录你的坚持！</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { homeApi, studyApi } from '@/api/index'
import { getKaoyanTargetDate, getKaoyanYear, getTimeSeed, formatDate } from '@/utils/date'

const canvasWidth = ref(0)
const canvasHeight = ref(0)
const scale = ref(1)

const dailyQuote = ref('进德修业')
const countdownDays = ref(0)
const totalCheckins = ref(0)

const initCanvasSize = () => {
  const systemInfo = uni.getSystemInfoSync()
  const screenWidth = systemInfo.screenWidth
  const screenHeight = systemInfo.screenHeight

  const baseWidth = 400
  const baseHeight = 533

  const availableHeight = screenHeight - 200

  const scaleX = (screenWidth - 48) / baseWidth
  const scaleY = availableHeight / baseHeight

  scale.value = Math.min(scaleX, scaleY, 1)

  canvasWidth.value = Math.floor(baseWidth * scale.value)
  canvasHeight.value = Math.floor(baseHeight * scale.value)
}

const loadData = async () => {
  try {
    const [quoteRes, checkinsRes] = await Promise.all([
      homeApi.getQuote(),
      studyApi.getHeatmap()
    ])

    if (quoteRes.data?.quote) {
      dailyQuote.value = quoteRes.data.quote
    }

    const heatmap = checkinsRes.data?.heatmap || {}
    let total = 0
    for (const date in heatmap) {
      total += heatmap[date].count || 0
    }
    totalCheckins.value = total

    const now = getTimeSeed()
    const target = getKaoyanTargetDate()
    const diff = target - now
    if (diff > 0) {
      countdownDays.value = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  }
}

const drawCard = () => {
  const ctx = uni.createCanvasContext('dailyCard')
  const s = scale.value
  const w = canvasWidth.value
  const h = canvasHeight.value

  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#667eea')
  gradient.addColorStop(1, '#764ba2')
  ctx.setFillStyle(gradient)
  ctx.fillRect(0, 0, w, h)

  ctx.setGlobalAlpha(0.1)
  ctx.setFontSize(Math.floor(96 * s))
  ctx.setFillStyle('#fff')
  ctx.setTextAlign('center')
  ctx.fillText('考研加油', w / 2, Math.floor(213 * s))
  ctx.setGlobalAlpha(1)

  ctx.setTextAlign('center')
  ctx.setFontSize(Math.floor(20 * s))
  ctx.setFillStyle('#fff')
  ctx.fillText(`距离 ${getKaoyanYear()} 年考研`, w / 2, Math.floor(80 * s))

  ctx.setFontSize(Math.floor(64 * s))
  ctx.setFillStyle('#fff')
  ctx.fillText(countdownDays.value, w / 2, Math.floor(160 * s))

  ctx.setFontSize(Math.floor(15 * s))
  ctx.setFillStyle('#fff')
  ctx.fillText('天', w / 2 + Math.floor(64 * s), Math.floor(160 * s))

  ctx.setFillStyle('rgba(255,255,255,0.3)')
  ctx.fillRect(Math.floor(53 * s), Math.floor(200 * s), Math.floor(293 * s), 1)

  ctx.setFillStyle('#fff')
  ctx.setFontSize(Math.floor(18 * s))
  wrapText(ctx, dailyQuote.value, w / 2, Math.floor(240 * s), Math.floor(293 * s), Math.floor(24 * s))

  ctx.setFillStyle('rgba(255,255,255,0.9)')
  ctx.setFontSize(Math.floor(13 * s))
  const now = getTimeSeed()
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  ctx.fillText(dateStr, w / 2, Math.floor(347 * s))

  ctx.setFillStyle('rgba(255,255,255,0.15)')
  ctx.beginPath()
  ctx.arc(w / 2, Math.floor(413 * s), Math.floor(64 * s), 0, 2 * Math.PI)
  ctx.fill()

  ctx.setFillStyle('#fff')
  ctx.setFontSize(Math.floor(25 * s))
  ctx.fillText(totalCheckins.value, w / 2, Math.floor(420 * s))

  ctx.setFontSize(Math.floor(11 * s))
  ctx.setFillStyle('rgba(255,255,255,0.8)')
  ctx.fillText('累计打卡', w / 2, Math.floor(442 * s))

  ctx.setFillStyle('rgba(255,255,255,0.2)')
  ctx.fillRect(0, Math.floor(467 * s), w, Math.floor(66 * s))

  ctx.setFillStyle('#fff')
  ctx.setFontSize(Math.floor(12 * s))
  ctx.setTextAlign('left')
  ctx.fillText('📚 考研助手', Math.floor(32 * s), Math.floor(508 * s))

  ctx.setTextAlign('right')
  ctx.fillText('坚持就是胜利！', w - Math.floor(32 * s), Math.floor(508 * s))

  ctx.draw()
}

const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  let line = ''
  let yPos = y
  const fontSize = ctx.font ? parseInt(ctx.font) : lineHeight
  const estimatedCharWidth = fontSize * 0.8

  for (let i = 0; i < text.length; i++) {
    const testLine = line + text[i]
    const estimatedWidth = testLine.length * estimatedCharWidth
    const metrics = ctx.measureText ? ctx.measureText(testLine) : { width: estimatedWidth }

    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, yPos)
      line = text[i]
      yPos += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, yPos)
}

const saveToAlbum = () => {
  uni.showLoading({ title: '生成中...' })

  setTimeout(() => {
    uni.canvasToTempFilePath({
      canvasId: 'dailyCard',
      width: canvasWidth.value,
      height: canvasHeight.value,
      destWidth: canvasWidth.value * 2,
      destHeight: canvasHeight.value * 2,
      fileType: 'jpg',
      quality: 1,
      success: (res) => {
        uni.hideLoading()
        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            uni.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail: (err) => {
            console.error('保存失败:', err)
            uni.showToast({ title: '保存失败', icon: 'none' })
          }
        })
      },
      fail: (err) => {
        uni.hideLoading()
        console.error('生成图片失败:', err)
        uni.showToast({ title: '生成失败', icon: 'none' })
      }
    })
  }, 300)
}

const shareCard = () => {
  uni.showModal({
    title: '分享提示',
    content: '保存到相册后可分享到朋友圈',
    confirmText: '去保存',
    success: (res) => {
      if (res.confirm) {
        saveToAlbum()
      }
    }
  })
}

onMounted(() => {
  initCanvasSize()
  loadData().then(() => {
    setTimeout(drawCard, 100)
  })
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30rpx 24rpx;
  box-sizing: border-box;
}

.preview-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.2);
  margin-bottom: 32rpx;
}

.card-canvas {
  width: 100%;
  height: auto;
  border-radius: 12rpx;
  display: block;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.btn-save, .btn-share {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.btn-save {
  background: #fff;
  color: #667eea;
}

.btn-share {
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: 2rpx solid rgba(255,255,255,0.3);
}

.tips {
  text-align: center;
}

.tip-text {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
}
</style>

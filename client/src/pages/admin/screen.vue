<template>
  <view class="screen-page">
    <view class="screen-header">
      <text class="screen-title">大屏管理</text>
    </view>

    <view class="screen-content">
      <view class="upload-section card">
        <text class="section-title">首页滚动大屏</text>
        
        <view class="upload-area" @click="chooseImage">
          <text class="upload-icon">📷</text>
          <text class="upload-text">点击上传图片</text>
          <text class="upload-hint">支持 JPG、PNG 格式，建议尺寸 1920x1080</text>
        </view>

        <view v-if="currentImage" class="current-image">
          <image :src="currentImage" mode="aspectFill"></image>
          <view class="image-actions">
            <button class="action-btn" @click="chooseImage">重新上传</button>
            <button class="action-btn delete" @click="deleteImage">删除</button>
          </view>
        </view>

        <view v-if="loading" class="loading">
          <text>上传中...</text>
        </view>

        <view v-if="message" class="message" :class="messageType">
          <text>{{ message }}</text>
        </view>
      </view>

      <view class="screen-list card">
        <text class="section-title">已上传的大屏</text>
        
        <view v-if="screens.length > 0" class="screens-grid">
          <view v-for="(screen, index) in screens" :key="screen.id" class="screen-item">
            <image :src="getImageUrl(screen.image_url)" mode="aspectFill"></image>
            <view class="screen-info">
              <text class="screen-name">{{ screen.name || `大屏 ${index + 1}` }}</text>
              <text class="screen-time">{{ formatTime(screen.created_at) }}</text>
              <button class="delete-btn" @click="deleteScreen(screen.id)">删除</button>
            </view>
          </view>
        </view>
        
        <view v-else class="empty">
          <text>暂无大屏图片</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/index.js'
import { formatDate as formatDateUtil } from '@/utils/date'

const currentImage = ref('')
const screens = ref([])
const loading = ref(false)
const message = ref('')
const messageType = ref('')

const loadScreens = async () => {
  try {
    const response = await adminApi.getScreens()
    if (response.code === 200) {
      screens.value = response.data
    } else {
      showMessage('获取大屏列表失败', 'error')
    }
  } catch (error) {
    showMessage('网络错误', 'error')
  }
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePaths = res.tempFilePaths
      uploadImageFile(tempFilePaths[0])
    }
  })
}

const uploadImageFile = (filePath) => {
  loading.value = true
  message.value = ''
  
  const token = uni.getStorageSync('token')
  console.log('上传文件路径:', filePath)
  console.log('Token:', token)
  
  uni.uploadFile({
    url: 'http://localhost:3000/api/admin/screens',
    filePath: filePath,
    name: 'image',
    header: {
      'Authorization': `Bearer ${token}`
    },
    formData: {
      name: ''
    },
    success: (res) => {
      loading.value = false
      console.log('上传成功响应:', res)
      try {
        const response = JSON.parse(res.data)
        if (response.code === 200) {
          showMessage('上传成功', 'success')
          loadScreens()
        } else {
          showMessage(response.message || '上传失败', 'error')
        }
      } catch (e) {
        showMessage('服务器响应格式错误', 'error')
      }
    },
    fail: (err) => {
      loading.value = false
      console.log('上传失败错误:', err)
      showMessage('上传失败', 'error')
    }
  })
}

const deleteImage = () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除当前图片吗？',
    success: (res) => {
      if (res.confirm) {
        currentImage.value = ''
        showMessage('删除成功', 'success')
      }
    }
  })
}

const deleteScreen = async (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个大屏吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const response = await adminApi.deleteScreen(id)
          if (response.code === 200) {
            showMessage('删除成功', 'success')
            loadScreens()
          } else {
            showMessage(response.message || '删除失败', 'error')
          }
        } catch (error) {
          showMessage('网络错误', 'error')
        }
      }
    }
  })
}

const showMessage = (text, type = 'info') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

const formatTime = (time) => formatDateUtil(time)

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return ''
  // 检查是否已经是完整的URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  // 拼接完整的URL
  return 'http://localhost:3000' + imageUrl
}

onMounted(() => {
  loadScreens()
})
</script>

<style scoped>
.screen-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.screen-header {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
}

.screen-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.screen-content {
  padding: 20rpx;
}

.upload-section,
.screen-list {
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.upload-area {
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  padding: 60rpx 20rpx;
  text-align: center;
  background: #f9f9f9;
  transition: all 0.3s;
}

.upload-area:active {
  background: #f0f0f0;
}

.upload-icon {
  font-size: 60rpx;
  display: block;
  margin-bottom: 20rpx;
}

.upload-text {
  font-size: 30rpx;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.upload-hint {
  font-size: 24rpx;
  color: #999;
}

.current-image {
  margin-top: 30rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f9f9f9;
}

.current-image image {
  width: 100%;
  height: 400rpx;
  object-fit: cover;
}

.image-actions {
  display: flex;
  padding: 20rpx;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  padding: 20rpx;
  border: 1rpx solid #4CAF50;
  background: #fff;
  color: #4CAF50;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.action-btn.delete {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.loading {
  margin-top: 20rpx;
  text-align: center;
  color: #666;
  font-size: 28rpx;
}

.message {
  margin-top: 20rpx;
  padding: 16rpx;
  border-radius: 8rpx;
  text-align: center;
  font-size: 28rpx;
}

.message.success {
  background: #f6ffed;
  color: #52c41a;
  border: 1rpx solid #b7eb8f;
}

.message.error {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1rpx solid #ffccc7;
}

.screens-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.screen-item {
  border-radius: 12rpx;
  overflow: hidden;
  background: #f9f9f9;
}

.screen-item image {
  width: 100%;
  height: 200rpx;
  object-fit: cover;
}

.screen-info {
  padding: 16rpx;
}

.screen-name {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.screen-time {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 12rpx;
}

.delete-btn {
  width: 100%;
  padding: 12rpx;
  border: 1rpx solid #ff4d4f;
  background: #fff;
  color: #ff4d4f;
  border-radius: 6rpx;
  font-size: 24rpx;
}

.empty {
  text-align: center;
  padding: 60rpx 20rpx;
  color: #999;
  font-size: 28rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
}
</style>
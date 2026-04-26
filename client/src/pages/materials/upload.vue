<template>
  <view class="page">
    <view class="form-card card">
      <!-- 分类选择 -->
      <view class="form-item">
        <text class="form-label">资料分类 <text class="required">*</text></text>
        <picker mode="selector" :range="parentCategories" range-key="name" @change="onCategoryChange">
          <view class="picker-box">
            <text>{{ selectedCategoryName || '请选择分类' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>

      <!-- 资料名称 -->
      <view class="form-item">
        <text class="form-label">资料名称 <text class="required">*</text></text>
        <input 
          class="form-input" 
          v-model="form.title" 
          :placeholder="'如：' + currentYear + '年英语一真题及解析'"
          maxlength="100"
        />
      </view>

      <!-- 年份 -->
      <view class="form-item">
        <text class="form-label">资料年份</text>
        <input 
          class="form-input" 
          v-model="form.year" 
          type="number"
          :placeholder="'如：' + currentYear"
          maxlength="4"
        />
      </view>

      <!-- 描述 -->
      <view class="form-item content-item">
        <text class="form-label">资料描述</text>
        <textarea 
          class="content-textarea" 
          v-model="form.description" 
          placeholder="简要描述资料内容、适用范围等..."
          maxlength="500"
        />
      </view>

      <!-- 文件上传 -->
      <view class="form-item file-item">
        <text class="form-label">上传文件 <text class="required">*</text></text>
        
        <view v-if="!uploadedFile" class="upload-area" @click="chooseFile">
          <text class="upload-icon">📁</text>
          <text class="upload-text">点击选择文件</text>
          <text class="upload-hint">支持 PDF、Word、图片，最大50MB</text>
        </view>

        <view v-else class="file-preview">
          <text class="file-icon">📄</text>
          <view class="file-info">
            <text class="file-name">{{ uploadedFile.name }}</text>
            <text class="file-size">{{ formatFileSize(uploadedFile.size) }}</text>
          </view>
          <text class="file-delete" @click="removeFile">×</text>
        </view>
      </view>

      <!-- 上传进度 -->
      <view v-if="uploading" class="progress-wrap">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: uploadProgress + '%' }"></view>
        </view>
        <text class="progress-text">上传中... {{ uploadProgress }}%</text>
      </view>

      <!-- 提交按钮 -->
      <button 
        class="submit-btn" 
        :disabled="!canSubmit || uploading"
        @click="submitUpload"
      >
        {{ uploading ? '上传中...' : '提交上传' }}
      </button>
    </view>

    <!-- 上传须知 -->
    <view class="notice card">
      <text class="notice-title">📋 上传须知</text>
      <text class="notice-text">1. 请确保上传的资料内容合法合规，不侵犯他人版权</text>
      <text class="notice-text">2. 资料上传后需要管理员审核通过后才会显示</text>
      <text class="notice-text">3. 下载时将自动添加水印以防止外传</text>
      <text class="notice-text">4. 禁止上传盗版课程、广告引流等内容</text>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { materialApi } from '@/api/index'
import { getCurrentYear } from '@/utils/date'

const currentYear = getCurrentYear()

const categories = ref([])
const parentCategories = ref([])
const selectedCategory = ref(null)
const selectedCategoryName = ref('')
const uploadedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)

const form = ref({
  title: '',
  year: '',
  description: ''
})

const canSubmit = computed(() => {
  return form.value.title.trim() && 
         selectedCategory.value && 
         uploadedFile.value
})

const loadCategories = async () => {
  try {
    const res = await materialApi.getCategories()
    if (res.data && res.data.length > 0) {
      categories.value = res.data
      buildCategoryList()
    } else {
      useDefaultCategories()
    }
  } catch (e) {
    console.error('API加载失败，使用默认分类:', e)
    useDefaultCategories()
  }
}

const buildCategoryList = () => {
  parentCategories.value = categories.value.filter(c => c.parent_id === 0)
}

const useDefaultCategories = () => {
  const defaultData = [
    { id: 1, name: '公共课', parent_id: 0, type: 'public' },
    { id: 2, name: '英语', parent_id: 1, type: 'public' },
    { id: 3, name: '政治', parent_id: 1, type: 'public' },
    { id: 4, name: '数学', parent_id: 1, type: 'public' },
    { id: 5, name: '专业课', parent_id: 0, type: 'major' },
    { id: 6, name: '计算机', parent_id: 5, type: 'major' },
    { id: 7, name: '经济学', parent_id: 5, type: 'major' },
    { id: 8, name: '管理学', parent_id: 5, type: 'major' },
    { id: 9, name: '法学', parent_id: 5, type: 'major' },
    { id: 10, name: '真题', parent_id: 0, type: 'exam' },
    { id: 11, name: '英语一真题', parent_id: 10, type: 'exam' },
    { id: 12, name: '数学一真题', parent_id: 10, type: 'exam' },
    { id: 13, name: '政治真题', parent_id: 10, type: 'exam' },
    { id: 14, name: '笔记', parent_id: 0, type: 'note' },
    { id: 15, name: '手写笔记', parent_id: 14, type: 'note' },
    { id: 16, name: '电子笔记', parent_id: 14, type: 'note' },
    { id: 17, name: '复试', parent_id: 0, type: 'interview' },
    { id: 18, name: '面试经验', parent_id: 17, type: 'interview' },
    { id: 19, name: '调剂指南', parent_id: 17, type: 'interview' },
  ]
  categories.value = defaultData
  buildCategoryList()
}

const onCategoryChange = (e) => {
  const idx = e.detail.value
  if (idx >= parentCategories.value.length) return
  const selected = parentCategories.value[idx]
  selectedCategory.value = selected.id
  selectedCategoryName.value = selected.name
}

const chooseFile = () => {
  uni.chooseMessageFile?.({
    count: 1,
    type: 'file',
    success: (res) => {
      uploadedFile.value = res.tempFiles[0]
    },
    fail: () => {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          uploadedFile.value = {
            name: res.tempFilePaths[0].split('/').pop(),
            size: 0,
            path: res.tempFilePaths[0]
          }
        }
      })
    }
  }) || uni.chooseImage({
    count: 1,
    success: (res) => {
      uploadedFile.value = {
        name: res.tempFilePaths[0].split('/').pop(),
        size: 0,
        path: res.tempFilePaths[0]
      }
    }
  })
}

const removeFile = () => {
  uploadedFile.value = null
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

const submitUpload = async () => {
  if (!canSubmit.value) return
  
  uploading.value = true
  uploadProgress.value = 30
  
  try {
    const res = await materialApi.upload({
      filePath: uploadedFile.value.path || uploadedFile.value.path,
      data: {
        category_id: String(selectedCategory.value),
        title: form.value.title,
        description: form.value.description,
        year: form.value.year
      }
    })
    
    uploadProgress.value = 100
    
    setTimeout(() => {
      uni.showToast({ 
        title: '上传成功', 
        icon: 'success' 
      })
      
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }, 500)
  } catch (e) {
    console.error('上传失败:', e)
    uploading.value = false
    uploadProgress.value = 0
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.form-card {
  margin: 20rpx 24rpx;
  padding: 30rpx;
}

.form-item {
  margin-bottom: 28rpx;
  position: relative;
}

.form-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.required {
  color: #ff3b30;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.picker-box {
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}

.picker-arrow {
  font-size: 22rpx;
  color: #999;
}

.content-item {
  margin-bottom: 40rpx;
}

.content-textarea {
  width: 100%;
  height: 150rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  line-height: 1.6;
}

.file-item {
  margin-bottom: 20rpx;
}

.upload-area {
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  background: #fafafa;
}

.upload-icon {
  font-size: 60rpx;
  display: block;
  margin-bottom: 16rpx;
}

.upload-text {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}

.upload-hint {
  font-size: 22rpx;
  color: #999;
}

.file-preview {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
}

.file-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.file-size {
  font-size: 22rpx;
  color: #999;
}

.file-delete {
  font-size: 36rpx;
  color: #ff3b30;
  padding: 10rpx;
}

.progress-wrap {
  margin-bottom: 20rpx;
}

.progress-bar {
  height: 12rpx;
  background: #e8e8e8;
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007AFF, #00c6ff);
  border-radius: 6rpx;
  transition: width 0.3s;
}

.progress-text {
  font-size: 24rpx;
  color: #007AFF;
  text-align: center;
  display: block;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  color: #fff;
  border-radius: 45rpx;
  font-size: 32rpx;
  border: none;
  margin-top: 20rpx;
}

.submit-btn[disabled] {
  opacity: 0.5;
}

.notice {
  margin: 0 24rpx;
  padding: 24rpx;
  background: #fff8e6;
}

.notice-title {
  font-size: 28rpx;
  color: #ff9500;
  font-weight: 500;
  display: block;
  margin-bottom: 16rpx;
}

.notice-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.8;
  display: block;
}
</style>

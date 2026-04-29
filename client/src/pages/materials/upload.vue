<template>
  <view class="page">
    <view class="form-card card">
      <view class="form-item">
        <text class="form-label">资料分类 <text class="required">*</text></text>
        <picker mode="selector" :range="parentCategories" range-key="name" @change="onCategoryChange">
          <view class="picker-box">
            <text>{{ selectedCategoryName || '请选择分类' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="form-label">资料名称 <text class="required">*</text></text>
        <input
          class="form-input"
          v-model="form.title"
          :placeholder="'如：' + currentYear + '年英语一真题及解析'"
          maxlength="100"
        />
      </view>

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

      <view class="form-item content-item">
        <text class="form-label">资料描述</text>
        <textarea
          class="content-textarea"
          v-model="form.description"
          placeholder="简要描述资料内容、适用范围等..."
          maxlength="500"
        />
      </view>

      <view class="form-item file-item">
        <text class="form-label">上传文件 <text class="required">*</text></text>

        <view v-if="!uploadedFile" class="upload-area" @click="chooseFile">
          <text class="upload-icon">📁</text>
          <text class="upload-text">点击选择文件</text>
          <text class="upload-hint">支持 PDF、Word、图片，最大 50MB</text>
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

      <view v-if="uploading" class="progress-wrap">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: uploadProgress + '%' }"></view>
        </view>
        <text class="progress-text">上传中... {{ uploadProgress }}%</text>
      </view>

      <button class="submit-btn" :disabled="!canSubmit || uploading" @click="submitUpload">
        {{ uploading ? '上传中...' : '提交上传' }}
      </button>
    </view>

    <view class="notice card">
      <text class="notice-title">上传须知</text>
      <text class="notice-text">1. 请确保上传资料合法合规，不侵犯他人版权。</text>
      <text class="notice-text">2. 上传时请先选择所属分类，资料会显示到对应分类下。</text>
      <text class="notice-text">3. 上传成功后可在“我的上传”中查看记录。</text>
      <text class="notice-text">4. 禁止上传广告、引流或违规内容。</text>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { materialApi } from '@/api/index'
import { getCurrentYear } from '@/utils/date'
import { ensureAuthorize } from '@/utils/authorize'

const FIXED_CATEGORIES = [
  { id: 1, name: '公共课', parent_id: 0, type: 'public' },
  { id: 5, name: '专业课', parent_id: 0, type: 'major' },
  { id: 6, name: '真题', parent_id: 0, type: 'exam' },
  { id: 7, name: '学长笔记', parent_id: 0, type: 'notes' },
  { id: 8, name: '复试资料', parent_id: 0, type: 'interview' }
]

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
  return !!(form.value.title.trim() && selectedCategory.value && uploadedFile.value)
})

const loadCategories = async () => {
  try {
    const res = await materialApi.getCategories()
    const apiCategories = res.data || []
    categories.value = FIXED_CATEGORIES.map((item) => {
      const matched = apiCategories.find((apiItem) => Number(apiItem.id) === item.id)
      return matched ? { ...matched, name: item.name } : item
    })
  } catch (e) {
    console.error('加载分类失败，使用默认分类:', e)
    categories.value = FIXED_CATEGORIES
  }

  buildCategoryList()
}

const buildCategoryList = () => {
  parentCategories.value = categories.value.filter((item) => Number(item.parent_id) === 0)
}

const onCategoryChange = (e) => {
  const index = Number(e.detail.value)
  const selected = parentCategories.value[index]
  if (!selected) return

  selectedCategory.value = selected.id
  selectedCategoryName.value = selected.name
}

const chooseFile = () => {
  if (typeof uni.chooseMessageFile === 'function') {
    uni.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles?.[0]
        if (!file) return

        uploadedFile.value = {
          name: file.name,
          size: file.size || 0,
          path: file.path
        }
      },
      fail: (err) => {
        const msg = err?.errMsg || ''
        if (msg.includes('cancel')) {
          return
        }
        console.warn('chooseMessageFile fail:', err)
        chooseImageFallback()
      }
    })
    return
  }

  chooseImageFallback()
}

const chooseImageFallback = async () => {
  const authorized = await ensureAuthorize('album')
  if (!authorized) return

  uni.chooseImage({
    count: 1,
    success: (res) => {
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) return

      uploadedFile.value = {
        name: filePath.split('/').pop(),
        size: 0,
        path: filePath
      }
    }
  })
}

const removeFile = () => {
  uploadedFile.value = null
}

const formatFileSize = (bytes) => {
  if (!bytes) return '未知大小'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const submitUpload = async () => {
  if (!canSubmit.value || !uploadedFile.value?.path) return

  uploading.value = true
  uploadProgress.value = 30

  try {
    await materialApi.upload({
      filePath: uploadedFile.value.path,
      data: {
        category_id: String(selectedCategory.value),
        title: form.value.title.trim(),
        description: form.value.description.trim(),
        year: form.value.year
      }
    })

    uploadProgress.value = 100

    uni.showToast({
      title: '上传成功',
      icon: 'success'
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1200)
  } catch (e) {
    console.error('上传失败:', e)
    uploadProgress.value = 0
  } finally {
    uploading.value = false
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
  background: linear-gradient(90deg, #007aff, #00c6ff);
  border-radius: 6rpx;
  transition: width 0.3s;
}

.progress-text {
  font-size: 24rpx;
  color: #007aff;
  text-align: center;
  display: block;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #007aff, #00c6ff);
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

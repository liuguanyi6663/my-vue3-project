<template>
  <view class="page">
    <view class="form-card card">
      <!-- 匿名树洞提示 -->
      <view v-if="isTreeholeMode" class="treehole-tip">
        <text class="tip-icon">🌳</text>
        <text class="tip-text">匿名树洞模式，你的身份将被完全隐藏</text>
      </view>
      
      <!-- 板块选择 -->
      <view class="form-item">
        <text class="form-label">选择板块</text>
        <picker 
          :range="categories" 
          range-key="label" 
          @change="onCategoryChange"
          :disabled="isTreeholeMode"
        >
          <view class="picker-box" :class="{ disabled: isTreeholeMode }">
            <text>{{ currentCategory.label || '请选择' }}</text>
            <text class="picker-arrow" v-if="!isTreeholeMode">▼</text>
          </view>
        </picker>
      </view>

      <!-- 标题 -->
      <view class="form-item">
        <text class="form-label">标题</text>
        <input 
          class="form-input" 
          v-model="form.title" 
          placeholder="请输入帖子标题（5-50字）"
          maxlength="50"
        />
        <text class="char-count">{{ form.title.length }}/50</text>
      </view>

      <!-- 内容 -->
      <view class="form-item content-item">
        <text class="form-label">内容</text>
        <textarea 
          class="content-textarea" 
          v-model="form.content" 
          placeholder="分享你的想法、经验或问题..."
          maxlength="2000"
        />
        <text class="char-count">{{ form.content.length }}/2000</text>
      </view>

      <!-- 图片上传 -->
      <view class="form-item">
        <text class="form-label">图片（可选）</text>
        <view class="image-list">
          <view v-for="(img, index) in images" :key="index" class="image-preview">
            <image :src="img" mode="aspectFill" @click="previewImage(img)" />
            <text class="delete-btn" @click="removeImage(index)">×</text>
          </view>
          <view class="add-image" @click="chooseImage" v-if="images.length < 9">
            <text>+</text>
          </view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="btn-wrapper">
        <button 
          class="submit-btn" 
          :class="{ disabled: !canSubmit || submitting }"
          :disabled="!canSubmit || submitting"
          @click="submitPost"
          open-type=""
        >
          {{ submitting ? '发布中...' : '发布帖子' }}
        </button>
        <view class="btn-tip" v-if="!canSubmit">
          <text v-if="selectedCategoryIndex < 0">请选择板块</text>
          <text v-else-if="form.title.trim().length < 5">标题至少5个字</text>
          <text v-else>请输入内容</text>
        </view>
      </view>
    </view>

    <!-- 发布须知 -->
    <view class="notice card">
      <text class="notice-title">📝 发布须知</text>
      <text class="notice-text">1. 请遵守社区规范，文明发言</text>
      <text class="notice-text">2. 禁止发布广告、引流等违规内容</text>
      <text class="notice-text">3. 帖子发布后需经过审核才会显示</text>
      <text class="notice-text">4. 匿名发帖将隐藏你的身份信息</text>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { forumApi } from '@/api/index'

const categories = [
  { label: '备考交流', value: 'study' },
  { label: '上岸经验', value: 'experience' },
  { label: '资料求助', value: 'help' },
  { label: '复试调剂', value: 'adjust' },
  { label: '匿名树洞', value: 'treehole' }
]

const isTreeholeMode = ref(false) // 是否是匿名树洞模式
const selectedCategoryIndex = ref(-1) // 选中的索引
const images = ref([])
const submitting = ref(false)

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage?.options || {}
  
  if (options.category === 'treehole') {
    isTreeholeMode.value = true
    // 自动选中匿名树洞
    const index = categories.findIndex(c => c.value === 'treehole')
    selectedCategoryIndex.value = index
  }
})

const form = ref({
  title: '',
  content: ''
})

// 计算当前选中的分类
const currentCategory = computed(() => {
  if (selectedCategoryIndex.value >= 0) {
    return categories[selectedCategoryIndex.value]
  }
  return { label: '', value: '' }
})

const canSubmit = computed(() => {
  const titleOk = form.value.title.trim().length >= 5
  const contentOk = form.value.content.trim().length > 0
  const categoryOk = selectedCategoryIndex.value >= 0
  console.log('canSubmit:', { 
    titleOk, 
    contentOk, 
    categoryOk, 
    selectedIndex: selectedCategoryIndex.value,
    titleLength: form.value.title.trim().length 
  })
  return titleOk && contentOk && categoryOk
})

const onCategoryChange = (e) => {
  console.log('选择板块索引:', e.detail.value)
  selectedCategoryIndex.value = e.detail.value
}

const chooseImage = () => {
  uni.chooseImage({
    count: 9 - images.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      images.value = [...images.value, ...res.tempFilePaths].slice(0, 9)
    }
  })
}

const removeImage = (index) => {
  images.value.splice(index, 1)
}

const previewImage = (current) => {
  uni.previewImage({ current, urls: images.value })
}

const submitPost = async () => {
  console.log('点击发布按钮', { canSubmit: canSubmit.value, submitting: submitting.value })
  if (!canSubmit.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  if (submitting.value) return
  
  submitting.value = true
  
  try {
    uni.showLoading({ title: '发布中...' })
    
    // 先上传图片
    const uploadedImageUrls = []
    if (images.value && images.value.length > 0) {
      console.log('开始上传图片，共', images.value.length, '张')
      for (let i = 0; i < images.value.length; i++) {
        const imagePath = images.value[i]
        console.log('正在上传第', i + 1, '张图片:', imagePath)
        try {
          const uploadRes = await forumApi.uploadImage(imagePath)
          if (uploadRes.code === 200 && uploadRes.data && uploadRes.data.url) {
            uploadedImageUrls.push(uploadRes.data.url)
            console.log('图片上传成功:', uploadRes.data.url)
          } else {
            console.error('图片上传失败:', uploadRes)
          }
        } catch (uploadErr) {
          console.error('图片上传异常:', uploadErr)
        }
      }
    }
    
    console.log('开始发布帖子，图片:', uploadedImageUrls)
    const result = await forumApi.createPost({
      category: currentCategory.value.value,
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      images: uploadedImageUrls,
      // 如果是匿名树洞，强制匿名
      is_anonymous: currentCategory.value.value === 'treehole' ? 1 : 0
    })

    console.log('发布结果:', result)
    uni.hideLoading()
    uni.showToast({ title: '发布成功', icon: 'success' })
    
    setTimeout(() => {
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage && prevPage.$vm && prevPage.$vm.loadPosts) {
        prevPage.$vm.loadPosts(true)
      }
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    uni.hideLoading()
    console.error('发布失败:', e)
    uni.showToast({ title: e?.msg || '发布失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
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

.treehole-tip {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  margin-bottom: 28rpx;
}

.tip-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 500;
}

.picker-box.disabled {
  opacity: 0.7;
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

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
  border: 2rpx solid transparent;
}

.form-input:focus {
  border-color: #007AFF;
  background: #fff;
}

.char-count {
  position: absolute;
  right: 0;
  bottom: -24rpx;
  font-size: 22rpx;
  color: #999;
}

.picker-box {
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 30rpx;
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
  height: 300rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  line-height: 1.6;
  border: 2rpx solid transparent;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-preview {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.image-preview image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 36rpx;
  height: 36rpx;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border-radius: 50%;
  text-align: center;
  line-height: 36rpx;
  font-size: 24rpx;
}

.add-image {
  width: 160rpx;
  height: 160rpx;
  background: #f0f0f0;
  border-radius: 12rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ccc;
  font-size: 48rpx;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-wrapper {
  margin-top: 10rpx;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  color: #fff;
  border-radius: 45rpx;
  font-size: 32rpx;
  border: none;
  line-height: 90rpx;
}

.submit-btn.disabled {
  background: #ccc;
  color: #999;
  opacity: 1;
}

.btn-tip {
  text-align: center;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #ff6b6b;
}

.notice {
  margin: 0 24rpx;
  padding: 24rpx;
  background: #e8f4ff;
}

.notice-title {
  font-size: 28rpx;
  color: #007AFF;
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

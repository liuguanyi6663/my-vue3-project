<template>
  <view class="page">
    <view class="card form-section" v-if="certStatus.is_landed">
      <view class="landed-notice">
        <text class="landed-icon">🎉</text>
        <text class="landed-text">您已获得"已上岸"专属头衔</text>
        <text class="landed-desc">头衔将在您的昵称旁展示</text>
      </view>
    </view>

    <view v-else>
      <view class="card form-section" v-if="certStatus.has_pending">
        <view class="pending-notice">
          <text class="pending-icon">⏳</text>
          <text class="pending-text">您的申请正在审核中，请耐心等待</text>
        </view>
      </view>

      <view class="card form-section" v-else>
        <view class="form-title">
          <text class="form-title-text">申请"已上岸"头衔认证</text>
          <text class="form-title-desc">上传上岸截图，审核通过后即可获得专属标识</text>
        </view>

        <view class="form-item">
          <text class="form-label">上岸截图 *</text>
          <text class="form-hint">请上传录取通知书、拟录取名单等证明材料</text>
          <view class="upload-area" @click="chooseImage">
            <image v-if="screenshotUrl" class="preview-image" :src="screenshotUrl" mode="aspectFit" />
            <view v-else class="upload-placeholder">
              <text class="upload-icon">📷</text>
              <text class="upload-text">点击上传截图</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">相关说明</text>
          <textarea
            class="form-textarea"
            v-model="description"
            placeholder="补充说明（选填），如录取院校、专业等"
            maxlength="200"
          />
          <text class="char-count">{{ description.length }}/200</text>
        </view>

        <button class="submit-btn" @click="submitApply" :disabled="!screenshotPath || submitting">
          {{ submitting ? '提交中...' : '提交申请' }}
        </button>
      </view>

      <view class="card history-section" v-if="records.length > 0">
        <text class="section-title">申请记录</text>
        <view class="record-item" v-for="item in records" :key="item.id">
          <view class="record-header">
            <text class="record-time">{{ formatTime(item.created_at) }}</text>
            <text class="record-status" :class="item.status">{{ statusMap[item.status] }}</text>
          </view>
          <view class="record-screenshot">
            <image class="record-img" :src="getImageUrl(item.screenshot)" mode="aspectFit" @click="previewImage(item.screenshot)" />
          </view>
          <text class="record-desc" v-if="item.description">说明：{{ item.description }}</text>
          <text class="record-remark" v-if="item.review_remark">审核备注：{{ item.review_remark }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { titleCertApi } from '@/api/index'

const screenshotPath = ref('')
const screenshotUrl = ref('')
const description = ref('')
const submitting = ref(false)
const records = ref([])
const certStatus = ref({ is_landed: 0, has_pending: false })

const statusMap = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝'
}

const loadStatus = async () => {
  try {
    const res = await titleCertApi.getStatus()
    if (res.code === 200) {
      certStatus.value = res.data
    }
  } catch (e) {
    console.error('获取认证状态失败:', e)
  }
}

const loadRecords = async () => {
  try {
    const res = await titleCertApi.getMyRecords()
    if (res.code === 200) {
      records.value = res.data || []
    }
  } catch (e) {
    console.error('获取申请记录失败:', e)
  }
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      screenshotPath.value = res.tempFilePaths[0]
      screenshotUrl.value = res.tempFilePaths[0]
    }
  })
}

const submitApply = async () => {
  if (!screenshotPath.value) {
    return uni.showToast({ title: '请上传上岸截图', icon: 'none' })
  }
  if (submitting.value) return

  submitting.value = true
  try {
    const res = await titleCertApi.apply(screenshotPath.value, {
      description: description.value
    })
    if (res.code === 200) {
      uni.showToast({ title: '申请提交成功', icon: 'success' })
      screenshotPath.value = ''
      screenshotUrl.value = ''
      description.value = ''
      loadStatus()
      loadRecords()
    }
  } catch (e) {
    console.error('提交申请失败:', e)
  } finally {
    submitting.value = false
  }
}

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return 'http://127.0.0.1:3000' + url
}

const previewImage = (url) => {
  uni.previewImage({
    current: getImageUrl(url),
    urls: [getImageUrl(url)]
  })
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadStatus()
  loadRecords()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.landed-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}

.landed-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.landed-text {
  font-size: 34rpx;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 12rpx;
}

.landed-desc {
  font-size: 26rpx;
  color: #999;
}

.pending-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}

.pending-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.pending-text {
  font-size: 30rpx;
  color: #FF9500;
  font-weight: 500;
}

.form-title {
  margin-bottom: 30rpx;
}

.form-title-text {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.form-title-desc {
  font-size: 26rpx;
  color: #999;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.form-hint {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 16rpx;
}

.upload-area {
  width: 100%;
  height: 400rpx;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  font-size: 60rpx;
  margin-bottom: 16rpx;
}

.upload-text {
  font-size: 28rpx;
  color: #999;
}

.form-textarea {
  width: 100%;
  height: 180rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.char-count {
  font-size: 22rpx;
  color: #ccc;
  text-align: right;
  display: block;
  margin-top: 8rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  border: none;
  margin-top: 20rpx;
}

.submit-btn[disabled] {
  opacity: 0.5;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.record-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.record-time {
  font-size: 24rpx;
  color: #999;
}

.record-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.record-status.pending {
  background: #fff3e0;
  color: #FF9500;
}

.record-status.approved {
  background: #e8f5e9;
  color: #4CAF50;
}

.record-status.rejected {
  background: #ffebee;
  color: #f44336;
}

.record-screenshot {
  margin-bottom: 12rpx;
}

.record-img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
}

.record-desc {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 4rpx;
}

.record-remark {
  font-size: 24rpx;
  color: #f44336;
  display: block;
}
</style>

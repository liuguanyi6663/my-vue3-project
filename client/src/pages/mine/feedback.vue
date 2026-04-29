<template>
  <view class="page">
    <view class="section card">
      <text class="section-title">提交意见反馈</text>
      <textarea
        class="feedback-input"
        v-model="content"
        placeholder="请输入您的意见或建议..."
        :maxlength="500"
        auto-height
      />
      <view class="input-footer">
        <text class="char-count">{{ content.length }}/500</text>
      </view>
      <button class="submit-btn" @click="submitFeedback" :disabled="!content.trim()">
        提交反馈
      </button>
    </view>

    <view class="section card" style="margin-top: 20rpx;">
      <text class="section-title">我的反馈记录</text>

      <view class="empty-state" v-if="feedbackList.length === 0 && !loading">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无反馈记录</text>
      </view>

      <view class="feedback-list" v-else>
        <view class="feedback-item" v-for="item in feedbackList" :key="item.id">
          <view class="feedback-header">
            <text class="feedback-status" :class="item.status">{{ statusLabel(item.status) }}</text>
            <text class="feedback-time">{{ formatDate(item.created_at) }}</text>
          </view>

          <text class="feedback-content">{{ item.content }}</text>

          <view class="feedback-result">
            <text class="result-label">处理回复：</text>
            <text class="result-content">{{ getHandleReply(item) }}</text>
          </view>

          <view class="feedback-handler" v-if="item.status === 'processed' && item.handler_name">
            <text class="handler-label">处理人：</text>
            <text class="handler-name">{{ item.handler_name }}</text>
          </view>

          <view class="feedback-actions">
            <button class="btn-sm btn-danger" @click="deleteFeedback(item)">删除</button>
          </view>
        </view>
      </view>

      <view class="pagination" v-if="feedbackList.length > 0">
        <button class="btn-sm" :disabled="page === 1" @click="goPage(page - 1)">上一页</button>
        <text class="page-info">第 {{ page }} / {{ totalPages }} 页</text>
        <button class="btn-sm" :disabled="page >= totalPages" @click="goPage(page + 1)">下一页</button>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { feedbackApi } from '@/api/index'
import { formatDateTime } from '@/utils/date'

const content = ref('')
const feedbackList = ref([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)

const statusLabel = (status) => {
  const map = { pending: '待处理', processed: '已处理' }
  return map[status] || status
}

const getHandleReply = (item) => {
  return item.handle_result && item.handle_result.trim()
    ? item.handle_result
    : '等待管理员回复'
}

const formatDate = (dateString) => formatDateTime(dateString)

const goPage = (p) => {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  loadMyFeedbacks()
}

const submitFeedback = async () => {
  if (!content.value.trim()) {
    return uni.showToast({ title: '请输入反馈内容', icon: 'none' })
  }

  const token = uni.getStorageSync('token')
  if (!token) {
    return uni.navigateTo({ url: '/pages/login/login' })
  }

  try {
    await feedbackApi.submit({ content: content.value.trim() })
    uni.showToast({ title: '提交成功', icon: 'success' })
    content.value = ''
    page.value = 1
    loadMyFeedbacks()
  } catch (e) {
    console.error('提交反馈失败:', e)
  }
}

const loadMyFeedbacks = async () => {
  const token = uni.getStorageSync('token')
  if (!token) return

  loading.value = true
  try {
    const res = await feedbackApi.getMyList({ page: page.value, pageSize: 10 })
    if (res.code === 200) {
      feedbackList.value = res.data.list || res.data || []
      const total = res.data.total || 0
      totalPages.value = Math.max(1, Math.ceil(total / 10))
    }
  } catch (e) {
    console.error('获取反馈列表失败:', e)
  } finally {
    loading.value = false
  }
}

const deleteFeedback = (item) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条反馈吗？删除后不可恢复。',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        await feedbackApi.delete(item.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        if (feedbackList.value.length === 1 && page.value > 1) {
          page.value--
        }
        loadMyFeedbacks()
      } catch (e) {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

onShow(() => {
  loadMyFeedbacks()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.section {
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

.feedback-input {
  width: 100%;
  min-height: 200rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.input-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8rpx;
}

.char-count {
  font-size: 24rpx;
  color: #999;
}

.submit-btn {
  margin-top: 24rpx;
  background: linear-gradient(135deg, #007aff, #00c6ff);
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  height: 88rpx;
  line-height: 88rpx;
}

.submit-btn[disabled] {
  background: #ccc;
  color: #fff;
}

.empty-state {
  text-align: center;
  padding: 60rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.feedback-list {
  gap: 20rpx;
}

.feedback-item {
  padding: 24rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  background: #fff;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.feedback-status {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.feedback-status.pending {
  background: #fff3e0;
  color: #ff9500;
}

.feedback-status.processed {
  background: #e8f5e9;
  color: #4caf50;
}

.feedback-time {
  font-size: 24rpx;
  color: #999;
}

.feedback-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.feedback-result {
  background: #f0f9ff;
  padding: 16rpx;
  border-radius: 8rpx;
  border-left: 4rpx solid #007aff;
  margin-top: 12rpx;
}

.result-label {
  font-size: 24rpx;
  color: #007aff;
  display: block;
  margin-bottom: 6rpx;
}

.result-content {
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.feedback-handler {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}

.handler-label {
  color: #999;
}

.handler-name {
  color: #666;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  margin-top: 20rpx;
}

.feedback-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12rpx;
}

.btn-sm {
  padding: 12rpx 20rpx;
  font-size: 24rpx;
  border-radius: 8rpx;
  border: 2rpx solid #e0e0e0;
  background: #f8f8f8;
}

.btn-danger {
  background: #ff3b30;
  color: #fff;
  border-color: #ff3b30;
}

.page-info {
  font-size: 26rpx;
  color: #666;
}
</style>

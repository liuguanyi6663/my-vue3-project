<template>
  <view class="admin-page">
    <view class="admin-header">
      <text class="admin-title">意见反馈管理</text>
      <text class="admin-desc">查看并处理用户提交的意见反馈</text>
    </view>

    <view class="content-section card">
      <view class="stats-bar">
        <view class="stat-item">
          <text class="stat-num pending-num">{{ stats.pending }}</text>
          <text class="stat-label">待处理</text>
        </view>
        <view class="stat-item">
          <text class="stat-num processed-num">{{ stats.processed }}</text>
          <text class="stat-label">已处理</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ stats.total }}</text>
          <text class="stat-label">总计</text>
        </view>
      </view>

      <view class="filter-bar">
        <view class="filter-item">
          <text class="filter-label">状态：</text>
          <picker mode="selector" :range="statusOptions" :value="statusIndex" @change="onStatusChange">
            <view class="picker">{{ statusOptions[statusIndex] }}</view>
          </picker>
        </view>
      </view>

      <view class="empty-state" v-if="feedbackList.length === 0 && !loading">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无意见反馈</text>
      </view>

      <view class="feedback-list" v-else>
        <view class="feedback-item" v-for="item in feedbackList" :key="item.id">
          <view class="feedback-header-row">
            <text class="feedback-status-tag" :class="item.status">{{ statusLabel(item.status) }}</text>
            <text class="feedback-time">{{ formatDate(item.created_at) }}</text>
          </view>

          <view class="feedback-info">
            <text class="info-label">反馈用户：</text>
            <text class="info-value">{{ item.user_name || '未知用户' }}</text>
          </view>
          <view class="feedback-info" v-if="item.student_id">
            <text class="info-label">学号：</text>
            <text class="info-value">{{ item.student_id }}</text>
          </view>
          <view class="feedback-info" v-if="item.college">
            <text class="info-label">学院：</text>
            <text class="info-value">{{ item.college }}</text>
          </view>

          <view class="feedback-content-block">
            <text class="content-label">反馈内容：</text>
            <text class="content-text">{{ item.content }}</text>
          </view>

          <view class="feedback-content-block">
            <text class="content-label">处理回复：</text>
            <text class="content-text result-text">{{ getHandleReply(item) }}</text>
          </view>

          <view class="feedback-info" v-if="item.status === 'processed' && item.handler_name">
            <text class="info-label">处理人：</text>
            <text class="info-value">{{ item.handler_name }}</text>
          </view>
          <view class="feedback-info" v-if="item.status === 'processed' && item.handled_at">
            <text class="info-label">处理时间：</text>
            <text class="info-value">{{ formatDate(item.handled_at) }}</text>
          </view>

          <view class="feedback-actions">
            <button class="btn-sm btn-success" @click="openReplyEditor(item)">
              {{ activeReplyId === item.id ? '收起回复' : (item.status === 'processed' ? '修改回复' : '处理回复') }}
            </button>
          </view>

          <view class="reply-editor" v-if="activeReplyId === item.id">
            <textarea
              class="reply-textarea"
              v-model="replyContent"
              placeholder="请输入处理回复内容..."
              :maxlength="500"
              auto-height
              :focus="activeReplyId === item.id"
              confirm-type="done"
              cursor-spacing="24"
            />
            <view class="dialog-footer">
              <text class="char-count">{{ replyContent.length }}/500</text>
            </view>
            <view class="dialog-actions">
              <button class="btn-sm" @click="closeReplyEditor">取消</button>
              <button class="btn-sm btn-success" :disabled="submitting" @click="confirmHandle">
                {{ submitting ? '提交中...' : '确认处理' }}
              </button>
            </view>
          </view>
        </view>
      </view>

      <view class="pagination" v-if="feedbackList.length > 0">
        <button class="btn-sm" :disabled="page === 1" @click="goPage(page - 1)">上一页</button>
        <text class="page-info">第 {{ page }} / {{ totalPages }} 页</text>
        <button class="btn-sm" :disabled="page >= totalPages" @click="goPage(page + 1)">下一页</button>
      </view>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { feedbackApi } from '@/api/index'
import { formatDateTime } from '@/utils/date'

const feedbackList = ref([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const submitting = ref(false)
const activeReplyId = ref(null)
const replyContent = ref('')
const currentItem = ref(null)
const stats = ref({ pending: 0, processed: 0, total: 0 })

const statusOptions = ['全部', '待处理', '已处理']
const statusIndex = ref(0)
const statusMap = { 0: null, 1: 'pending', 2: 'processed' }

const onStatusChange = (e) => {
  statusIndex.value = Number(e.detail.value)
  page.value = 1
  loadFeedbacks()
}

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
  loadFeedbacks()
}

const loadFeedbacks = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: 10 }
    const status = statusMap[statusIndex.value]
    if (status) params.status = status

    const res = await feedbackApi.getList(params)
    if (res.code === 200) {
      feedbackList.value = res.data.list || []
      const total = res.data.total || 0
      totalPages.value = Math.max(1, Math.ceil(total / 10))
    }
  } catch (e) {
    console.error('获取反馈列表失败:', e)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await feedbackApi.getStats()
    if (res.code === 200) {
      stats.value = res.data
    }
  } catch (e) {
    console.error('获取统计失败:', e)
  }
}

const openReplyEditor = (item) => {
  if (activeReplyId.value === item.id) {
    closeReplyEditor()
    return
  }
  currentItem.value = item
  activeReplyId.value = item.id
  replyContent.value = item.handle_result || ''
}

const closeReplyEditor = () => {
  if (submitting.value) return
  activeReplyId.value = null
  currentItem.value = null
  replyContent.value = ''
}

const confirmHandle = async () => {
  if (!currentItem.value || submitting.value) return

  try {
    submitting.value = true
    const res = await feedbackApi.handle(currentItem.value.id, {
      handle_result: replyContent.value,
      status: 'processed'
    })

    if (res.code === 200) {
      uni.showToast({ title: '处理成功', icon: 'success' })
      closeReplyEditor()
      await loadFeedbacks()
      await loadStats()
    }
  } catch (e) {
    console.error('处理反馈失败:', e)
    uni.showToast({ title: e?.msg || '处理失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadFeedbacks()
  loadStats()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: linear-gradient(135deg, #5856d6, #007aff);
  padding: 80rpx 40rpx 40rpx;
  text-align: center;
}

.admin-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.admin-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

.content-section {
  margin: -30rpx 24rpx 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.stats-bar {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
}

.stat-num {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.pending-num {
  color: #ff9500;
}

.processed-num {
  color: #4caf50;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
}

.filter-bar {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.filter-item {
  flex: 1;
}

.filter-label {
  font-size: 26rpx;
  color: #666;
  margin-right: 10rpx;
}

.picker {
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 26rpx;
  background: #f8f8f8;
  min-height: 60rpx;
  display: flex;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
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

.feedback-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.feedback-status-tag {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.feedback-status-tag.pending {
  background: #fff3e0;
  color: #ff9500;
}

.feedback-status-tag.processed {
  background: #e8f5e9;
  color: #4caf50;
}

.feedback-time {
  font-size: 24rpx;
  color: #999;
}

.feedback-info {
  display: flex;
  margin-bottom: 8rpx;
  font-size: 26rpx;
}

.info-label {
  color: #999;
  min-width: 160rpx;
  flex-shrink: 0;
}

.info-value {
  color: #333;
  flex: 1;
  word-break: break-all;
}

.feedback-content-block {
  margin-bottom: 12rpx;
}

.content-label {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.content-text {
  display: block;
  font-size: 28rpx;
  color: #333;
  background: #f8f8f8;
  padding: 16rpx 20rpx;
  border-radius: 8rpx;
  border-left: 4rpx solid #007aff;
  line-height: 1.6;
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.result-text {
  border-left-color: #4caf50;
  background: #f0f9f0;
}

.feedback-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
  justify-content: flex-end;
}

.reply-editor {
  margin-top: 16rpx;
  padding: 20rpx;
  background: #f8fbff;
  border: 2rpx solid #d9e9ff;
  border-radius: 12rpx;
}

.reply-textarea {
  width: 100%;
  min-height: 180rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8rpx;
  margin-bottom: 20rpx;
}

.char-count {
  font-size: 24rpx;
  color: #999;
}

.dialog-actions {
  display: flex;
  gap: 20rpx;
  justify-content: flex-end;
}

.btn-sm {
  padding: 12rpx 20rpx;
  font-size: 22rpx;
  border-radius: 8rpx;
  border: 2rpx solid #e0e0e0;
  background: #f8f8f8;
}

.btn-sm[disabled] {
  opacity: 0.65;
}

.btn-success {
  background: #4caf50;
  color: #fff;
  border-color: #4caf50;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  margin-top: 30rpx;
}

.page-info {
  font-size: 28rpx;
  color: #666;
}
</style>

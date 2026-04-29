<template>
  <view class="admin-page">
    <view class="admin-header">
      <text class="admin-title">举报受理</text>
      <text class="admin-desc">查看和处理用户举报</text>
    </view>

    <view class="content-section card">
      <view class="filter-bar">
        <view class="filter-item">
          <text class="filter-label">状态：</text>
          <picker mode="selector" :range="statusOptions" :value="statusIndex" @change="onStatusChange">
            <view class="picker">{{ statusOptions[statusIndex] }}</view>
          </picker>
        </view>
        <view class="filter-item">
          <text class="filter-label">类型：</text>
          <picker mode="selector" :range="typeOptions" :value="typeIndex" @change="onTypeChange">
            <view class="picker">{{ typeOptions[typeIndex] }}</view>
          </picker>
        </view>
      </view>

      <view class="stats-bar">
        <view class="stat-item">
          <text class="stat-num">{{ pendingCount }}</text>
          <text class="stat-label">待处理</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ processedCount }}</text>
          <text class="stat-label">已处理</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ totalCount }}</text>
          <text class="stat-label">总计</text>
        </view>
      </view>

      <view class="empty-state" v-if="reports.length === 0">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无举报记录</text>
      </view>

      <view class="report-list" v-else>
        <view class="report-item" v-for="item in reports" :key="item.id">
          <view class="report-header-row">
            <text class="report-type-tag" :class="item.target_type">{{ typeLabel(item.target_type) }}</text>
            <text class="report-status-tag" :class="item.status">{{ statusLabel(item.status) }}</text>
          </view>
          
          <view class="report-info">
            <text class="info-label">举报人：</text>
            <text class="info-value">{{ item.reporter_name || '未知' }}</text>
          </view>
          <view class="report-info">
            <text class="info-label">举报原因：</text>
            <text class="info-value">{{ item.reason }}</text>
          </view>
          <view class="report-info" v-if="item.description">
            <text class="info-label">详细描述：</text>
            <text class="info-value">{{ item.description }}</text>
          </view>
          <view class="report-info" v-if="item.target_content">
            <text class="info-label">被举报内容：</text>
            <text class="info-value target-content">{{ item.target_content }}</text>
          </view>
          <view class="report-info" v-if="item.target_author">
            <text class="info-label">内容作者：</text>
            <text class="info-value">{{ item.target_author }}</text>
          </view>
          <view class="report-info">
            <text class="info-label">举报时间：</text>
            <text class="info-value">{{ formatDate(item.created_at) }}</text>
          </view>
          
          <view class="report-info" v-if="item.status === 'processed'">
            <text class="info-label">处理结果：</text>
            <text class="info-value">{{ item.handle_result || '已处理' }}</text>
          </view>

          <view class="report-actions" v-if="item.status === 'pending'">
            <button class="btn-sm btn-danger" @click="handleReport(item, 'processed', 'delete_content', true)">删除内容+禁言</button>
            <button class="btn-sm btn-success" @click="handleReport(item, 'processed', 'delete_content')">删除内容</button>
            <button class="btn-sm btn-primary" @click="handleReport(item, 'processed', 'keep')">保留内容</button>
            <button class="btn-sm btn-warning" @click="handleReport(item, 'rejected', '')">驳回</button>
          </view>
        </view>
      </view>

      <view class="pagination" v-if="reports.length > 0">
        <button class="btn-sm" :disabled="page === 1" @click="page--; loadReports()">上一页</button>
        <text class="page-info">第 {{ page }} 页</text>
        <button class="btn-sm" @click="page++; loadReports()">下一页</button>
      </view>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/index'
import { formatDateTime } from '@/utils/date'

const reports = ref([])
const page = ref(1)
const pendingCount = ref(0)
const processedCount = ref(0)
const totalCount = ref(0)

const statusOptions = ['全部', '待处理', '已处理', '已驳回']
const statusIndex = ref(0)
const typeOptions = ['全部', '资料评论', '论坛评论', '论坛帖子', '资料', '广告', '聊天消息']
const typeIndex = ref(0)

const statusMap = { 0: null, 1: 'pending', 2: 'processed', 3: 'rejected' }
const typeMap = { 0: null, 1: 'review', 2: 'comment', 3: 'post', 4: 'material', 5: 'ad', 6: 'message' }

const onStatusChange = (e) => {
  statusIndex.value = e.detail.value
  page.value = 1
  loadReports()
}

const onTypeChange = (e) => {
  typeIndex.value = e.detail.value
  page.value = 1
  loadReports()
}

const loadReports = async () => {
  try {
    const params = { page: page.value, pageSize: 10 }
    const status = statusMap[statusIndex.value]
    if (status) params.status = status
    const targetType = typeMap[typeIndex.value]
    if (targetType) params.target_type = targetType
    
    const res = await adminApi.getReports(params)
    if (res.code === 200) {
      reports.value = res.data.list || res.data || []
      if (res.data.total !== undefined) {
        totalCount.value = res.data.total
      }
    }
    loadCounts()
  } catch (e) {
    console.error(e)
  }
}

const loadCounts = async () => {
  try {
    const pendingRes = await adminApi.getReports({ status: 'pending', pageSize: 1 })
    if (pendingRes.code === 200) {
      pendingCount.value = pendingRes.data.total || 0
    }
    const processedRes = await adminApi.getReports({ status: 'processed', pageSize: 1 })
    if (processedRes.code === 200) {
      processedCount.value = processedRes.data.total || 0
    }
  } catch (e) {
    console.error(e)
  }
}

const handleReport = async (item, status, action, banUser = false) => {
  const actionLabel = action === 'delete_content' ? '删除内容' : action === 'keep' ? '保留内容' : '驳回'
  const banLabel = banUser ? '并禁言用户' : ''
  uni.showModal({
    title: '确认操作',
    content: `确定要${actionLabel}这条举报${banLabel}吗？`,
    confirmColor: banUser ? '#ff4d4f' : '#1890ff',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        await adminApi.handleReport(item.id, { status, action, handle_result: actionLabel, ban_user: banUser })
        uni.showToast({ title: '处理成功', icon: 'success' })
        loadReports()
      } catch (e) {
        uni.showToast({ title: '处理失败', icon: 'none' })
      }
    }
  })
}

const typeLabel = (type) => {
  const map = { review: '资料评论', comment: '论坛评论', post: '论坛帖子', material: '资料', ad: '广告', message: '聊天消息' }
  return map[type] || type
}

const statusLabel = (status) => {
  const map = { pending: '待处理', processed: '已处理', rejected: '已驳回' }
  return map[status] || status
}

const formatDate = (dateString) => formatDateTime(dateString)

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: linear-gradient(135deg, #ff6b35, #ff3b30);
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
  color: rgba(255,255,255,0.85);
}

.content-section {
  margin: -30rpx 24rpx 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
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

.stat-label {
  font-size: 22rpx;
  color: #999;
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

.report-list {
  gap: 20rpx;
}

.report-item {
  padding: 24rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  background: #fff;
}

.report-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.report-type-tag {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #fff;
}

.report-type-tag.review {
  background: #007AFF;
}

.report-type-tag.comment {
  background: #5856d6;
}

.report-type-tag.post {
  background: #ff9500;
}

.report-type-tag.material {
  background: #4CAF50;
}

.report-type-tag.ad {
  background: #ff2d55;
}

.report-status-tag {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.report-status-tag.pending {
  background: #fff3e0;
  color: #ff9500;
}

.report-status-tag.processed {
  background: #e8f5e9;
  color: #4CAF50;
}

.report-status-tag.rejected {
  background: #f5f5f5;
  color: #999;
}

.report-info {
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
}

.target-content {
  background: #fff8f0;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  border-left: 4rpx solid #ff9500;
}

.report-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 12rpx 20rpx;
  font-size: 22rpx;
  border-radius: 8rpx;
  border: 2rpx solid #e0e0e0;
  background: #f8f8f8;
}

.btn-success {
  background: #ff3b30;
  color: #fff;
  border-color: #ff3b30;
}

.btn-primary {
  background: #4CAF50;
  color: #fff;
  border-color: #4CAF50;
}

.btn-warning {
  background: #f5f5f5;
  color: #999;
  border-color: #e0e0e0;
}

.btn-danger {
  background: #cf1322;
  color: #fff;
  border-color: #cf1322;
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

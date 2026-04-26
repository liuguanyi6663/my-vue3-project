<template>
  <view class="page">
    <view class="list-section">
      <view v-for="item in uploadList" :key="item.id" class="upload-item card">
        <view class="item-header" @click="goDetail(item)">
          <view class="item-info">
            <text class="item-title">{{ item.title }}</text>
            <view class="item-meta">
              <text class="meta-tag">{{ item.category_name || '未分类' }}</text>
              <text class="meta-dot">·</text>
              <text class="meta-text">{{ formatFileSize(item.file_size) }}</text>
              <text class="meta-dot">·</text>
              <text class="meta-text">{{ formatRelativeTime(item.created_at) }}</text>
            </view>
          </view>
          <view class="audit-badge" :class="item.audit_status">
            <text class="badge-text">{{ getAuditLabel(item.audit_status) }}</text>
          </view>
        </view>

        <view class="item-stats" @click="goDetail(item)">
          <text class="stats-text">浏览 {{ item.view_count || 0 }}</text>
          <text class="stats-text">下载 {{ item.download_count || 0 }}</text>
          <text class="stats-text">点赞 {{ item.like_count || 0 }}</text>
          <text v-if="item.avg_score > 0" class="stats-text">评分 {{ item.avg_score }}</text>
        </view>

        <view class="item-actions">
          <view class="action-btn" @click="goDetail(item)">
            <text class="action-icon">查看</text>
          </view>
          <view class="action-btn" v-if="item.audit_status === 'approved'" @click="downloadFile(item)">
            <text class="action-icon">下载</text>
          </view>
          <view class="action-btn delete" @click="confirmDelete(item)">
            <text class="action-icon">删除</text>
          </view>
        </view>
      </view>

      <view v-if="uploadList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📄</text>
        <text class="empty-text" v-if="currentFilter">暂无{{ getAuditLabel(currentFilter) }}的资料</text>
        <text class="empty-text" v-else>暂无上传的资料</text>
        <text class="empty-hint">点击右下角按钮上传你的第一份资料吧~</text>
      </view>
    </view>

    <view v-if="loading" class="loading-tip">
      <text>加载中...</text>
    </view>

    <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
      <text>加载更多</text>
    </view>

    <view class="fab-btn" @click="goUpload">
      <text class="fab-icon">+</text>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { materialApi } from '@/api/index'
import { formatRelativeTime } from '@/utils/date'

const uploadList = ref([])
const loading = ref(false)
const currentFilter = ref('')
const page = ref(1)
const pageSize = 10
const hasMore = ref(false)
const stats = ref({
  total: 0,
  pending_count: 0,
  approved_count: 0,
  rejected_count: 0
})

const loadUploads = async (reset = false) => {
  if (loading.value) return
  loading.value = true

  if (reset) {
    page.value = 1
    uploadList.value = []
  }

  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uploadList.value = []
      return
    }

    const params = { page: page.value, pageSize }
    if (currentFilter.value) {
      params.audit_status = currentFilter.value
    }

    const res = await materialApi.getMyUploads(params)
    const list = res.data?.list || []
    const totalPages = Number(res.data?.totalPages || 1)

    uploadList.value = reset ? list : [...uploadList.value, ...list]
    hasMore.value = page.value < totalPages

    if (res.data?.stats) {
      stats.value = res.data.stats
    }
  } catch (e) {
    console.error('加载上传记录失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const filterByStatus = (status) => {
  currentFilter.value = status
  loadUploads(true)
}

const loadMore = () => {
  page.value += 1
  loadUploads(false)
}

const goDetail = (item) => {
  uni.navigateTo({ url: `/pages/materials/detail?id=${item.id}` })
}

const goUpload = () => {
  uni.navigateTo({ url: '/pages/materials/upload' })
}

const downloadFile = (item) => {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }

  uni.downloadFile({
    url: `http://127.0.0.1:3000/api/material/download/${item.id}`,
    header: { Authorization: `Bearer ${token}` },
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true
        })
      }
    },
    fail: () => {
      uni.showToast({ title: '下载失败', icon: 'none' })
    }
  })
}

const confirmDelete = (item) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除“${item.title}”吗？删除后不可恢复。`,
    confirmColor: '#ff3b30',
    success: async (res) => {
      if (!res.confirm) return

      try {
        await materialApi.deleteMaterial(item.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        loadUploads(true)
      } catch (e) {
        console.error('删除失败:', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0B'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const getAuditLabel = (status) => {
  const map = {
    pending: '审核中',
    approved: '已通过',
    rejected: '未通过'
  }
  return map[status] || status
}

onShow(() => {
  loadUploads(true)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  margin: 20rpx 24rpx;
  padding: 24rpx 0;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}

.stat-num.active {
  color: #007aff;
}

.stat-num.approved {
  color: #4caf50;
}

.stat-num.approved.active,
.stat-num.pending.active,
.stat-num.rejected.active {
  color: #007aff;
}

.stat-num.pending {
  color: #ff9500;
}

.stat-num.rejected {
  color: #ff3b30;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.list-section {
  padding: 0 24rpx;
}

.upload-item {
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-info {
  flex: 1;
  margin-right: 16rpx;
}

.item-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 22rpx;
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  margin-right: 8rpx;
}

.meta-dot {
  font-size: 22rpx;
  color: #ccc;
  margin: 0 4rpx;
}

.meta-text {
  font-size: 22rpx;
  color: #999;
}

.audit-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.audit-badge.pending {
  background: rgba(255, 149, 0, 0.1);
}

.audit-badge.approved {
  background: rgba(76, 175, 80, 0.1);
}

.audit-badge.rejected {
  background: rgba(255, 59, 48, 0.1);
}

.badge-text {
  font-size: 22rpx;
  font-weight: 500;
}

.audit-badge.pending .badge-text {
  color: #ff9500;
}

.audit-badge.approved .badge-text {
  color: #4caf50;
}

.audit-badge.rejected .badge-text {
  color: #ff3b30;
}

.item-stats {
  display: flex;
  padding: 16rpx 0 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
  margin-top: 12rpx;
}

.stats-text {
  font-size: 22rpx;
  color: #999;
  margin-right: 24rpx;
}

.item-actions {
  display: flex;
  padding-top: 16rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  margin-right: 40rpx;
  padding: 8rpx 0;
}

.action-icon {
  font-size: 24rpx;
  color: #666;
}

.action-btn.delete .action-icon {
  color: #ff3b30;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}

.loading-tip {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}

.load-more {
  text-align: center;
  padding: 30rpx;
  color: #007aff;
  font-size: 26rpx;
}

.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 160rpx;
  width: 110rpx;
  height: 110rpx;
  border-radius: 55rpx;
  background: linear-gradient(135deg, #007aff, #00c6ff);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.4);
  z-index: 100;
}

.fab-icon {
  font-size: 52rpx;
  color: #fff;
  font-weight: 300;
  line-height: 1;
}
</style>

<template>
  <view class="page">
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>
    <view v-else-if="!notification" class="empty-state">
      <text class="empty-text">通知不存在</text>
    </view>
    <view v-else class="notification-detail">
      <view class="detail-tags">
        <text v-if="notification.is_top === 1" class="tag tag-top">置顶</text>
        <text class="tag" :class="'tag-' + notification.type">{{ getTypeLabel(notification.type) }}</text>
      </view>
      <text class="detail-title">{{ notification.title }}</text>
      <view class="detail-meta">
        <text class="detail-publisher" v-if="notification.publisher_name">发布人: {{ notification.publisher_name }}</text>
        <text class="detail-time">{{ formatTime(notification.created_at) }}</text>
        <text class="detail-views">{{ notification.view_count || 0 }}次浏览</text>
      </view>
      <view class="detail-content">
        <rich-text :nodes="formatContent(notification.content || '暂无内容')"></rich-text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { homeApi } from '@/api/index'
import { formatDateTime } from '@/utils/date'

const notification = ref(null)
const loading = ref(false)

const getTypeLabel = (type) => {
  const map = { notice: '通知', announcement: '公告', urgent: '紧急' }
  return map[type] || '通知'
}

const formatContent = (content) => {
  if (!content) return '暂无内容'
  return content.replace(/\n/g, '<br/>')
}

const loadNotificationDetail = async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = currentPage?.options?.id
  
  if (!id) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }
  
  loading.value = true
  try {
    const res = await homeApi.getNotificationDetail(id)
    notification.value = res.data
  } catch (e) {
    console.error('加载通知详情失败:', e)
  } finally {
    loading.value = false
  }
}

const formatTime = (time) => formatDateTime(time)

onMounted(() => {
  loadNotificationDetail()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f8f8f8;
}

.loading-state {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 24rpx;
}

.empty-state {
  padding: 100rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.notification-detail {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.detail-tags {
  display: flex;
  gap: 10rpx;
  margin-bottom: 16rpx;
}

.tag {
  font-size: 20rpx;
  color: #fff;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
}

.tag-top {
  background: #ff6b6b;
}

.tag-notice {
  background: #4CAF50;
}

.tag-announcement {
  background: #1890ff;
}

.tag-urgent {
  background: #ff4d4f;
}

.detail-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  margin-bottom: 20rpx;
  display: block;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 30rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.detail-publisher {
  font-size: 24rpx;
  color: #4CAF50;
}

.detail-time {
  font-size: 24rpx;
  color: #999;
}

.detail-views {
  font-size: 24rpx;
  color: #999;
}

.detail-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  word-break: break-all;
  overflow-wrap: break-word;
}
</style>

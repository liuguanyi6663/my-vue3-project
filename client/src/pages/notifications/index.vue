<template>
  <view class="page">
    <view class="notification-header">
      <text class="header-title">通知公告</text>
    </view>
    
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>
    <view v-else-if="notifications.length === 0" class="empty-state">
      <text class="empty-text">暂无通知</text>
    </view>
    <view v-else class="notification-list">
      <view v-for="notification in notifications" :key="notification.id" class="notification-item" @click="goNotificationDetail(notification.id)">
        <view class="notification-content">
          <view class="notification-title-row">
            <text v-if="notification.is_top === 1" class="top-badge">置顶</text>
            <text class="type-badge" :class="'type-' + notification.type">{{ getTypeLabel(notification.type) }}</text>
            <text class="notification-title" :class="{ 'title-top': notification.is_top === 1 }">{{ notification.title }}</text>
          </view>
          <view class="notification-meta">
            <text class="notification-publisher" v-if="notification.publisher_name">{{ notification.publisher_name }}</text>
            <text class="notification-time">{{ formatTime(notification.created_at) }}</text>
            <text class="notification-views">{{ notification.view_count || 0 }}次浏览</text>
          </view>
        </view>
        <text class="arrow">></text>
      </view>
    </view>

    <view v-if="hasMore" class="load-more" @click="loadMore">
      <text>{{ loadingMore ? '加载中...' : '加载更多' }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { homeApi } from '@/api/index'
import { formatDateTime } from '@/utils/date'

const notifications = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const hasMore = ref(false)

const getTypeLabel = (type) => {
  const map = { notice: '通知', announcement: '公告', urgent: '紧急' }
  return map[type] || '通知'
}

const loadNotifications = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  try {
    const res = await homeApi.getNotifications(page.value, pageSize.value)
    const list = res.data?.list || []
    if (isLoadMore) {
      notifications.value = [...notifications.value, ...list]
    } else {
      notifications.value = list
    }
    total.value = res.data?.total || 0
    hasMore.value = notifications.value.length < total.value
  } catch (e) {
    console.error('加载通知失败:', e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  loadNotifications(true)
}

const goNotificationDetail = (id) => {
  uni.navigateTo({ url: `/pages/notifications/detail?id=${id}` })
}

const formatTime = (time) => formatDateTime(time)

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f8f8f8;
}

.notification-header {
  background: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
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

.notification-list {
  margin: 20rpx 0;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 24rpx 30rpx;
  margin-bottom: 1rpx;
}

.notification-item:active {
  background: #f9f9f9;
}

.notification-content {
  flex: 1;
}

.notification-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
  overflow: hidden;
}

.top-badge {
  font-size: 18rpx;
  color: #fff;
  background: #ff6b6b;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
  flex-shrink: 0;
}

.type-badge {
  font-size: 18rpx;
  color: #fff;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
  flex-shrink: 0;
}

.type-notice {
  background: #4CAF50;
}

.type-announcement {
  background: #1890ff;
}

.type-urgent {
  background: #ff4d4f;
}

.notification-title {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.notification-title.title-top {
  font-weight: bold;
  color: #333;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.notification-publisher {
  font-size: 20rpx;
  color: #4CAF50;
}

.notification-time {
  font-size: 20rpx;
  color: #999;
}

.notification-views {
  font-size: 20rpx;
  color: #999;
}

.arrow {
  font-size: 24rpx;
  color: #999;
  margin-left: 20rpx;
}

.load-more {
  text-align: center;
  padding: 30rpx 0;
  color: #4CAF50;
  font-size: 26rpx;
  background: #fff;
  margin-top: 10rpx;
}
</style>

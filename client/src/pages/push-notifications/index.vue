<template>
  <view class="page">
    <view class="notification-header">
      <text class="header-title">消息通知</text>
      <text v-if="unreadCount > 0" class="mark-all-read" @click="handleMarkAllRead">全部已读</text>
    </view>
    
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>
    <view v-else-if="notifications.length === 0" class="empty-state">
      <text class="empty-text">暂无消息通知</text>
    </view>
    <view v-else class="notification-list">
      <view 
        v-for="notification in notifications" 
        :key="notification.id" 
        class="notification-item"
        :class="{ 'unread': !notification.is_read }"
        @click="handleNotificationClick(notification)"
      >
        <view class="notification-icon">
          <text :class="'icon-' + getTypeClass(notification.type)">{{ getTypeIcon(notification.type) }}</text>
        </view>
        <view class="notification-content">
          <view class="notification-title-row">
            <text class="type-badge" :class="'type-' + notification.type">{{ getTypeLabel(notification.type) }}</text>
            <text class="notification-title">{{ notification.title }}</text>
          </view>
          <view class="notification-desc">{{ notification.content }}</view>
          <view class="notification-meta">
            <text class="notification-time">{{ formatTime(notification.created_at) }}</text>
          </view>
        </view>
        <view class="notification-action">
          <view v-if="!notification.is_read" class="unread-dot"></view>
          <text class="delete-btn" @click.stop="handleDeleteNotification(notification.id)">删除</text>
        </view>
      </view>
    </view>

    <view v-if="hasMore" class="load-more" @click="loadMore">
      <text>{{ loadingMore ? '加载中...' : '加载更多' }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onShow } from 'vue'
import { notificationApi } from '@/api/index'
import { formatDateTime } from '@/utils/date'
import { getCurrentUser } from '@/utils/auth'

const notifications = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const hasMore = ref(false)
const unreadCount = ref(0)

const getTypeLabel = (type) => {
  const map = {
    timeline_reminder: '考研提醒',
    new_message: '新消息',
    new_post: '帖子通知',
    post_reply: '回复通知',
    post_like: '点赞通知',
    material_review: '资料审核',
    audit_result: '审核结果',
    system: '系统通知'
  }
  return map[type] || '通知'
}

const getTypeIcon = (type) => {
  const map = {
    timeline_reminder: '⏰',
    new_message: '💬',
    new_post: '📝',
    post_reply: '💭',
    post_like: '❤️',
    material_review: '📚',
    audit_result: '✅',
    system: '🔔'
  }
  return map[type] || '📢'
}

const getTypeClass = (type) => {
  return type || 'default'
}

const loadNotifications = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  try {
    const res = await notificationApi.getList({ page: page.value, pageSize: pageSize.value })
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
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadUnreadCount = async () => {
  try {
    const res = await notificationApi.getUnreadCount()
    unreadCount.value = res.data?.count || 0
  } catch (e) {
    console.error('加载未读数失败:', e)
  }
}

const loadMore = () => {
  page.value++
  loadNotifications(true)
}

const handleNotificationClick = async (notification) => {
  if (!notification.is_read) {
    try {
      await notificationApi.markRead(notification.id)
      notification.is_read = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (e) {
      console.error('标记已读失败:', e)
    }
  }
}

const handleMarkAllRead = async () => {
  try {
    await notificationApi.markAllRead()
    notifications.value.forEach(n => n.is_read = 1)
    unreadCount.value = 0
    uni.showToast({ title: '标记成功', icon: 'success' })
  } catch (e) {
    console.error('标记全部已读失败:', e)
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const handleDeleteNotification = async (id) => {
  try {
    const res = await uni.showModal({
      title: '提示',
      content: '确定删除这条通知吗？',
      confirmText: '删除',
      confirmColor: '#FF3B30'
    })
    
    if (res.confirm) {
      await notificationApi.delete(id)
      notifications.value = notifications.value.filter(n => n.id !== id)
      uni.showToast({ title: '删除成功', icon: 'success' })
    }
  } catch (e) {
    console.error('删除通知失败:', e)
    uni.showToast({ title: '删除失败', icon: 'none' })
  }
}

const formatTime = (time) => formatDateTime(time)

onShow(() => {
  loadUnreadCount()
})

onMounted(() => {
  loadNotifications()
  loadUnreadCount()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f8f8f8;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.mark-all-read {
  font-size: 28rpx;
  color: #007aff;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

.notification-list {
  padding: 20rpx;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.notification-item.unread {
  background: linear-gradient(135deg, #fff8f8 0%, #fff 100%);
  border-left: 6rpx solid #FF3B30;
}

.notification-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  margin-right: 20rpx;
}

.notification-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.type-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #f0f0f0;
  color: #666;
  margin-right: 12rpx;
}

.type-badge.type-timeline_reminder {
  background: #fff4e6;
  color: #ff9500;
}

.type-badge.type-new_message {
  background: #e6f7ff;
  color: #1890ff;
}

.type-badge.type-system {
  background: #f6ffed;
  color: #52c41a;
}

.type-badge.type-audit_result {
  background: #f9f0ff;
  color: #722ed1;
}

.notification-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  align-items: center;
}

.notification-time {
  font-size: 22rpx;
  color: #999;
}

.notification-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.unread-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #FF3B30;
}

.delete-btn {
  font-size: 24rpx;
  color: #999;
  padding: 8rpx 12rpx;
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}
</style>

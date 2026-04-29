<template>
  <view class="notice-page">
    <view class="notice-header">
      <text class="notice-title">信息发布</text>
      <text class="notice-desc">发布通知公告到首页</text>
    </view>

    <view class="notice-content">
      <view class="publish-section card">
        <text class="section-title">发布新通知</text>
        
        <view class="form-group">
          <text class="form-label">标题</text>
          <input class="form-input" v-model="form.title" placeholder="请输入通知标题" />
        </view>

        <view class="form-group">
          <text class="form-label">类型</text>
          <view class="type-selector">
            <view 
              v-for="item in typeOptions" 
              :key="item.value" 
              class="type-option" 
              :class="{ active: form.type === item.value }"
              @click="form.type = item.value"
            >
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">内容</text>
          <textarea class="form-textarea" v-model="form.content" placeholder="请输入通知内容" :maxlength="-1" />
        </view>

        <view class="form-group">
          <view class="switch-row">
            <text class="form-label">置顶</text>
            <switch :checked="form.is_top === 1" @change="form.is_top = form.is_top === 1 ? 0 : 1" color="#4CAF50" />
          </view>
        </view>

        <view class="form-group">
          <view class="switch-row">
            <text class="form-label">强提醒</text>
            <switch :checked="form.is_strong_remind === 1" @change="form.is_strong_remind = form.is_strong_remind === 1 ? 0 : 1" color="#ff6b6b" />
          </view>
        </view>

        <button class="publish-btn" @click="handlePublish" :disabled="publishing">
          {{ publishing ? '发布中...' : '发布通知' }}
        </button>
      </view>

      <view class="list-section card">
        <view class="section-header">
          <text class="section-title">已发布通知</text>
          <text class="section-count">共 {{ total }} 条</text>
        </view>

        <view v-if="loading" class="loading-state">
          <text>加载中...</text>
        </view>
        <view v-else-if="notifications.length === 0" class="empty-state">
          <text class="empty-text">暂无通知</text>
        </view>
        <view v-else class="notification-list">
          <view v-for="item in notifications" :key="item.id" class="notification-card">
            <view class="card-header">
              <view class="card-tags">
                <text v-if="item.is_top === 1" class="tag tag-top">置顶</text>
                <text class="tag" :class="'tag-' + item.type">{{ getTypeLabel(item.type) }}</text>
                <text v-if="item.status === 0" class="tag tag-hidden">已隐藏</text>
              </view>
              <text class="card-time">{{ formatTime(item.created_at) }}</text>
            </view>
            <text class="card-title">{{ item.title }}</text>
            <text class="card-content">{{ item.content ? item.content.substring(0, 60) + (item.content.length > 60 ? '...' : '') : '暂无内容' }}</text>
            <view class="card-footer">
              <text class="card-views">浏览 {{ item.view_count || 0 }}</text>
              <view class="card-actions">
                <text class="action-btn" :class="{ 'is-top': item.is_top === 1 }" @click="toggleTop(item)">
                  {{ item.is_top === 1 ? '取消置顶' : '置顶' }}
                </text>
                <text class="action-btn" @click="toggleStatus(item)">
                  {{ item.status === 1 ? '隐藏' : '显示' }}
                </text>
                <text class="action-btn action-delete" @click="handleDelete(item)">删除</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="notifications.length > 0 && notifications.length < total" class="load-more" @click="loadMore">
          <text>{{ loadingMore ? '加载中...' : '加载更多' }}</text>
        </view>
      </view>
    </view>

    <view style="height: 60rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/index.js'
import { formatDateTime } from '@/utils/date'

const form = ref({
  title: '',
  content: '',
  type: 'notice',
  is_top: 0,
  is_strong_remind: 0
})

const typeOptions = [
  { label: '通知', value: 'notice' },
  { label: '公告', value: 'announcement' },
  { label: '紧急', value: 'urgent' }
]

const notifications = ref([])
const loading = ref(false)
const publishing = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

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
    const res = await adminApi.getNotifications({ page: page.value, pageSize: pageSize.value })
    if (res.code === 200) {
      const list = res.data?.list || []
      if (isLoadMore) {
        notifications.value = [...notifications.value, ...list]
      } else {
        notifications.value = list
      }
      total.value = res.data?.total || 0
    }
  } catch (e) {
    console.error('加载通知列表失败:', e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  loadNotifications(true)
}

const handlePublish = async () => {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }
  if (!form.value.content.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }

  publishing.value = true
  try {
    const res = await adminApi.createNotification(form.value)
    if (res.code === 200) {
      uni.showToast({ title: '发布成功', icon: 'success' })
      form.value = { title: '', content: '', type: 'notice', is_top: 0, is_strong_remind: 0 }
      page.value = 1
      loadNotifications()
    } else {
      uni.showToast({ title: res.msg || '发布失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '发布失败', icon: 'none' })
  } finally {
    publishing.value = false
  }
}

const toggleTop = async (item) => {
  try {
    const newTop = item.is_top === 1 ? 0 : 1
    const res = await adminApi.updateNotification(item.id, { is_top: newTop })
    if (res.code === 200) {
      uni.showToast({ title: newTop ? '已置顶' : '已取消置顶', icon: 'success' })
      item.is_top = newTop
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const toggleStatus = async (item) => {
  try {
    const newStatus = item.status === 1 ? 0 : 1
    const res = await adminApi.updateNotification(item.id, { status: newStatus })
    if (res.code === 200) {
      uni.showToast({ title: newStatus === 1 ? '已显示' : '已隐藏', icon: 'success' })
      item.status = newStatus
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const handleDelete = (item) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除通知"${item.title}"吗？删除后不可恢复。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await adminApi.deleteNotification(item.id)
          if (result.code === 200) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            page.value = 1
            loadNotifications()
          }
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

const formatTime = (time) => formatDateTime(time)

onMounted(() => {
  const user = uni.getStorageSync('userInfo')
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    uni.showToast({ title: '权限不足', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return
  }
  loadNotifications()
})
</script>

<style scoped>
.notice-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.notice-header {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
}

.notice-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.notice-desc {
  font-size: 24rpx;
  color: rgba(255,255,255,0.85);
}

.notice-content {
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-count {
  font-size: 24rpx;
  color: #999;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 12rpx;
  display: block;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 240rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.type-selector {
  display: flex;
  gap: 16rpx;
}

.type-option {
  padding: 12rpx 32rpx;
  border-radius: 8rpx;
  border: 1rpx solid #e0e0e0;
  font-size: 26rpx;
  color: #666;
}

.type-option.active {
  background: #4CAF50;
  color: #fff;
  border-color: #4CAF50;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-row .form-label {
  margin-bottom: 0;
}

.publish-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: bold;
  margin-top: 16rpx;
}

.publish-btn[disabled] {
  opacity: 0.6;
}

.loading-state {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}

.empty-state {
  padding: 80rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.notification-card {
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.card-tags {
  display: flex;
  gap: 10rpx;
  align-items: center;
}

.tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  color: #fff;
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

.tag-hidden {
  background: #999;
}

.card-time {
  font-size: 22rpx;
  color: #999;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  margin-bottom: 8rpx;
  display: block;
}

.card-content {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16rpx;
  display: block;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-views {
  font-size: 22rpx;
  color: #999;
}

.card-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  font-size: 24rpx;
  color: #4CAF50;
  padding: 6rpx 16rpx;
  border: 1rpx solid #4CAF50;
  border-radius: 6rpx;
}

.action-btn.is-top {
  color: #ff6b6b;
  border-color: #ff6b6b;
}

.action-delete {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.load-more {
  text-align: center;
  padding: 30rpx 0;
  color: #4CAF50;
  font-size: 26rpx;
}
</style>

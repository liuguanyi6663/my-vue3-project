<template>
  <view class="page">
    <view v-if="conversations.length > 0" class="conv-list">
      <view 
        class="conv-item" 
        v-for="(item, index) in conversations" 
        :key="index"
        @click="goChat(item)"
      >
        <image class="conv-avatar" :src="getAvatarUrl(item.other_avatar)" mode="aspectFill" />
        <view class="conv-info">
          <view class="conv-top">
            <text class="conv-name">{{ item.other_nickname }}</text>
            <text class="conv-time">{{ formatTime(item.last_time) }}</text>
          </view>
          <view class="conv-bottom">
            <text class="conv-msg">{{ item.last_message }}</text>
            <view class="conv-badge" v-if="item.unread_count > 0">
              <text class="badge-text">{{ item.unread_count > 99 ? '99+' : item.unread_count }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="conversations.length === 0 && !loading" class="empty-state">
      <text class="empty-icon">💬</text>
      <text class="empty-text">暂无消息</text>
    </view>

    <view v-if="loading" class="loading-tip"><text>加载中...</text></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { messageApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'
import { formatMessageTime } from '@/utils/date'

const conversations = ref([])
const loading = ref(false)

const loadConversations = async () => {
  loading.value = true
  try {
    const res = await messageApi.getConversations()
    if (res.code === 200) {
      conversations.value = res.data || []
    }
  } catch (e) {
    console.error('加载会话列表失败:', e)
  } finally {
    loading.value = false
  }
}

const goChat = (item) => {
  uni.navigateTo({ 
    url: `/pages/mine/chat?userId=${item.other_user_id}&nickname=${encodeURIComponent(item.other_nickname)}` 
  })
}

const formatTime = (timeStr) => formatMessageTime(timeStr)

onShow(() => {
  loadConversations()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.conv-list {
  padding: 0;
}

.conv-item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.conv-item:active {
  background: #f9f9f9;
}

.conv-avatar {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.conv-info {
  flex: 1;
  overflow: hidden;
}

.conv-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.conv-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.conv-time {
  font-size: 22rpx;
  color: #999;
}

.conv-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conv-msg {
  font-size: 26rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 16rpx;
}

.conv-badge {
  background: #ff3b30;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.badge-text {
  font-size: 20rpx;
  color: #fff;
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
  color: #999;
}

.loading-tip {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}
</style>

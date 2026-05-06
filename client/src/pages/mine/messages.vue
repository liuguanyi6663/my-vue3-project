<template>
  <view class="page">
    <view v-if="conversations.length > 0" class="conv-list">
      <view 
        class="conv-item" 
        v-for="(item, index) in conversations" 
        :key="item.other_user_id"
        @click="goChat(item)"
        @touchstart="handleTouchStart($event, item)"
        @touchend="handleTouchEnd"
        @longpress="handleLongPress(item)"
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
let touchStartTime = 0
let touchStartItem = null

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

const handleTouchStart = (e, item) => {
  touchStartTime = Date.now()
  touchStartItem = item
}

const handleTouchEnd = () => {
  touchStartTime = 0
  touchStartItem = null
}

const handleLongPress = (item) => {
  uni.showModal({
    title: '删除对话',
    content: '确定要删除与 "' + item.other_nickname + '" 的对话记录吗？\n\n⚠️ 注意：此操作只会删除您这边的聊天记录，对方仍然可以看到完整的对话历史。',
    confirmColor: '#FF4D4F',
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await messageApi.deleteConversation(item.other_user_id)
          if (deleteRes.code === 200) {
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
            loadConversations()
          } else {
            uni.showToast({
              title: deleteRes.msg || '删除失败',
              icon: 'none'
            })
          }
        } catch (e) {
          console.error('删除对话失败:', e)
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      }
    }
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

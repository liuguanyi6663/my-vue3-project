<template>
  <view class="page">
    <scroll-view 
      class="chat-scroll" 
      scroll-y 
      :scroll-into-view="scrollToId"
      scroll-with-animation
    >
      <view class="chat-list" v-if="messages.length > 0">
        <view 
          class="msg-wrap"
          v-for="(msg, index) in messages" 
          :key="index"
          :id="'msg-' + index"
        >
          <view class="time-divider" v-if="shouldShowTime(index)">
            <text class="time-text">{{ formatTime(msg.created_at) }}</text>
          </view>

          <view 
            class="msg-item" 
            :class="{ 'msg-self': isSelf(msg) }"
          >
            <image 
              class="msg-avatar" 
              :src="getAvatarUrl(isSelf(msg) ? myAvatar : msg.sender_avatar)" 
              mode="aspectFill" 
            />

            <view class="msg-body">
              <view class="msg-nickname-row">
                <text class="msg-nickname">{{ isSelf(msg) ? myNickname : otherNickname }}</text>
              </view>
              <view class="msg-bubble">
                <text class="msg-content">{{ msg.content }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="messages.length === 0 && !loading" class="empty-state">
        <text class="empty-text">暂无消息，发送第一条消息吧~</text>
      </view>

      <view v-if="loading" class="loading-tip"><text>加载中...</text></view>
      
      <view class="scroll-bottom-anchor" id="scroll-bottom"></view>
      <view class="input-bar-spacer"></view>
    </scroll-view>

    <view class="input-bar" v-if="!isBanned">
      <input 
        class="msg-input" 
        v-model="inputText" 
        placeholder="输入消息..." 
        confirm-type="send"
        @confirm="sendMsg"
        :disabled="sending"
      />
      <button class="send-btn" @click="sendMsg" :disabled="!inputText.trim() || sending">
        {{ sending ? '...' : '发送' }}
      </button>
    </view>
    <view class="banned-bar" v-else>
      <text class="banned-bar-text">🔇 你已被禁言，请联系管理员解决</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { messageApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'
import { formatChatTime, getTimeSeed } from '@/utils/date'

const messages = ref([])
const inputText = ref('')
const isBanned = ref(false)
const sending = ref(false)
const loading = ref(false)
const currentUserId = ref(0)
const otherUserId = ref(0)
const otherNickname = ref('')
const myNickname = ref('')
const myAvatar = ref('')
const scrollToId = ref('')

const isSelf = (msg) => {
  return Number(msg.sender_id) === Number(currentUserId.value)
}

const shouldShowTime = (index) => {
  if (index === 0) return true
  const prev = new Date(messages.value[index - 1].created_at).getTime()
  const curr = new Date(messages.value[index].created_at).getTime()
  return curr - prev > 300000
}

const loadMessages = async () => {
  loading.value = true
  try {
    const res = await messageApi.getHistory(otherUserId.value)
    if (res.code === 200) {
      messages.value = res.data || []
      await nextTick()
      scrollToBottom()
    }
  } catch (e) {
    console.error('加载消息失败:', e)
  } finally {
    loading.value = false
  }
}

const sendMsg = async () => {
  if (isBanned.value) {
    uni.showToast({ title: '你已被禁言，请联系管理员解决', icon: 'none' })
    return
  }
  if (!inputText.value.trim() || sending.value) return

  sending.value = true
  try {
    const res = await messageApi.send({
      receiver_id: otherUserId.value,
      content: inputText.value.trim()
    })
    if (res.code === 200) {
      inputText.value = ''
      await loadMessages()
    } else {
      uni.showToast({ title: res.msg || '发送失败', icon: 'none' })
    }
  } catch (e) {
    console.error('发送消息失败:', e)
    uni.showToast({ title: '发送失败', icon: 'none' })
  } finally {
    sending.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messages.value.length > 0) {
      scrollToId.value = ''
      setTimeout(() => {
        scrollToId.value = 'scroll-bottom'
      }, 50)
    }
  })
}

const formatTime = (timeStr) => formatChatTime(timeStr)

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  otherUserId.value = parseInt(currentPage.options?.userId) || 0
  otherNickname.value = decodeURIComponent(currentPage.options?.nickname || '')

  if (otherNickname.value) {
    uni.setNavigationBarTitle({ title: otherNickname.value })
  }

  try {
    const raw = uni.getStorageSync('userInfo')
    let info = raw
    if (typeof raw === 'string') {
      info = JSON.parse(raw)
    }
    if (info && typeof info === 'object') {
      currentUserId.value = Number(info.id) || 0
      myNickname.value = info.nickname || ''
      myAvatar.value = info.avatar || ''
      if (info.is_banned === 1) {
        isBanned.value = true
      }
    }
    console.log('chat currentUserId:', currentUserId.value, 'myNickname:', myNickname.value)
  } catch (e) {
    console.error('获取用户信息失败:', e)
  }

  if (otherUserId.value) {
    loadMessages()
  }
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f0f0;
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
}

.chat-list {
  padding: 20rpx 24rpx 0;
}

.time-divider {
  text-align: center;
  padding: 20rpx 0 16rpx;
}

.time-text {
  font-size: 22rpx;
  color: #999;
  background: rgba(0, 0, 0, 0.04);
  padding: 6rpx 20rpx;
  border-radius: 8rpx;
}

.msg-wrap {
  margin-bottom: 16rpx;
}

.msg-item {
  display: flex;
  align-items: flex-start;
}

.msg-item.msg-self {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.msg-body {
  max-width: 520rpx;
  margin: 0 16rpx;
}

.msg-self .msg-body {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.msg-nickname-row {
  margin-bottom: 6rpx;
}

.msg-nickname {
  font-size: 22rpx;
  color: #999;
}

.msg-bubble {
  padding: 20rpx 24rpx;
  border-radius: 8rpx;
  background: #fff;
  word-break: break-all;
}

.msg-self .msg-bubble {
  background: #ff4d4f;
}

.msg-content {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
}

.msg-self .msg-content {
  color: #fff;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
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

.scroll-bottom-anchor {
  height: 1rpx;
}

.input-bar-spacer {
  height: calc(120rpx + env(safe-area-inset-bottom));
}

.input-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #f7f7f7;
  border-top: 1rpx solid #e0e0e0;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}

.msg-input {
  flex: 1;
  height: 72rpx;
  background: #fff;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 30rpx;
  border: 1rpx solid #e0e0e0;
}

.send-btn {
  margin-left: 16rpx;
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 28rpx;
  background: #07c160;
  color: #fff;
  font-size: 28rpx;
  border-radius: 8rpx;
  border: none;
}

.send-btn[disabled] {
  opacity: 0.4;
  background: #07c160;
  color: #fff;
}

.banned-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  background: #fff3e0;
  border-top: 1rpx solid #ffe0b2;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.banned-bar-text {
  font-size: 28rpx;
  color: #e65100;
  font-weight: 500;
}
</style>

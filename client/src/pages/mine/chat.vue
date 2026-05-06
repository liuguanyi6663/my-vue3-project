<template>
  <view class="page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="nav-back-icon">←</text>
      </view>
      <view class="nav-title">{{ otherNickname }}</view>
      <view class="nav-action" @click="showActionSheet">
        <text class="nav-action-icon">⋯</text>
      </view>
    </view>
    
    <scroll-view 
      class="chat-scroll" 
      scroll-y 
      :scroll-into-view="scrollToId"
      scroll-with-animation
    >
      <!-- 屏蔽提示条 -->
      <view v-if="isBlocking" class="blocking-bar">
        <text class="blocking-bar-text">🔒 你已屏蔽对方</text>
        <text class="blocking-bar-btn" @click="handleUnblock">取消屏蔽</text>
      </view>
      
      <view v-if="showFirstMessageTip && !isBlocking && !isDeleted" class="tip-bar">
        <text class="tip-bar-text">💡 对方回复你时，你只能发送一条消息</text>
      </view>
      
      <view class="chat-list" v-if="displayMessages.length > 0">
        <view 
          class="msg-wrap"
          v-for="(msg, index) in displayMessages" 
          :key="index"
          :id="'msg-' + index"
          @longpress="showMsgMenu(msg)"
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

      <view v-if="!loading && displayMessages.length === 0" class="empty-state">
        <text class="empty-text">暂无消息，发送第一条消息吧~</text>
      </view>

      <view v-if="loading" class="loading-tip"><text>加载中...</text></view>
      
      <view class="scroll-bottom-anchor" id="scroll-bottom"></view>
      <view class="input-bar-spacer"></view>
    </scroll-view>

    <view class="input-bar" v-if="!isBanned && !isBlocking">
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
    <view class="banned-bar" v-else-if="isBanned">
      <text class="banned-bar-text">🔒 你已被禁言，请联系管理员解决</text>
    </view>
    <view class="blocked-input-bar" v-else>
      <text class="blocked-input-text">🔒 你已屏蔽对方，无法发送消息</text>
    </view>

    <!-- 举报弹窗 -->
    <view v-if="showReportModal" class="modal-overlay" @click="showReportModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">举报消息</text>
          <text class="modal-close" @click="showReportModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="reported-msg">
            <text class="reported-msg-label">被举报内容：</text>
            <text class="reported-msg-text">{{ selectedMsg?.content }}</text>
          </view>
          <view class="form-item">
            <text class="form-label">举报原因 *</text>
            <picker mode="selector" :range="reportReasons" :value="reportReasons.indexOf(reportReason)" @change="(e) => reportReason = reportReasons[e.detail.value]">
              <view class="picker-value">{{ reportReason || '请选择' }}</view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">补充说明</text>
            <textarea 
              class="form-textarea" 
              v-model="reportDescription" 
              placeholder="请描述具体情况（选填）"
              maxlength="500"
            />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showReportModal = false">取消</button>
          <button class="btn-confirm" @click="submitReport">提交</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { messageApi, forumApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'
import { formatChatTime, getTimeSeed } from '@/utils/date'

const messages = ref([])
const inputText = ref('')
const isBanned = ref(false)
const isBlocking = ref(false)
const isDeleted = ref(false)
const sending = ref(false)
const loading = ref(false)
const currentUserId = ref(0)
const otherUserId = ref(0)
const otherNickname = ref('')
const myNickname = ref('')
const myAvatar = ref('')
const scrollToId = ref('')
const showFirstMessageTip = ref(false)
const showReportModal = ref(false)
const selectedMsg = ref(null)
const reportReason = ref('')
const reportDescription = ref('')
const reportReasons = ['垃圾广告', '骚扰辱骂', '违法违规', '虚假信息', '其他']

// 过滤消息 - 屏蔽时不显示对方的消息
const displayMessages = computed(() => {
  if (!isBlocking.value) return messages.value
  return messages.value.filter(msg => Number(msg.sender_id) === Number(currentUserId.value))
})

const isSelf = (msg) => {
  return Number(msg.sender_id) === Number(currentUserId.value)
}

const shouldShowTime = (index) => {
  if (index === 0) return true
  const prev = new Date(displayMessages.value[index - 1].created_at).getTime()
  const curr = new Date(displayMessages.value[index].created_at).getTime()
  return curr - prev > 300000
}

const goBack = () => {
  uni.navigateBack()
}

const showActionSheet = () => {
  const itemList = isBlocking.value ? ['取消屏蔽', '清除聊天记录'] : ['屏蔽用户', '清除聊天记录']
  uni.showActionSheet({
    itemList: itemList,
    itemColor: '#333',
    success: (res) => {
      if (res.tapIndex === 0) {
        if (isBlocking.value) {
          handleUnblock()
        } else {
          handleBlock()
        }
      } else if (res.tapIndex === 1) {
        handleClearChat()
      }
    }
  })
}

const handleBlock = async () => {
  uni.showModal({
    title: '确认屏蔽',
    content: '屏蔽后将不再接收对方的消息，对方也无法给你发消息',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          const res = await messageApi.blockUser(otherUserId.value)
          if (res.code === 200) {
            uni.showToast({ title: '屏蔽成功', icon: 'success' })
            isBlocking.value = true
          } else {
            uni.showToast({ title: res.msg || '屏蔽失败', icon: 'none' })
          }
        } catch (err) {
          console.error('屏蔽失败:', err)
          uni.showToast({ title: '屏蔽失败', icon: 'none' })
        }
      }
    }
  })
}

const handleUnblock = async () => {
  try {
    const res = await messageApi.unblockUser(otherUserId.value)
    if (res.code === 200) {
      uni.showToast({ title: '取消屏蔽成功', icon: 'success' })
      isBlocking.value = false
    } else {
      uni.showToast({ title: res.msg || '取消屏蔽失败', icon: 'none' })
    }
  } catch (err) {
    console.error('取消屏蔽失败:', err)
    uni.showToast({ title: '取消屏蔽失败', icon: 'none' })
  }
}

const handleClearChat = async () => {
  uni.showModal({
    title: '清除聊天记录',
    content: '确定要清除与 ' + otherNickname.value + ' 的聊天记录吗？\n\n⚠️ 注意：此操作只会清除您这边的聊天记录，对方仍然可以看到完整的对话历史。',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await messageApi.deleteConversation(otherUserId.value)
          if (deleteRes.code === 200) {
            uni.showToast({
              title: '清除成功',
              icon: 'success'
            })
            // 重新加载消息（会显示已清除状态）
            await loadMessages()
          } else {
            uni.showToast({
              title: deleteRes.msg || '清除失败',
              icon: 'none'
            })
          }
        } catch (err) {
          console.error('清除聊天记录失败:', err)
          uni.showToast({
            title: '清除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

const showMsgMenu = (msg) => {
  if (isSelf(msg)) {
    return
  }
  uni.showActionSheet({
    itemList: ['举报'],
    itemColor: '#ff4d4f',
    success: (res) => {
      if (res.tapIndex === 0) {
        selectedMsg.value = msg
        showReportModal.value = true
      }
    }
  })
}

const submitReport = async () => {
  if (!reportReason.value) {
    uni.showToast({ title: '请选择举报原因', icon: 'none' })
    return
  }
  
  try {
    const res = await forumApi.report({
      target_type: 'message',
      target_id: selectedMsg.value.id,
      reason: reportReason.value,
      description: reportDescription.value
    })
    if (res.code === 200) {
      uni.showToast({ title: '举报成功', icon: 'success' })
      showReportModal.value = false
      reportReason.value = ''
      reportDescription.value = ''
      selectedMsg.value = null
    } else {
      uni.showToast({ title: res.msg || '举报失败', icon: 'none' })
    }
  } catch (err) {
    console.error('举报失败:', err)
    const errorMsg = err.msg || err.message || '举报失败'
    uni.showToast({ title: errorMsg, icon: 'none' })
  }
}

const loadMessages = async () => {
  loading.value = true
  try {
    const res = await messageApi.getHistory(otherUserId.value)
    if (res.code === 200) {
      messages.value = res.data.messages || []
      isBlocking.value = res.data.is_blocking || false
      isDeleted.value = res.data.is_deleted || false
      
      // 如果已删除对话，不显示提示
      if (isDeleted.value) {
        showFirstMessageTip.value = false
      } else if (messages.value.length === 0) {
        // 没有消息，第一次聊天
        showFirstMessageTip.value = true
      } else {
        // 检查是否有对方的回复
        const hasReplyFromOther = messages.value.some(msg => 
          Number(msg.sender_id) === Number(otherUserId.value)
        )
        // 如果没有对方的回复，显示提示
        showFirstMessageTip.value = !hasReplyFromOther
      }
      
      await nextTick()
      scrollToBottom()
    }
  } catch (err) {
    console.error('加载消息失败:', err)
  } finally {
    loading.value = false
  }
}

const sendMsg = async () => {
  if (isBanned.value) {
    uni.showToast({ title: '你已被禁言，请联系管理员解决', icon: 'none' })
    return
  }
  if (isBlocking.value) {
    uni.showToast({ title: '你已屏蔽对方，无法发送消息', icon: 'none' })
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
      // 发送成功后，如果是新对话，显示提示
      if (messages.value.length === 1) {
        showFirstMessageTip.value = true
      }
    } else {
      uni.showToast({ title: res.msg || '发送失败', icon: 'none' })
    }
  } catch (err) {
    console.error('发送消息失败:', err)
    uni.showToast({ title: err.msg || '发送失败', icon: 'none' })
  } finally {
    sending.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (displayMessages.value.length > 0) {
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

  // 隐藏原生导航栏，使用自定义的
  uni.hideHomeButton()

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
  padding-top: var(--status-bar-height);
}

/* 自定义导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.nav-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-back-icon {
  font-size: 40rpx;
  color: #333;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 500;
  color: #333;
}

.nav-action {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-action-icon {
  font-size: 40rpx;
  color: #333;
  font-weight: bold;
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
}

.tip-bar {
  padding: 16rpx 24rpx;
  background: #fff9e6;
  border-bottom: 1rpx solid #ffd766;
  text-align: center;
}

.tip-bar-text {
  font-size: 28rpx;
  color: #8a6d3b;
}

.blocking-bar {
  padding: 16rpx 24rpx;
  background: #fff0f0;
  border-bottom: 1rpx solid #ffccc7;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.blocking-bar-text {
  font-size: 28rpx;
  color: #cf1322;
}

.blocking-bar-btn {
  font-size: 28rpx;
  color: #1890ff;
}

.blocked-input-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  background: #fff0f0;
  border-top: 1rpx solid #ffccc7;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.blocked-input-text {
  font-size: 28rpx;
  color: #cf1322;
}

/* 举报弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  width: 600rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 32rpx;
}

.reported-msg {
  background: #f5f5f5;
  padding: 24rpx;
  border-radius: 8rpx;
  margin-bottom: 32rpx;
}

.reported-msg-label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.reported-msg-text {
  font-size: 28rpx;
  color: #333;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.picker-value {
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #333;
}

.form-textarea {
  width: 100%;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  min-height: 160rpx;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #eee;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 28rpx;
  text-align: center;
  font-size: 28rpx;
  border: none;
  background: none;
}

.btn-cancel {
  color: #666;
  border-right: 1rpx solid #eee;
}

.btn-confirm {
  color: #1890ff;
  font-weight: bold;
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

.deleted-state {
  text-align: center;
  padding: 150rpx 0;
}

.deleted-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 20rpx;
}

.deleted-text {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 10rpx;
}

.deleted-hint {
  font-size: 26rpx;
  color: #999;
  display: block;
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

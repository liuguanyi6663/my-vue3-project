<template>
  <view class="page">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="nav-back-icon">←</text>
      </view>
      <view class="nav-title">
        <text class="nav-title-text">AI考研助手</text>
        <text class="nav-badge">AI</text>
      </view>
      <view class="nav-action" @click="showMenu">
        <text class="nav-action-icon">⋯</text>
      </view>
    </view>

    <scroll-view
      class="chat-scroll"
      scroll-y
      :scroll-into-view="scrollToId"
      scroll-with-animation
      @scrolltoupper="loadMoreHistory"
    >
      <view v-if="loadingHistory" class="loading-tip">
        <text class="loading-text">加载历史记录...</text>
      </view>

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
            :class="{ 'msg-self': msg.role === 'user' }"
          >
            <image
              v-if="msg.role === 'assistant'"
              class="msg-avatar msg-avatar-ai"
              :src="getImageUrl('/uploads/ai助手.png')"
              mode="aspectFill"
            />
            <image
              v-else
              class="msg-avatar"
              :src="getAvatarUrl(myAvatar)"
              mode="aspectFill"
            />

            <view class="msg-body">
              <view class="msg-nickname-row">
                <text class="msg-nickname">{{ msg.role === 'user' ? myNickname : 'AI考研助手' }}</text>
              </view>
              <view class="msg-bubble" v-if="msg.role === 'assistant'">
                <rich-text :nodes="renderMarkdown(msg.content)" class="msg-content-ai"></rich-text>
                <view v-if="msg.typing" class="typing-indicator">
                  <view class="typing-dot"></view>
                  <view class="typing-dot"></view>
                  <view class="typing-dot"></view>
                </view>
              </view>
              <view class="msg-bubble" v-else>
                <text class="msg-content">{{ msg.content }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!loading && messages.length === 0" class="empty-state">
        <view class="empty-icon">🤖</view>
        <text class="empty-title">你好，我是AI考研助手</text>
        <text class="empty-desc">我可以帮你解答考研相关的各种问题</text>
        <text class="empty-desc">选择下方快捷问题或直接输入你的问题吧~</text>
      </view>

      <view class="scroll-bottom-anchor" id="scroll-bottom"></view>
      <view class="input-bar-spacer"></view>
    </scroll-view>

    <view class="quick-section" v-if="quickQuestions.length > 0 && !showQuickPanel">
      <scroll-view class="quick-scroll" scroll-x>
        <view
          class="quick-tag"
          v-for="(q, idx) in quickQuestions"
          :key="idx"
          @click="sendQuick(q)"
        >
          <text class="quick-tag-text">{{ q.label }}</text>
        </view>
      </scroll-view>
    </view>

    <view class="input-bar">
      <input
        class="msg-input"
        v-model="inputText"
        placeholder="输入你的问题..."
        confirm-type="send"
        @confirm="sendMsg"
        :disabled="aiThinking"
      />
      <button class="send-btn" @click="sendMsg" :disabled="!inputText.trim() || aiThinking">
        {{ aiThinking ? '...' : '发送' }}
      </button>
    </view>

    <view v-if="showQuickPanel" class="quick-panel-overlay" @click="showQuickPanel = false">
      <view class="quick-panel" @click.stop>
        <view class="quick-panel-header">
          <text class="quick-panel-title">快捷问题</text>
          <text class="quick-panel-close" @click="showQuickPanel = false">×</text>
        </view>
        <view class="quick-panel-body">
          <view
            class="quick-card"
            v-for="(q, idx) in quickQuestions"
            :key="idx"
            @click="sendQuick(q)"
          >
            <text class="quick-card-icon">{{ q.icon }}</text>
            <view class="quick-card-info">
              <text class="quick-card-label">{{ q.label }}</text>
              <text class="quick-card-desc">{{ q.question }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { aiApi } from '@/api/index'
import { getAvatarUrl, getImageUrl } from '@/utils/url'
import { formatChatTime } from '@/utils/date'

const messages = ref([])
const inputText = ref('')
const aiThinking = ref(false)
const loading = ref(false)
const loadingHistory = ref(false)
const currentUserId = ref(0)
const myNickname = ref('考生')
const myAvatar = ref('')
const scrollToId = ref('')
const showQuickPanel = ref(false)
const historyLoaded = ref(false)

const quickQuestions = [
  { label: '复习规划', icon: '📝', question: '考研复习应该怎么规划？分几个阶段比较好？' },
  { label: '院校选择', icon: '🏫', question: '怎么选择适合自己的考研院校？' },
  { label: '国家线', icon: '📊', question: '国家线是什么？A区和B区有什么区别？' },
  { label: '复试准备', icon: '🎤', question: '考研复试一般有哪些环节？怎么准备？' },
  { label: '调剂信息', icon: '📋', question: '考研调剂是什么流程？需要注意什么？' },
  { label: '学习方法', icon: '💡', question: '有什么高效的考研学习方法推荐？' }
]

const goBack = () => {
  uni.navigateBack()
}

const showMenu = () => {
  uni.showActionSheet({
    itemList: ['清除聊天记录', '重新开始对话'],
    itemColor: '#333',
    success: (res) => {
      if (res.tapIndex === 0) {
        handleClearHistory()
      } else if (res.tapIndex === 1) {
        handleRestart()
      }
    }
  })
}

const handleClearHistory = () => {
  uni.showModal({
    title: '清除聊天记录',
    content: '确定要清除所有AI对话记录吗？',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        await aiApi.clearHistory()
        messages.value = []
        addWelcomeMessage()
        historyLoaded.value = true
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    }
  })
}

const handleRestart = () => {
  uni.showModal({
    title: '重新开始对话',
    content: '确定要重新开始对话吗？之前的对话历史将被清除。',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        await aiApi.clearHistory()
        messages.value = []
        addWelcomeMessage()
        historyLoaded.value = true
        uni.showToast({ title: '已重新开始', icon: 'success' })
      }
    }
  })
}

const shouldShowTime = (index) => {
  if (index === 0) return true
  const prev = new Date(messages.value[index - 1].created_at).getTime()
  const curr = new Date(messages.value[index].created_at).getTime()
  return curr - prev > 300000
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return formatChatTime(timeStr)
}

const renderMarkdown = (text) => {
  if (!text) return ''

  const escapeHtml = (str) => {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  let html = escapeHtml(text)

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`(.+?)`/g, '<code style="background:#f0f0f0;padding:2rpx 8rpx;border-radius:4rpx;font-family:monospace;">$1</code>')
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:30rpx;font-weight:bold;margin:16rpx 0 8rpx;color:#333;">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:32rpx;font-weight:bold;margin:20rpx 0 10rpx;color:#333;">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:34rpx;font-weight:bold;margin:24rpx 0 12rpx;color:#333;">$1</h1>')
  html = html.replace(/^- (.+)$/gm, '<li style="margin:4rpx 0;">$1</li>')
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li style="margin:4rpx 0;">$1. $2</li>')
  html = html.replace(/((?:<li[^>]*>.*<\/li>\s*)+)/g, '<ul style="padding-left:16rpx;margin:8rpx 0;">$1</ul>')

  html = html.replace(/\n\n/g, '<br/><br/>')
  html = html.replace(/\n/g, '<br/>')

  return html
}

const sendQuick = (q) => {
  showQuickPanel.value = false
  inputText.value = q.question
  sendMsg()
}

const WELCOME_MSG = `你好呀！👋 我是你的**AI考研助手**，很高兴为你服务！\n\n我可以帮你解答：\n📚 考研复习规划\n🏫 院校选择建议\n📊 国家线/分数线解读\n🎤 复试准备指导\n📝 调剂相关信息\n💡 学习方法与心态调整\n\n直接告诉我你想了解什么，或者点击下方的快捷问题，我会尽力帮你！😊`

const addWelcomeMessage = () => {
  messages.value.push({
    role: 'assistant',
    content: WELCOME_MSG,
    created_at: new Date().toISOString()
  })
}

const loadHistory = async () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    addWelcomeMessage()
    loading.value = false
    return
  }

  loading.value = true
  try {
    const res = await aiApi.getHistory()
    if (res.code === 200) {
      const history = res.data.messages || []
      messages.value = history.map(msg => ({
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at || new Date().toISOString()
      }))
      historyLoaded.value = true

      if (messages.value.length === 0) {
        addWelcomeMessage()
      }

      await nextTick()
      scrollToBottom()
    }
  } catch (err) {
    console.error('加载历史失败:', err)
    if (messages.value.length === 0) {
      addWelcomeMessage()
    }
  } finally {
    loading.value = false
  }
}

const loadMoreHistory = () => {
  // place holder
}

const sendMsg = async () => {
  if (!inputText.value.trim() || aiThinking.value) return

  const userMsg = {
    role: 'user',
    content: inputText.value.trim(),
    created_at: new Date().toISOString()
  }

  messages.value.push(userMsg)
  inputText.value = ''
  aiThinking.value = true

  scrollToBottom()

  const aiMsg = {
    role: 'assistant',
    content: '',
    typing: true,
    created_at: new Date().toISOString()
  }
  messages.value.push(aiMsg)

  try {
    const recentMessages = messages.value
      .filter(m => !m.typing)
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))

    const res = await aiApi.chat({ messages: recentMessages })

    if (res.code === 200) {
      aiMsg.content = res.data.content
      aiMsg.typing = false
    } else {
      aiMsg.content = '抱歉，AI服务暂时不可用，请稍后再试。'
      aiMsg.typing = false
    }
  } catch (err) {
    aiMsg.content = '网络连接失败，请检查网络后重试。'
    aiMsg.typing = false
    console.error('AI请求失败:', err)
  } finally {
    aiThinking.value = false
    await nextTick()
    scrollToBottom()
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

onMounted(() => {
  try {
    const raw = uni.getStorageSync('userInfo')
    let info = raw
    if (typeof raw === 'string') {
      info = JSON.parse(raw)
    }
    if (info && typeof info === 'object') {
      currentUserId.value = Number(info.id) || 0
      myNickname.value = info.nickname || '考生'
      myAvatar.value = info.avatar || ''
    }
  } catch (e) {
    console.error('获取用户信息失败:', e)
  }

  loadHistory()
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

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #fff;
}

.nav-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nav-title-text {
  font-size: 34rpx;
  font-weight: 500;
  color: #fff;
}

.nav-badge {
  font-size: 20rpx;
  color: #667eea;
  background: #fff;
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
  font-weight: bold;
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
  color: #fff;
  font-weight: bold;
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
}

.loading-tip {
  text-align: center;
  padding: 20rpx;
}

.loading-text {
  font-size: 24rpx;
  color: #999;
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

.msg-avatar-ai {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
}

.msg-body {
  max-width: 560rpx;
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
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.msg-self .msg-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.msg-content {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
}

.msg-self .msg-content {
  color: #fff;
}

.msg-content-ai {
  font-size: 28rpx;
  color: #333;
  line-height: 1.7;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f0f0f0;
}

.typing-dot {
  width: 12rpx;
  height: 12rpx;
  background: #ccc;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0.5);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx 0;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.empty-title {
  font-size: 36rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #999;
  line-height: 1.6;
}

.scroll-bottom-anchor {
  height: 1rpx;
}

.input-bar-spacer {
  height: calc(140rpx + env(safe-area-inset-bottom));
}

.quick-section {
  padding: 16rpx 0;
  background: #fff;
  border-top: 1rpx solid #eee;
}

.quick-scroll {
  white-space: nowrap;
  padding: 0 24rpx;
}

.quick-tag {
  display: inline-block;
  padding: 12rpx 24rpx;
  margin-right: 16rpx;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 32rpx;
  border: 1rpx solid rgba(102, 126, 234, 0.3);
}

.quick-tag-text {
  font-size: 26rpx;
  color: #667eea;
  white-space: nowrap;
}

.quick-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.quick-panel {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.quick-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 24rpx;
}

.quick-panel-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.quick-panel-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
  padding: 0 8rpx;
}

.quick-panel-body {
  padding: 0 24rpx;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 20rpx;
  margin-bottom: 16rpx;
  background: #f8f9fb;
  border-radius: 12rpx;
  border: 1rpx solid #eee;
}

.quick-card-icon {
  font-size: 44rpx;
}

.quick-card-info {
  flex: 1;
}

.quick-card-label {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
}

.quick-card-desc {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
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
  border-radius: 36rpx;
  padding: 0 28rpx;
  font-size: 30rpx;
  border: 1rpx solid #e0e0e0;
}

.send-btn {
  margin-left: 16rpx;
  width: 120rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 28rpx;
  border-radius: 36rpx;
  border: none;
  padding: 0;
}

.send-btn[disabled] {
  opacity: 0.5;
}
</style>

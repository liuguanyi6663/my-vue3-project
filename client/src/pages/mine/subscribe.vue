<template>
  <view class="page">
    <view class="header">
      <text class="title">微信订阅消息</text>
      <text class="desc">订阅后可接收重要通知和消息提醒</text>
    </view>

    <view class="content">
      <!-- 已有的订阅列表 -->
      <view v-if="userSubscriptions.length > 0" class="card">
        <view class="section-title">
          <text>当前订阅</text>
        </view>
        <view class="subscription-list">
          <view 
            v-for="sub in userSubscriptions" 
            :key="sub.id"
            class="subscription-item"
          >
            <view class="sub-info">
              <text class="sub-type">{{ getSceneLabel(sub.scene) }}</text>
              <text class="sub-time">订阅于: {{ formatDate(sub.created_at) }}</text>
            </view>
            <button 
              class="cancel-btn" 
              size="mini" 
              type="warn"
              @click="cancelSubscription(sub.template_id)"
            >取消订阅</button>
          </view>
        </view>
      </view>

      <!-- 通知提醒订阅 -->
      <view class="subscribe-item card">
        <view class="item-header">
          <view class="item-icon">📢</view>
          <view class="item-info">
            <text class="item-title">通知提醒</text>
            <text class="item-desc">接收管理员发布的通知和公告</text>
          </view>
          <switch
            :checked="subscriptions.notification"
            @change="toggleNotification"
            color="#4CAF50"
            :disabled="!TEMPLATE_IDS.notification"
          />
        </view>
        <view v-if="!TEMPLATE_IDS.notification" class="config-hint">
          <text>⚠️ 请先在代码中配置模板ID</text>
        </view>
      </view>

      <!-- 消息提醒订阅 -->
      <view class="subscribe-item card">
        <view class="item-header">
          <view class="item-icon">💬</view>
          <view class="item-info">
            <text class="item-title">消息提醒</text>
            <text class="item-desc">接收新的私聊消息提醒</text>
          </view>
          <switch
            :checked="subscriptions.message"
            @change="toggleMessage"
            color="#4CAF50"
            :disabled="!TEMPLATE_IDS.message"
          />
        </view>
        <view v-if="!TEMPLATE_IDS.message" class="config-hint">
          <text>⚠️ 请先在代码中配置模板ID</text>
        </view>
      </view>

      <!-- 提示信息 -->
      <view class="tips-section">
        <text class="tips-title">📌 提示</text>
        <view class="tips-list">
          <text class="tips-item">• 订阅消息需要在微信小程序后台配置模板ID</text>
          <text class="tips-item">• 每次请求订阅只能获取一个模板的授权</text>
          <text class="tips-item">• 如果用户拒绝订阅，需要用户主动再次触发</text>
          <text class="tips-item">• 取消订阅后将不再接收相关消息提醒</text>
        </view>
      </view>
    </view>

    <view style="height: 80rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { messageApi } from '@/api/index'

const loading = ref(false)
const subscriptions = ref({
  notification: false,
  message: false
})
const userSubscriptions = ref([])

// 订阅消息模板ID（需要在微信小程序后台配置后替换）
const TEMPLATE_IDS = {
  notification: '', // 通知提醒模板ID
  message: ''       // 消息提醒模板ID
}

const loadSubscriptions = async () => {
  try {
    const res = await messageApi.getSubscriptions()
    if (res.code === 200) {
      const list = res.data || []
      userSubscriptions.value = list
      
      // 如果有配置模板ID，根据模板ID匹配
      if (TEMPLATE_IDS.notification) {
        subscriptions.value.notification = list.some(
          s => s.template_id === TEMPLATE_IDS.notification
        )
      }
      
      if (TEMPLATE_IDS.message) {
        subscriptions.value.message = list.some(
          s => s.template_id === TEMPLATE_IDS.message
        )
      }
    }
  } catch (e) {
    console.error('加载订阅状态失败:', e)
  }
}

const requestSubscribe = async (templateId, scene) => {
  if (!templateId) {
    uni.showToast({
      title: '请先配置模板ID',
      icon: 'none'
    })
    return false
  }

  return new Promise((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds: [templateId],
      success: async (res) => {
        if (res[templateId] === 'accept') {
          try {
            await messageApi.subscribe(templateId, scene)
            uni.showToast({
              title: '订阅成功',
              icon: 'success'
            })
            resolve(true)
          } catch (e) {
            console.error('保存订阅失败:', e)
            resolve(false)
          }
        } else {
          uni.showToast({
            title: '订阅被拒绝',
            icon: 'none'
          })
          resolve(false)
        }
      },
      fail: (err) => {
        console.error('请求订阅失败:', err)
        uni.showToast({
          title: '订阅失败',
          icon: 'none'
        })
        resolve(false)
      }
    })
  })
}

const getTemplateIdByKey = (key) => {
  if (TEMPLATE_IDS[key]) {
    return TEMPLATE_IDS[key]
  }
  // 如果没有配置模板ID，从用户订阅列表中找第一个对应的
  const subscription = userSubscriptions.value.find(s => s.scene === key)
  return subscription ? subscription.template_id : null
}

const toggleNotification = async (e) => {
  const templateId = getTemplateIdByKey('notification')
  
  if (e.detail.value) {
    if (!templateId) {
      uni.showToast({
        title: '请先配置模板ID',
        icon: 'none'
      })
      // 恢复开关状态
      subscriptions.value.notification = false
      return
    }
    
    const success = await requestSubscribe(templateId, 'notification')
    if (success) {
      subscriptions.value.notification = true
      await loadSubscriptions() // 重新加载订阅列表
    }
  } else {
    if (!templateId) {
      // 没有找到模板ID，直接关闭开关
      subscriptions.value.notification = false
      return
    }
    
    try {
      await messageApi.unsubscribe(templateId)
      subscriptions.value.notification = false
      await loadSubscriptions() // 重新加载订阅列表
      uni.showToast({
        title: '已取消订阅',
        icon: 'success'
      })
    } catch (e) {
      console.error('取消订阅失败:', e)
      // 恢复开关状态
      subscriptions.value.notification = true
    }
  }
}

const toggleMessage = async (e) => {
  const templateId = getTemplateIdByKey('message')
  
  if (e.detail.value) {
    if (!templateId) {
      uni.showToast({
        title: '请先配置模板ID',
        icon: 'none'
      })
      // 恢复开关状态
      subscriptions.value.message = false
      return
    }
    
    const success = await requestSubscribe(templateId, 'message')
    if (success) {
      subscriptions.value.message = true
      await loadSubscriptions() // 重新加载订阅列表
    }
  } else {
    if (!templateId) {
      // 没有找到模板ID，直接关闭开关
      subscriptions.value.message = false
      return
    }
    
    try {
      await messageApi.unsubscribe(templateId)
      subscriptions.value.message = false
      await loadSubscriptions() // 重新加载订阅列表
      uni.showToast({
        title: '已取消订阅',
        icon: 'success'
      })
    } catch (e) {
      console.error('取消订阅失败:', e)
      // 恢复开关状态
      subscriptions.value.message = true
    }
  }
}

const cancelSubscription = async (templateId) => {
  if (!templateId) {
    uni.showToast({
      title: '无效的模板ID',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '确认取消订阅',
    content: '确定要取消此订阅吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await messageApi.unsubscribe(templateId)
          uni.showToast({
            title: '已取消订阅',
            icon: 'success'
          })
          await loadSubscriptions() // 重新加载订阅列表
        } catch (e) {
          console.error('取消订阅失败:', e)
          uni.showToast({
            title: '取消订阅失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

const getSceneLabel = (scene) => {
  const labels = {
    'notification': '通知提醒',
    'message': '消息提醒',
    'default': '其他订阅'
  }
  return labels[scene] || scene
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  loadSubscriptions()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  padding: 60rpx 30rpx 40rpx;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8rpx;
}

.desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255,255,255,0.85);
}

.content {
  padding: 20rpx;
  margin-top: -30rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.subscription-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.subscription-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
}

.sub-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sub-type {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 6rpx;
}

.sub-time {
  font-size: 22rpx;
  color: #999;
}

.cancel-btn {
  margin: 0;
  font-size: 24rpx;
}

.subscribe-item {
  margin-bottom: 20rpx;
}

.item-header {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
}

.item-icon {
  font-size: 44rpx;
  margin-right: 20rpx;
  width: 60rpx;
  text-align: center;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 6rpx;
}

.item-desc {
  font-size: 24rpx;
  color: #999;
}

.config-hint {
  padding: 12rpx;
  background: #fff3cd;
  border-radius: 8rpx;
  margin-top: 12rpx;
}

.config-hint text {
  font-size: 22rpx;
  color: #856404;
}

.tips-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-top: 20rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tips-item {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  margin-bottom: 20rpx;
}
</style>

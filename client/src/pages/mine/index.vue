<template>
  <view class="page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-bg"></view>
      <view class="user-info">
        <image class="avatar" :src="getAvatarUrl(userInfo?.avatar)" mode="aspectFill" @click="goLoginOrProfile" />
        <view class="info-content" v-if="userInfo" @click="goPage('/pages/mine/profile')">
          <text class="nickname">{{ userInfo.nickname }}</text>
          <text class="user-desc" v-if="userInfo.college">{{ userInfo.college }} · {{ userInfo.major }}</text>
          <text class="student-id" v-if="userInfo.student_id">学号：{{ userInfo.student_id }}</text>
        </view>
        <view class="info-content" v-else @click="goLogin">
          <text class="nickname">点击登录</text>
          <text class="user-desc">登录后享受更多功能</text>
        </view>
      </view>

      <!-- 统计数据 -->
      <view class="stats-row">
        <view class="stat-item" @click="goPage('/pages/mine/checkin')">
          <text class="stat-num">{{ stats.totalDays || 0 }}</text>
          <text class="stat-label">打卡天数</text>
        </view>
        <view class="stat-item" @click="goPage('/pages/mine/favorites')">
          <text class="stat-num">{{ favoriteCount }}</text>
          <text class="stat-label">收藏</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ stats.currentStreak || 0 }}</text>
          <text class="stat-label">连续打卡</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section card">
      <view class="menu-group">
        <text class="group-title">学习</text>
        
        <view class="menu-item" @click="goPage('/pages/study/plan')">
          <text class="menu-icon">📋</text>
          <text class="menu-label">今日计划</text>
          <text class="menu-arrow">></text>
        </view>
        
        <view class="menu-item" @click="goPage('/pages/mine/checkin')">
          <text class="menu-icon">✅</text>
          <text class="menu-label">学习打卡</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <text class="group-title">内容</text>
        
        <view class="menu-item" @click="goPage('/pages/mine/favorites')">
          <text class="menu-icon">⭐</text>
          <text class="menu-label">我的收藏</text>
          <text class="menu-arrow">></text>
        </view>
        
        <view class="menu-item" @click="goPage('/pages/mine/uploads')">
          <text class="menu-icon">📤</text>
          <text class="menu-label">我的上传</text>
          <text class="menu-arrow">></text>
        </view>
        
        <view class="menu-item" @click="goPage('/pages/mine/my-posts')">
          <text class="menu-icon">💬</text>
          <text class="menu-label">我的帖子</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <text class="group-title">工具</text>
        
        <view class="menu-item" @click="goPage('/pages/data/dashboard')">
          <text class="menu-icon">📊</text>
          <text class="menu-label">考研数据</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @click="goPage('/pages/mine/my-kaoyan')">
          <text class="menu-icon">📝</text>
          <text class="menu-label">我的考研信息</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @click="goPage('/pages/tools/interview')">
          <text class="menu-icon">🎤</text>
          <text class="menu-label">复试工具箱</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <text class="group-title">设置</text>
        
        <view class="menu-item" @click="goPage('/pages/mine/profile')">
          <text class="menu-icon">👤</text>
          <text class="menu-label">个人信息</text>
          <text class="menu-arrow">></text>
        </view>
        
        <view class="menu-item" @click="goPage('/pages/push-notifications/index')">
          <text class="menu-icon">🔔</text>
          <text class="menu-label">消息通知</text>
          <view class="msg-badge" v-if="pushUnreadCount > 0">
            <text class="badge-text">{{ pushUnreadCount > 99 ? '99+' : pushUnreadCount }}</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
        
        <view class="menu-item" @click="goPage('/pages/mine/messages')">
          <text class="menu-icon">💬</text>
          <text class="menu-label">我的消息</text>
          <view class="msg-badge" v-if="unreadCount > 0">
            <text class="badge-text">{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
        
        <view class="menu-item" @click="goFeedback">
          <text class="menu-icon">💭</text>
          <text class="menu-label">意见反馈</text>
          <text class="menu-arrow">></text>
        </view>
        
        <view class="menu-item" v-if="userInfo && (userInfo.role === 'admin' || userInfo.role === 'super_admin')" @click="goPage('/pages/admin/index')">
          <text class="menu-icon">🛠️</text>
          <text class="menu-label" style="color: #4CAF50;">管理后台</text>
          <text class="menu-arrow">></text>
        </view>
        
        <view class="menu-item" v-if="userInfo" @click="logout">
          <text class="menu-icon">🚪</text>
          <text class="menu-label logout-text">退出登录</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 版本信息 -->
    <view class="version-info">
      <text>校内考研助手 v1.0.0</text>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userApi, studyApi, materialApi, messageApi, forumApi, notificationApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'

const userInfo = ref(null)
const stats = ref({})
const favoriteCount = ref(0)
const showSettings = ref(false)
const unreadCount = ref(0)
const pushUnreadCount = ref(0)

const loadUserInfo = async () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    userInfo.value = null
    return
  }
  
  try {
    const res = await userApi.getInfo()
    userInfo.value = res.data
  } catch (e) {
    console.error('加载用户信息失败:', e)
  }
}

const loadStats = async () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    stats.value = {}
    favoriteCount.value = 0
    return
  }
  
  try {
    const [checkinRes, materialFavRes, postFavRes] = await Promise.allSettled([
      studyApi.getCheckins(),
      materialApi.getFavorites({ page: 1, pageSize: 1 }),
      forumApi.getFavorites({ page: 1, pageSize: 1 })
    ])
    
    if (checkinRes.status === 'fulfilled') {
      stats.value = checkinRes.value?.data?.stats || {}
    }
    
    let materialCount = 0
    let postCount = 0
    
    if (materialFavRes.status === 'fulfilled') {
      materialCount = materialFavRes.value?.data?.total || 0
    }
    
    if (postFavRes.status === 'fulfilled') {
      postCount = postFavRes.value?.data?.total || 0
    }
    
    favoriteCount.value = materialCount + postCount
  } catch (e) {
    console.error('加载统计数据失败:', e)
  }
}

const goPage = (url) => {
  if (!userInfo.value && url !== '/pages/login/login') {
    return uni.navigateTo({ url: '/pages/login/login' })
  }
  
  if (url.includes('tabbar')) {
    uni.switchTab({ url })
  } else {
    uni.navigateTo({ url })
  }
}

const goLogin = () => {
  if (!userInfo.value) {
    uni.navigateTo({ url: '/pages/login/login' })
  }
}

const goLoginOrProfile = () => {
  if (!userInfo.value) {
    uni.navigateTo({ url: '/pages/login/login' })
  } else {
    uni.navigateTo({ url: '/pages/mine/profile' })
  }
}

const goFeedback = () => {
  if (!userInfo.value) {
    return uni.navigateTo({ url: '/pages/login/login' })
  }
  uni.navigateTo({ url: '/pages/mine/feedback' })
}

const logout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
        userInfo.value = null
        stats.value = {}
        favoriteCount.value = 0
        uni.showToast({ title: '已退出登录', icon: 'success' })
      }
    }
  })
}

const loadUnreadCount = async () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    unreadCount.value = 0
    return
  }
  try {
    const res = await messageApi.getUnreadCount()
    if (res.code === 200) {
      unreadCount.value = res.data.count || 0
    }
  } catch (e) {
    console.error('加载未读消息数失败:', e)
  }
}

const loadPushUnreadCount = async () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    pushUnreadCount.value = 0
    return
  }
  try {
    const res = await notificationApi.getUnreadCount()
    if (res.code === 200) {
      pushUnreadCount.value = res.data.count || 0
    }
  } catch (e) {
    console.error('加载推送未读数失败:', e)
  }
}

onShow(() => {
  loadUserInfo()
  loadStats()
  loadUnreadCount()
  loadPushUnreadCount()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.user-card {
  position: relative;
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  padding-bottom: 30rpx;
}

.user-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200rpx;
  opacity: 0.3;
  background: radial-gradient(circle at 70% 50%, rgba(255,255,255,0.3), transparent);
}

.user-info {
  position: relative;
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx 20rpx;
}

.avatar {
  width: 130rpx;
  height: 130rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.8);
  margin-right: 24rpx;
}

.info-content {
  flex: 1;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.user-desc {
  font-size: 26rpx;
  color: rgba(255,255,255,0.85);
  display: block;
  margin-bottom: 4rpx;
}

.student-id {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
}

.stats-row {
  display: flex;
  justify-content: space-around;
  padding: 24rpx 0;
  margin-top: 10rpx;
  background: rgba(255,255,255,0.15);
  border-radius: 16rpx;
  margin: 0 30rpx;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: rgba(255,255,255,0.8);
  margin-top: 6rpx;
  display: block;
}

.menu-section {
  margin: -30rpx 24rpx 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-group {
  padding: 10rpx 0;
}

.menu-group:not(:last-child) {
  border-bottom: 1rpx solid #f0f0f0;
}

.group-title {
  font-size: 26rpx;
  color: #999;
  padding: 16rpx 30rpx 10rpx;
  display: block;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  transition: background 0.2s;
}

.menu-item:active {
  background: #f9f9f9;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  width: 44rpx;
  text-align: center;
}

.menu-label {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.msg-badge {
  background: #ff3b30;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  margin-right: 12rpx;
}

.badge-text {
  font-size: 20rpx;
  color: #fff;
}

.logout-text {
  color: #ff3b30 !important;
}

.menu-arrow {
  font-size: 28rpx;
  color: #ccc;
}

.version-info {
  text-align: center;
  padding: 40rpx 0;
  color: #bbb;
  font-size: 24rpx;
}
</style>

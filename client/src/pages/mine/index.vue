<template>
  <view class="page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-bg"></view>
      <view class="user-info">
        <image class="avatar" :src="getAvatarUrl(userInfo?.avatar)" mode="aspectFill" @click="goLoginOrProfile" />
        <view class="info-content" v-if="userInfo" @click="goPage('/pages/mine/profile')">
          <view class="nickname-row">
            <text class="nickname">{{ userInfo.nickname }}</text>
            <text class="landed-badge" v-if="userInfo.is_landed === 1">已上岸</text>
          </view>
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

        <view class="menu-item" @click="goPage('/pages/tools/interview')">
          <text class="menu-icon">🎤</text>
          <text class="menu-label">复试工具箱</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <text class="group-title">认证</text>

        <view class="menu-item" @click="goPage('/pages/mine/title-cert')">
          <text class="menu-icon">🏅</text>
          <text class="menu-label">头衔认证</text>
          <text class="landed-tag" v-if="userInfo && userInfo.is_landed === 1">已认证</text>
          <text class="pending-tag" v-else-if="hasPendingCert">审核中</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <text class="group-title">设置</text>
        
        <view class="menu-item" @click="goPage('/pages/mine/messages')">
          <text class="menu-icon">💬</text>
          <text class="menu-label">我的消息</text>
          <view class="msg-badge" v-if="unreadCount > 0">
            <text class="badge-text">{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
          </view>
          <text class="menu-arrow">></text>
        </view>
        
        <view class="menu-item" v-if="userInfo && (userInfo.role === 'admin' || userInfo.role === 'super_admin')" @click="goPage('/pages/admin/index')">
          <text class="menu-icon">🛠️</text>
          <text class="menu-label" style="color: #4CAF50;">管理后台</text>
          <text class="menu-arrow">></text>
        </view>
        
        <view class="menu-item" @click="toggleSettingsMenu">
          <text class="menu-icon settings-icon">⚙️</text>
          <text class="menu-label">设置</text>
          <text class="menu-arrow">></text>
        </view>
        
        <!-- 展开的设置子菜单 -->
        <view class="settings-submenu" v-if="showSettingsMenu">
          <view class="submenu-item" @click="goPage('/pages/mine/profile')">
            <text class="submenu-icon">👤</text>
            <text class="submenu-label">个人信息</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="submenu-item" @click="goPage('/pages/mine/my-kaoyan')">
            <text class="submenu-icon">📝</text>
            <text class="submenu-label">我的考研信息</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="submenu-item" @click="goFeedback">
            <text class="submenu-icon">💭</text>
            <text class="submenu-label">意见反馈</text>
            <text class="menu-arrow">></text>
          </view>
          <!-- 订阅消息设置 -->
          <view class="submenu-item" @click="goSubscribe">
            <text class="submenu-icon">📢</text>
            <text class="submenu-label">微信订阅消息</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="submenu-item delete-account" v-if="userInfo" @click="deleteAccount">
            <text class="submenu-icon delete-icon">🗑️</text>
            <view class="delete-label-wrapper">
              <text class="submenu-label delete-label">注销账号</text>
              <text v-if="deleteStatus.is_deleting" class="delete-status">注销中 {{ deleteStatus.days_left }} 天后</text>
            </view>
            <text class="menu-arrow">></text>
          </view>
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
import { userApi, studyApi, materialApi, messageApi, forumApi, titleCertApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'

const userInfo = ref(null)
const stats = ref({})
const favoriteCount = ref(0)
const showSettingsMenu = ref(false)
const deleteStatus = ref({ is_deleting: false, days_left: 0 })
const unreadCount = ref(0)
const hasPendingCert = ref(false)

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

const goSubscribe = () => {
  if (!userInfo.value) {
    return uni.navigateTo({ url: '/pages/login/login' })
  }
  uni.navigateTo({ url: '/pages/mine/subscribe' })
}

const toggleSettingsMenu = () => {
  showSettingsMenu.value = !showSettingsMenu.value
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

const loadDeleteStatus = async () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    deleteStatus.value = { is_deleting: false, days_left: 0 }
    return
  }
  
  try {
    const res = await userApi.getDeleteStatus()
    if (res.code === 200) {
      deleteStatus.value = res.data
    }
  } catch (err) {
    console.error('获取注销状态失败:', err)
  }
}

const deleteAccount = () => {
  // 如果已经在注销中，询问是否取消
  if (deleteStatus.is_deleting) {
    uni.showModal({
      title: '提示',
      content: `您的账号已在注销冷静期中，还有 ${deleteStatus.days_left} 天自动注销。是否取消注销？`,
      confirmText: '取消注销',
      confirmColor: '#07c160',
      cancelText: '继续注销',
      success: async (res) => {
        if (res.confirm) {
          try {
            await userApi.cancelDeleteAccount()
            uni.showToast({ 
              title: '注销申请已取消', 
              icon: 'success' 
            })
            await loadDeleteStatus()
          } catch (err) {
            console.error('取消注销失败:', err)
          }
        }
      }
    })
    return
  }
  
  uni.showModal({
    title: '警告',
    content: '确定要注销账号吗？注销后将有3天冷静期，冷静期内重新登录可恢复账号。冷静期后账号及所有数据将被永久删除。',
    confirmText: '确认注销',
    confirmColor: '#ff3b30',
    success: async (res) => {
      if (res.confirm) {
        try {
          const resp = await userApi.deleteAccountRequest()
          if (resp.code === 200) {
            uni.showModal({
              title: '提示',
              content: resp.msg,
              showCancel: false,
              success: async () => {
                await loadDeleteStatus()
              }
            })
          }
        } catch (err) {
          console.error('提交注销申请失败:', err)
          uni.showToast({ 
            title: '提交注销申请失败', 
            icon: 'none' 
          })
        }
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

const loadCertStatus = async () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    hasPendingCert.value = false
    return
  }
  try {
    const res = await titleCertApi.getStatus()
    if (res.code === 200) {
      hasPendingCert.value = res.data.has_pending
    }
  } catch (e) {
    console.error('加载认证状态失败:', e)
  }
}

onShow(() => {
  loadUserInfo()
  loadStats()
  loadUnreadCount()
  loadCertStatus()
  loadDeleteStatus()
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
  display: inline;
  margin-bottom: 8rpx;
}

.nickname-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.landed-badge {
  display: inline-block;
  font-size: 20rpx;
  color: #fff;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  padding: 2rpx 12rpx;
  border-radius: 10rpx;
  margin-left: 12rpx;
  font-weight: bold;
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

.settings-icon {
  color: #999;
  filter: grayscale(100%);
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

.landed-tag {
  font-size: 22rpx;
  color: #4CAF50;
  background: #e8f5e9;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
  margin-right: 12rpx;
}

.pending-tag {
  font-size: 22rpx;
  color: #FF9500;
  background: #fff3e0;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
  margin-right: 12rpx;
}

.menu-arrow {
  font-size: 28rpx;
  color: #ccc;
}

.settings-submenu {
  background: #fafafa;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}

.submenu-item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx 24rpx 74rpx;
  transition: background 0.2s;
}

.submenu-item:active {
  background: #f0f0f0;
}

.submenu-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
  width: 44rpx;
  text-align: center;
}

.submenu-label {
  flex: 1;
  font-size: 28rpx;
  color: #555;
}

.delete-account .delete-icon {
  filter: hue-rotate(180deg) saturate(1.5);
}

.delete-label-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.delete-account .delete-label {
  color: #ff3b30;
}

.delete-status {
  font-size: 22rpx;
  color: #ff9500;
  margin-top: 4rpx;
}

.version-info {
  text-align: center;
  padding: 40rpx 0;
  color: #bbb;
  font-size: 24rpx;
}
</style>

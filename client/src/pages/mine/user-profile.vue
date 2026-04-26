<template>
  <view class="page" v-if="userInfo">
    <view class="profile-header">
      <image class="profile-avatar" :src="getAvatarUrl(userInfo.avatar)" mode="aspectFill" />
      <text class="profile-nickname">{{ userInfo.nickname }}</text>
      <text class="profile-desc" v-if="userInfo.college">{{ userInfo.college }} · {{ userInfo.major }}</text>
      <text class="profile-desc" v-if="userInfo.target_school">目标：{{ userInfo.target_school }} · {{ userInfo.target_major }}</text>
      <text class="profile-desc" v-if="userInfo.exam_year">{{ userInfo.exam_year }}年考研</text>
    </view>

    <view class="info-section">
      <view class="section-header">
        <text class="section-title">基本信息</text>
      </view>
      <view class="info-card">
        <view class="info-item" v-if="userInfo.college">
          <text class="info-label">院校</text>
          <text class="info-value">{{ userInfo.college }}</text>
        </view>
        <view class="info-item" v-if="userInfo.major">
          <text class="info-label">专业</text>
          <text class="info-value">{{ userInfo.major }}</text>
        </view>
      </view>
    </view>

    <view class="info-section" v-if="userInfo.target_school || userInfo.target_major || userInfo.exam_year">
      <view class="section-header">
        <text class="section-title">考研信息</text>
      </view>
      <view class="info-card">
        <view class="info-item" v-if="userInfo.target_school">
          <text class="info-label">目标院校</text>
          <text class="info-value">{{ userInfo.target_school }}</text>
        </view>
        <view class="info-item" v-if="userInfo.target_major">
          <text class="info-label">目标专业</text>
          <text class="info-value">{{ userInfo.target_major }}</text>
        </view>
        <view class="info-item" v-if="userInfo.exam_year">
          <text class="info-label">考研年份</text>
          <text class="info-value">{{ userInfo.exam_year }}年</text>
        </view>
      </view>
    </view>

    <view class="btn-section">
      <button class="msg-btn" @click="sendMessage">发信息</button>
    </view>
  </view>

  <view v-else class="loading-page"><text>加载中...</text></view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'

const userInfo = ref(null)
const userId = ref('')

const loadUserInfo = async () => {
  try {
    const res = await userApi.getPublicInfo(userId.value)
    if (res.code === 200) {
      userInfo.value = res.data
    }
  } catch (e) {
    console.error('加载用户信息失败:', e)
    uni.showToast({ title: '用户信息加载失败', icon: 'none' })
  }
}

const sendMessage = () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 1000)
    return
  }
  uni.navigateTo({ url: `/pages/mine/chat?userId=${userId.value}&nickname=${encodeURIComponent(userInfo.value.nickname)}` })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  userId.value = currentPage.options?.userId || ''
  if (userId.value) {
    loadUserInfo()
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.profile-header {
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 30rpx 50rpx;
}

.profile-avatar {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.9);
}

.profile-nickname {
  font-size: 38rpx;
  font-weight: bold;
  color: #fff;
  margin-top: 20rpx;
}

.profile-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8rpx;
}

.info-section {
  margin-top: 24rpx;
}

.section-header {
  padding: 20rpx 30rpx 10rpx;
}

.section-title {
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
}

.info-card {
  background: #fff;
  padding: 0 30rpx;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 30rpx;
  color: #333;
  flex-shrink: 0;
  width: 160rpx;
}

.info-value {
  font-size: 30rpx;
  color: #666;
  text-align: right;
  flex: 1;
}

.btn-section {
  padding: 60rpx 30rpx;
}

.msg-btn {
  width: 100%;
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  color: white;
  font-size: 32rpx;
  border-radius: 50rpx;
  padding: 24rpx 0;
  border: none;
  letter-spacing: 4rpx;
}

.loading-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
}
</style>

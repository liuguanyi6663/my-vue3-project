<template>
  <view class="admin-page">
    <view class="admin-header">
      <text class="admin-title">管理后台</text>
      <text class="admin-desc">仅限管理员操作</text>
    </view>

    <view class="admin-menu card">
      <view class="menu-group">
        <text class="group-title">内容管理</text>
        
        <view class="menu-item" @click="goPage('/pages/admin/reports')">
          <text class="menu-icon">🚫</text>
          <text class="menu-label">举报受理</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @click="goPage('/pages/admin/kaoyan-audit')">
          <text class="menu-icon">📝</text>
          <text class="menu-label">考研信息审批</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @click="goPage('/pages/admin/kaoyan-export')">
          <text class="menu-icon">📊</text>
          <text class="menu-label">考研数据导出</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @click="goPage('/pages/admin/notice')">
          <text class="menu-icon">📢</text>
          <text class="menu-label">信息发布</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @click="goPage('/pages/admin/screen')">
          <text class="menu-icon">🖥️</text>
          <text class="menu-label">大屏管理</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @click="goPage('/pages/admin/national-line')">
          <text class="menu-icon">📈</text>
          <text class="menu-label">国家线数据修改</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @click="goPage('/pages/admin/interview-audit')">
          <text class="menu-icon">📋</text>
          <text class="menu-label">复试资料审批</text>
          <text class="menu-arrow">></text>
        </view>

        <view class="menu-item" @click="goPage('/pages/admin/feedback')">
          <text class="menu-icon">💭</text>
          <text class="menu-label">意见反应栏</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <text class="group-title">用户管理</text>
        
        <view class="menu-item" @click="goPage('/pages/admin/users')">
          <text class="menu-icon">👥</text>
          <text class="menu-label">用户列表</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const userInfo = ref(null)

const loadUserInfo = () => {
  const user = uni.getStorageSync('userInfo')
  userInfo.value = user
  
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    uni.showToast({ 
      title: '权限不足', 
      icon: 'none' 
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
}

const goPage = (url) => {
  uni.navigateTo({ url })
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  padding: 100rpx 40rpx 60rpx;
  text-align: center;
}

.admin-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 12rpx;
}

.admin-desc {
  font-size: 28rpx;
  color: rgba(255,255,255,0.85);
}

.admin-menu {
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

.menu-arrow {
  font-size: 28rpx;
  color: #ccc;
}
</style>
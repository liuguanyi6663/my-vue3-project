<template>
  <view class="page">
    <view class="empty-state card">
      <text class="empty-icon">📥</text>
      <text class="empty-text">暂无下载记录</text>
      <text class="empty-hint">去资料中心看看有什么可以下载的吧~</text>
      <button class="btn-primary" style="margin-top: 30rpx;" @click="goMaterials">浏览资料</button>
    </view>
    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
const goMaterials = () => {
  uni.switchTab({ url: '/pages/materials/index' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.empty-state {
  margin: 100rpx 40rpx;
  padding: 80rpx 40rpx;
  text-align: center;
}

.empty-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
  display: block;
}
</style>

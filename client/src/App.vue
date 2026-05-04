<template>
  <view class="app">
  </view>
</template>

<script>
export default {
  onLaunch() {
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style>
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 页面切换加载遮罩 */
.page-loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99998;
}

/* 灰色转圈加载动画 */
.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #e0e0e0;
  border-top-color: #999;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.container {
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.text-gray {
  color: #999;
  font-size: 24rpx;
}

.text-primary {
  color: #007AFF;
}

.text-success {
  color: #07c160;
}

.text-warning {
  color: #ff9500;
}

.text-danger {
  color: #ff3b30;
}

.btn-primary {
  background: linear-gradient(135deg, #007AFF, #0056cc);
  color: #fff;
  border: none;
  border-radius: 44rpx;
  padding: 20rpx 40rpx;
  font-size: 30rpx;
  text-align: center;
}

.btn-outline {
  border: 2rpx solid #007AFF;
  color: #007AFF;
  border-radius: 44rpx;
  padding: 18rpx 38rpx;
  font-size: 28rpx;
  text-align: center;
  background: transparent;
}

.flex {
  display: flex;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.mt-20 {
  margin-top: 20rpx;
}

.mb-20 {
  margin-bottom: 20rpx;
}

.p-20 {
  padding: 20rpx;
}
</style>

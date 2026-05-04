<template>
  <view class="splash-screen">
    <view class="splash-content" :class="{'content-show': showContent}">
      <view class="logo-container">
        <view class="logo-wrapper">
          <image class="logo" :class="{'logo-show': showLogo}" src="/static/sxlglogo.png" mode="widthFix"></image>
        </view>
        <view class="loading-ring"></view>
      </view>
      <view class="loading-text">加载中.....</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showContent = ref(false)
const showLogo = ref(false)

onMounted(() => {
  // 先显示整个内容淡入
  setTimeout(() => {
    showContent.value = true
  }, 100)
  
  // 启动后显示logo淡入效果
  setTimeout(() => {
    showLogo.value = true
  }, 400)
  
  // 1.2秒后让logo渐隐
  setTimeout(() => {
    showLogo.value = false
  }, 1200)
  
  // 2秒后跳转到首页
  setTimeout(() => {
    uni.switchTab({
      url: '/pages/index/index'
    })
  }, 2000)
})
</script>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translateY(-30%);
  opacity: 0;
  transition: opacity 0.6s ease-in-out;
}

.splash-content.content-show {
  opacity: 1;
}

.logo-container {
  position: relative;
  width: 380rpx;
  height: 380rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-wrapper {
  width: 340rpx;
  height: 340rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.logo {
  width: 340rpx;
  max-width: 100%;
  display: block;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
}

.logo.logo-show {
  opacity: 1;
}

.loading-ring {
  position: absolute;
  width: 360rpx;
  height: 360rpx;
  border: 6rpx solid #e0e0e0;
  border-top-color: #d32f2f;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 60rpx;
  font-size: 36rpx;
  color: #d32f2f;
  letter-spacing: 8rpx;
}
</style>

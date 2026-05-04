<template>
  <view v-if="visible" class="page-loading-mask">
    <view class="loading-spinner"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)

function show() {
  visible.value = true
}

function hide() {
  visible.value = false
}

defineExpose({
  show,
  hide
})
</script>

<style scoped>
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
</style>

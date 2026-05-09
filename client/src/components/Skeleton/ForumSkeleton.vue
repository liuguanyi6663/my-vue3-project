<template>
  <view class="page">
    <view class="forum-header-skeleton">
      <view v-for="i in 5" :key="i">
        <SkeletonItem width="100rpx" height="52rpx" round />
      </view>
    </view>

    <view v-for="i in 5" :key="i" class="card">
      <view class="post-header-skeleton">
        <SkeletonItem width="56rpx" height="56rpx" circle />
        <view class="post-title-skeleton">
          <SkeletonItem width="160rpx" height="28rpx" />
          <SkeletonItem width="100rpx" height="22rpx" customClass="mt-8" />
        </view>
      </view>
      <SkeletonItem width="90%" height="32rpx" customClass="mt-16" />
      <SkeletonItem width="100%" height="24rpx" customClass="mt-12" />
      <SkeletonItem width="70%" height="24rpx" customClass="mt-12" />
      <view class="post-footer-skeleton">
        <SkeletonItem width="80rpx" height="24rpx" />
        <SkeletonItem width="80rpx" height="24rpx" />
        <SkeletonItem width="80rpx" height="24rpx" />
      </view>
    </view>
  </view>
</template>

<script setup>
import SkeletonItem from './SkeletonItem.vue'
</script>

<script>
export default { name: 'ForumSkeleton' }
</script>

<style scoped>
.page {
  padding: 20rpx;
}

.forum-header-skeleton {
  display: flex;
  gap: 20rpx;
  padding: 0 0 20rpx 0;
  white-space: nowrap;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.post-header-skeleton {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.post-title-skeleton {
  flex: 1;
}

.mt-8 {
  margin-top: 8rpx;
}

.mt-12 {
  margin-top: 12rpx;
}

.mt-16 {
  margin-top: 16rpx;
}

.post-footer-skeleton {
  display: flex;
  gap: 30rpx;
  margin-top: 20rpx;
}
</style>

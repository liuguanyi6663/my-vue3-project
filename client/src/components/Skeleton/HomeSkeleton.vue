<template>
  <view class="page">
    <view class="status-bar-skeleton">
      <SkeletonItem height="360rpx" />
    </view>

    <view class="card-skeleton">
      <SkeletonItem height="200rpx" />
    </view>

    <view class="entry-grid-skeleton">
      <view v-for="i in 6" :key="i" class="entry-item-skeleton">
        <SkeletonItem :width="80" :height="80" round />
        <SkeletonItem width="100rpx" height="24rpx" customClass="mt-12" />
        <SkeletonItem width="140rpx" height="20rpx" customClass="mt-8" />
      </view>
    </view>

    <view v-for="i in 3" :key="'card-'+i" class="card">
      <SkeletonItem width="60%" height="32rpx" />
      <SkeletonItem width="90%" height="24rpx" customClass="mt-16" />
      <SkeletonItem width="100%" height="24rpx" customClass="mt-12" />
    </view>
  </view>
</template>

<script setup>
import SkeletonItem from './SkeletonItem.vue'
</script>

<script>
export default { name: 'HomeSkeleton' }
</script>

<style scoped>
.page {
  padding: 0;
}

.status-bar-skeleton {
  height: 360rpx;
}

.card-skeleton {
  margin: 20rpx;
}

.entry-grid-skeleton {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  margin: 0 20rpx 20rpx;
}

.entry-item-skeleton {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0;
}

.mt-12 {
  margin-top: 12rpx;
}

.mt-8 {
  margin-top: 8rpx;
}

.mt-16 {
  margin-top: 16rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 0 20rpx 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}
</style>

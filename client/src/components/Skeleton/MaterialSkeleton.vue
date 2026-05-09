<template>
  <view class="page">
    <view class="search-skeleton">
      <SkeletonItem height="72rpx" />
    </view>

    <view class="category-skeleton">
      <view v-for="i in 5" :key="i">
        <SkeletonItem width="120rpx" height="52rpx" round />
      </view>
    </view>

    <view v-for="i in 5" :key="i" class="card">
      <view class="material-header-skeleton">
        <SkeletonItem width="60rpx" height="60rpx" round />
        <view class="material-info">
          <SkeletonItem width="320rpx" height="32rpx" />
          <SkeletonItem width="480rpx" height="24rpx" customClass="mt-10" />
        </view>
      </view>
      <SkeletonItem width="100%" height="24rpx" customClass="mt-16" />
      <view class="meta-skeleton">
        <SkeletonItem width="100rpx" height="22rpx" />
        <SkeletonItem width="80rpx" height="22rpx" />
        <SkeletonItem width="120rpx" height="22rpx" />
        <SkeletonItem width="120rpx" height="22rpx" />
      </view>
    </view>
  </view>
</template>

<script setup>
import SkeletonItem from './SkeletonItem.vue'
</script>

<script>
export default { name: 'MaterialSkeleton' }
</script>

<style scoped>
.page {
  padding: 20rpx;
}

.search-skeleton {
  margin-bottom: 20rpx;
}

.category-skeleton {
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

.material-header-skeleton {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.material-info {
  flex: 1;
}

.mt-10 {
  margin-top: 10rpx;
}

.mt-16 {
  margin-top: 16rpx;
}

.meta-skeleton {
  display: flex;
  gap: 20rpx;
  margin-top: 16rpx;
}
</style>

<template>
  <view class="page">
    <view v-for="i in count" :key="i" class="card">
      <view class="list-item-skeleton">
        <SkeletonItem :width="avatarSize" :height="avatarSize" :circle="!!avatar" :round="!avatar && avatar" />
        <view class="list-content">
          <SkeletonItem :width="titleWidth" height="32rpx" />
          <SkeletonItem width="90%" height="24rpx" customClass="mt-10" />
          <SkeletonItem :width="descWidth" height="24rpx" customClass="mt-8" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import SkeletonItem from './SkeletonItem.vue'

defineProps({
  count: { type: Number, default: 5 },
  avatar: { type: Boolean, default: false },
  avatarSize: { type: String, default: '56rpx' },
  titleWidth: { type: String, default: '60%' },
  descWidth: { type: String, default: '70%' }
})
</script>

<script>
export default { name: 'ListSkeleton' }
</script>

<style scoped>
.page {
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.list-item-skeleton {
  display: flex;
  gap: 16rpx;
}

.list-content {
  flex: 1;
}

.mt-8 {
  margin-top: 8rpx;
}

.mt-10 {
  margin-top: 10rpx;
}
</style>

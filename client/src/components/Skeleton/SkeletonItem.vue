<template>
  <view
    class="skeleton"
    :class="[shapeClass, customClass]"
    :style="skeletonStyle"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '30rpx' },
  round: { type: Boolean, default: false },
  circle: { type: Boolean, default: false },
  customClass: { type: String, default: '' }
})

const shapeClass = computed(() => {
  if (props.circle) return 'skeleton-circle'
  if (props.round) return 'skeleton-round'
  return ''
})

const skeletonStyle = computed(() => ({
  width: props.width,
  height: props.height
}))
</script>

<style scoped>
@import './skeleton.css';
</style>

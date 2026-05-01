<template>
  <web-view :src="url"></web-view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const url = ref('')

onLoad((options) => {
  if (options.url) {
    url.value = decodeURIComponent(options.url)
  }
  if (options.title) {
    uni.setNavigationBarTitle({ title: decodeURIComponent(options.title) })
  }
})
</script>

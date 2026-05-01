<template>
  <view class="page">
    <view class="header-section">
      <text class="page-title">学校官网</text>
      <text class="page-desc">快速访问各大高校官方网站</text>
    </view>

    <view class="search-bar card">
      <input class="search-input" v-model="keyword" placeholder="搜索学校名称" confirm-type="search" @confirm="doSearch" />
    </view>

    <view class="filter-bar">
      <view class="filter-scroll">
        <scroll-view scroll-x class="filter-scroll-inner">
          <view class="filter-tags">
            <text
              class="filter-tag"
              :class="{ active: currentRegion === '' }"
              @click="selectRegion('')"
            >全部地区</text>
            <text
              v-for="region in regions"
              :key="region"
              class="filter-tag"
              :class="{ active: currentRegion === region }"
              @click="selectRegion(region)"
            >{{ region }}</text>
          </view>
        </scroll-view>
      </view>
      <view class="filter-scroll">
        <scroll-view scroll-x class="filter-scroll-inner">
          <view class="filter-tags">
            <text
              class="filter-tag"
              :class="{ active: currentType === '' }"
              @click="selectType('')"
            >全部类型</text>
            <text
              v-for="t in types"
              :key="t"
              class="filter-tag"
              :class="{ active: currentType === t }"
              @click="selectType(t)"
            >{{ t }}</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <view v-if="list.length > 0" class="school-list">
      <view
        v-for="item in list"
        :key="item.id"
        class="school-card card"
        @click="openWebsite(item)"
      >
        <view class="school-info">
          <text class="school-name">{{ item.name }}</text>
          <view class="school-meta">
            <text v-if="item.type" class="school-type-tag">{{ item.type }}</text>
            <text v-if="item.region" class="school-region">{{ item.region }}</text>
          </view>
        </view>
        <text class="visit-btn">访问</text>
      </view>
    </view>

    <view v-else-if="!loading" class="empty-state">
      <text class="empty-text">暂无学校数据</text>
    </view>

    <view v-if="loading" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
      <text class="load-more-text">加载更多</text>
    </view>

    <view style="height: 60rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { schoolWebsitesApi } from '@/api/index'

const list = ref([])
const regions = ref([])
const types = ref(['985', '211', '双一流', '普通本科'])
const keyword = ref('')
const currentRegion = ref('')
const currentType = ref('')
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const hasMore = ref(true)

const loadRegions = async () => {
  try {
    const res = await schoolWebsitesApi.getRegions()
    if (res.code === 200 && res.data) {
      regions.value = res.data
    }
  } catch (e) {
    console.error('加载地区失败:', e)
  }
}

const loadList = async (reset) => {
  if (loading.value) return
  if (reset) {
    page.value = 1
    hasMore.value = true
  }
  if (!hasMore.value) return

  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize
    }
    if (keyword.value) params.keyword = keyword.value
    if (currentRegion.value) params.region = currentRegion.value
    if (currentType.value) params.type = currentType.value

    const res = await schoolWebsitesApi.getList(params)
    if (res.code === 200 && res.data) {
      const items = res.data.list || res.data || []
      if (reset) {
        list.value = items
      } else {
        list.value = [...list.value, ...items]
      }
      hasMore.value = items.length >= pageSize
      page.value++
    }
  } catch (e) {
    console.error('加载学校列表失败:', e)
  } finally {
    loading.value = false
  }
}

const doSearch = () => {
  loadList(true)
}

const selectRegion = (region) => {
  currentRegion.value = region
  loadList(true)
}

const selectType = (type) => {
  currentType.value = type
  loadList(true)
}

const loadMore = () => {
  loadList(false)
}

const openWebsite = async (item) => {
  try {
    await schoolWebsitesApi.trackClick(item.id)
  } catch (e) {
    // ignore
  }

  if (item.website) {
    uni.setClipboardData({
      data: item.website,
      success: () => {
        uni.showToast({ title: '网址已粘贴至剪切板，如果跳转失败请到浏览器中访问', icon: 'none', duration: 3000 })
      }
    })
    uni.navigateTo({
      url: `/pages/webview/index?url=${encodeURIComponent(item.website)}&title=${encodeURIComponent(item.name)}`
    })
  } else {
    uni.showToast({ title: '暂无官网地址', icon: 'none' })
  }
}

onMounted(() => {
  loadRegions()
  loadList(true)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
}

.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx 30rpx;
  color: #fff;
}

.page-title {
  font-size: 38rpx;
  font-weight: bold;
  display: block;
}

.page-desc {
  font-size: 24rpx;
  opacity: 0.85;
  margin-top: 8rpx;
  display: block;
}

.card {
  margin: 20rpx 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.search-bar {
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  height: 72rpx;
  background: #f7f8fa;
  border-radius: 36rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  color: #333;
}

.filter-bar {
  padding: 0 24rpx;
}

.filter-scroll {
  margin-bottom: 12rpx;
}

.filter-scroll-inner {
  white-space: nowrap;
}

.filter-tags {
  display: flex;
  gap: 16rpx;
  padding: 4rpx 0;
}

.filter-tag {
  display: inline-block;
  padding: 10rpx 28rpx;
  background: #fff;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #666;
  border: 1rpx solid #e8e8e8;
  white-space: nowrap;
}

.filter-tag.active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.school-list {
  padding: 0;
}

.school-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.school-info {
  flex: 1;
  min-width: 0;
}

.school-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.school-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.school-type-tag {
  font-size: 22rpx;
  background: #e8f0fe;
  color: #667eea;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
}

.school-region {
  font-size: 22rpx;
  color: #999;
}

.visit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 24rpx;
  padding: 12rpx 32rpx;
  border-radius: 30rpx;
  margin-left: 20rpx;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.loading-state {
  text-align: center;
  padding: 40rpx 0;
}

.loading-text {
  font-size: 26rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 30rpx 0;
}

.load-more-text {
  font-size: 26rpx;
  color: #667eea;
}
</style>

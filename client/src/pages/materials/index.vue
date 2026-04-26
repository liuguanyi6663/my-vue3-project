<template>
  <view class="page">
    <view class="search-bar">
      <input
        class="search-input"
        v-model="keyword"
        placeholder="搜索资料名称..."
        confirm-type="search"
        @confirm="search"
      />
      <text class="search-btn" @click="search">搜索</text>
    </view>

    <scroll-view scroll-x class="category-scroll">
      <view class="category-list">
        <text
          class="category-item"
          :class="{ active: currentCategory === 0 }"
          @click="selectCategory(0)"
        >
          全部
        </text>
        <text
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ active: currentCategory === cat.id }"
          @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </text>
      </view>
    </scroll-view>

    <view class="sort-bar">
      <text
        class="sort-item"
        :class="{ active: sortType === 'created_at' }"
        @click="changeSort('created_at')"
      >
        最新
      </text>
      <text
        class="sort-item"
        :class="{ active: sortType === 'download_count' }"
        @click="changeSort('download_count')"
      >
        最热
      </text>
      <text
        class="sort-item"
        :class="{ active: sortType === 'like_count' }"
        @click="changeSort('like_count')"
      >
        好评
      </text>
    </view>

    <view class="material-list">
      <view
        v-for="item in materialList"
        :key="item.id"
        class="material-card card"
        @click="goDetail(item.id)"
      >
        <view class="material-header">
          <text class="material-type-icon">{{ getFileIcon(item.file_path) }}</text>
          <text class="material-title">{{ item.title }}</text>
          <view class="material-score">
            <text class="score-star">★</text>
            <text class="score-num">{{ item.avg_score || '暂无' }}</text>
          </view>
        </view>

        <text class="material-desc">{{ item.description || '暂无描述' }}</text>

        <view class="material-meta">
          <text class="meta-item">{{ item.category_name || '未分类' }}</text>
          <text v-if="item.file_path" class="meta-item">{{ getFileExt(item.file_path).toUpperCase() }}</text>
          <text class="meta-item">下载 {{ item.download_count || 0 }}</text>
          <text class="meta-item">浏览 {{ item.view_count || 0 }}</text>
          <text class="meta-item">点赞 {{ item.like_count || 0 }}</text>
          <text class="meta-item">{{ formatTime(item.created_at) }}</text>
        </view>
      </view>

      <view v-if="materialList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📚</text>
        <text class="empty-text">暂无资料</text>
      </view>

      <view v-if="loading" class="loading-tip">
        <text>加载中...</text>
      </view>

      <view v-if="!hasMore && materialList.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </view>

    <view class="upload-fab" @click="goUpload">
      <text class="fab-text">+</text>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { materialApi } from '@/api/index'

const keyword = ref('')
const categories = ref([])
const currentCategory = ref(0)
const sortType = ref('created_at')
const materialList = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)

const loadCategories = async () => {
  try {
    const res = await materialApi.getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

const loadMaterials = async (isRefresh = false) => {
  if (loading.value) return
  loading.value = true

  if (isRefresh) {
    page.value = 1
    hasMore.value = true
  }

  try {
    const params = {
      page: page.value,
      pageSize,
      sort: sortType.value
    }

    if (currentCategory.value > 0) params.category_id = currentCategory.value
    if (keyword.value.trim()) params.keyword = keyword.value.trim()

    const res = await materialApi.getList(params)
    const list = res.data?.list || []
    const total = Number(res.data?.total || 0)

    materialList.value = isRefresh ? list : [...materialList.value, ...list]
    hasMore.value = materialList.value.length < total
    page.value += 1
  } catch (e) {
    console.error('加载资料失败:', e)
  } finally {
    loading.value = false
  }
}

const selectCategory = (id) => {
  currentCategory.value = id
  loadMaterials(true)
}

const changeSort = (type) => {
  sortType.value = type
  loadMaterials(true)
}

const search = () => {
  loadMaterials(true)
}

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/materials/detail?id=${id}` })
}

const goUpload = () => {
  uni.navigateTo({ url: '/pages/materials/upload' })
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}-${date.getDate()}`
}

const getFileIcon = (filePath) => {
  if (!filePath) return '📄'

  const ext = getFileExt(filePath)
  const iconMap = {
    pdf: '📕',
    doc: '📘',
    docx: '📘',
    xls: '📗',
    xlsx: '📗',
    ppt: '📙',
    pptx: '📙',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    txt: '📝',
    zip: '🗜️',
    rar: '🗜️'
  }

  return iconMap[ext] || '📄'
}

const getFileExt = (filePath) => {
  if (!filePath) return ''
  return filePath.split('.').pop().toLowerCase()
}

onMounted(() => {
  loadCategories()
  loadMaterials()
})

onShow(() => {
  loadMaterials(true)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-bar {
  display: flex;
  padding: 20rpx 24rpx;
  background: #fff;
  align-items: center;
}

.search-input {
  flex: 1;
  height: 70rpx;
  background: #f5f5f5;
  border-radius: 35rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

.search-btn {
  color: #007aff;
  font-size: 28rpx;
  margin-left: 20rpx;
  padding: 10rpx 20rpx;
}

.category-scroll {
  white-space: nowrap;
  background: #fff;
  padding: 16rpx 24rpx;
}

.category-list {
  display: inline-flex;
  gap: 16rpx;
}

.category-item {
  display: inline-block;
  padding: 10rpx 28rpx;
  background: #f5f5f5;
  border-radius: 24rpx;
  font-size: 26rpx;
  color: #666;
}

.category-item.active {
  background: #007aff;
  color: #fff;
}

.sort-bar {
  display: flex;
  padding: 16rpx 24rpx;
  background: #fff;
  gap: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.sort-item {
  font-size: 26rpx;
  color: #666;
  position: relative;
}

.sort-item.active {
  color: #007aff;
  font-weight: bold;
}

.material-list {
  padding: 20rpx 24rpx;
}

.material-card {
  padding: 24rpx;
}

.material-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.material-type-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.material-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 16rpx;
}

.material-score {
  display: flex;
  align-items: center;
}

.score-star {
  color: #ff9500;
  font-size: 28rpx;
}

.score-num {
  font-size: 26rpx;
  color: #ff9500;
  margin-left: 4rpx;
}

.material-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.material-meta {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 22rpx;
  color: #bbb;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.loading-tip,
.no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}

.upload-fab {
  position: fixed;
  right: 40rpx;
  bottom: 200rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #007aff, #00c6ff);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.4);
}

.fab-text {
  color: #fff;
  font-size: 56rpx;
  line-height: 1;
}
</style>

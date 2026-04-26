<template>
  <view class="page">
    <!-- 切换标签 -->
    <view class="tab-bar card">
      <text 
        class="tab-item" 
        :class="{ active: currentTab === 'material' }"
        @click="switchTab('material')"
      >收藏资料</text>
      <text 
        class="tab-item" 
        :class="{ active: currentTab === 'post' }"
        @click="switchTab('post')"
      >收藏帖子</text>
    </view>

    <!-- 资料收藏列表 -->
    <view v-if="currentTab === 'material'" class="list-section">
      <view 
        class="fav-item card" 
        v-for="(item, index) in materialList" 
        :key="index"
        @click="goMaterialDetail(item.id)"
      >
        <view class="fav-info">
          <text class="fav-title">{{ item.title }}</text>
          <view class="fav-meta">
            <text>{{ item.category_name || '未分类' }}</text>
            <text style="margin: 0 10rpx;">·</text>
            <text>⭐ {{ item.avg_score || '暂无评分' }}</text>
          </view>
        </view>
        <text class="fav-time">{{ formatTime(item.favorited_at) }}</text>
      </view>

      <view v-if="materialList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">⭐</text>
        <text class="empty-text">暂无收藏的资料</text>
      </view>
    </view>

    <!-- 帖子收藏列表 -->
    <view v-if="currentTab === 'post'" class="list-section">
      <view 
        class="fav-item card" 
        v-for="(item, index) in postList" 
        :key="index"
        @click="goPostDetail(item.id)"
      >
        <view class="fav-info">
          <text class="fav-title">{{ item.title }}</text>
          <text class="fav-preview">{{ (item.content || '').slice(0, 50) }}...</text>
        </view>
        <view class="fav-stats">
          <text>👁 {{ item.view_count }}</text>
          <text style="margin-left: 16rpx;">❤️ {{ item.like_count }}</text>
        </view>
      </view>

      <view v-if="postList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">⭐</text>
        <text class="empty-text">暂无收藏的帖子</text>
      </view>
    </view>

    <view v-if="loading" class="loading-tip"><text>加载中...</text></view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { materialApi, forumApi } from '@/api/index'
import { formatShortDate } from '@/utils/date'

const currentTab = ref('material')
const materialList = ref([])
const postList = ref([])
const loading = ref(false)

const loadMaterials = async () => {
  loading.value = true
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      materialList.value = []
      return
    }
    const res = await materialApi.getFavorites({ page: 1, pageSize: 50 })
    if (res.code === 200) {
      materialList.value = res.data?.list || []
    } else {
      materialList.value = []
    }
  } catch (e) {
    console.error('加载收藏资料失败:', e)
    materialList.value = []
  } finally {
    loading.value = false
  }
}

const loadPosts = async () => {
  loading.value = true
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      postList.value = []
      return
    }
    const res = await forumApi.getFavorites({ page: 1, pageSize: 50 })
    if (res.code === 200) {
      postList.value = res.data?.list || []
    } else {
      uni.showToast({ title: res.msg || '获取收藏失败', icon: 'none' })
      postList.value = []
    }
  } catch (e) {
    console.error('加载收藏帖子失败:', e)
    uni.showToast({ title: '获取收藏失败', icon: 'none' })
    postList.value = []
  } finally {
    loading.value = false
  }
}

const switchTab = (tab) => {
  currentTab.value = tab
  if (tab === 'material') loadMaterials()
  if (tab === 'post') loadPosts()
}

const goMaterialDetail = (id) => uni.navigateTo({ url: `/pages/materials/detail?id=${id}` })
const goPostDetail = (id) => uni.navigateTo({ url: `/pages/forum/detail?id=${id}` })

const formatTime = (timeStr) => formatShortDate(timeStr)

onMounted(() => {
  loadMaterials()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.tab-bar {
  display: flex;
  margin: 20rpx 24rpx;
  padding: 8rpx;
  background: #f0f0f0;
  border-radius: 12rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666;
  border-radius: 10rpx;
}

.tab-item.active {
  background: #fff;
  color: #007AFF;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
}

.list-section {
  padding: 0 24rpx;
}

.fav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.fav-info {
  flex: 1;
  margin-right: 20rpx;
}

.fav-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-meta {
  font-size: 24rpx;
  color: #999;
  display: flex;
  align-items: center;
}

.fav-preview {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-top: 6rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-time {
  font-size: 22rpx;
  color: #bbb;
  flex-shrink: 0;
}

.fav-stats {
  display: flex;
  font-size: 22rpx;
  color: #999;
  flex-shrink: 0;
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

.loading-tip {
  text-align: center;
  padding: 40rpx;
  color: #999;
}
</style>

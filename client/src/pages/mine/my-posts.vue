<template>
  <view class="page">
    <view class="stats-bar card">
      <view class="stat-item" @click="filterByCategory('')">
        <text class="stat-num" :class="{ active: currentFilter === '' }">{{ stats.total || 0 }}</text>
        <text class="stat-label">全部</text>
      </view>
      <view class="stat-item" @click="filterByCategory('study')">
        <text class="stat-num" :class="{ active: currentFilter === 'study' }">{{ stats.study_count || 0 }}</text>
        <text class="stat-label">备考交流</text>
      </view>
      <view class="stat-item" @click="filterByCategory('experience')">
        <text class="stat-num" :class="{ active: currentFilter === 'experience' }">{{ stats.experience_count || 0 }}</text>
        <text class="stat-label">上岸经验</text>
      </view>
      <view class="stat-item" @click="filterByCategory('help')">
        <text class="stat-num" :class="{ active: currentFilter === 'help' }">{{ stats.help_count || 0 }}</text>
        <text class="stat-label">资料求助</text>
      </view>
      <view class="stat-item" @click="filterByCategory('adjust')">
        <text class="stat-num" :class="{ active: currentFilter === 'adjust' }">{{ stats.adjust_count || 0 }}</text>
        <text class="stat-label">复试调剂</text>
      </view>
    </view>

    <view class="list-section">
      <view 
        class="post-item card" 
        v-for="(item, index) in postList" 
        :key="index"
        @click="goDetail(item)"
      >
        <view class="item-header">
          <view class="item-info">
            <text class="item-title">{{ item.title }}</text>
            <text class="item-content">{{ (item.content || '').slice(0, 60) }}{{ (item.content || '').length > 60 ? '...' : '' }}</text>
          </view>
          <view class="category-badge" :class="item.category">
            <text class="badge-text">{{ getCategoryName(item.category) }}</text>
          </view>
        </view>

        <view v-if="item.images && item.images.length > 0" class="item-images">
          <image 
            v-for="(img, idx) in item.images.slice(0, 3)" 
            :key="idx" 
            class="preview-image" 
            :src="getImageUrl(img)" 
            mode="aspectFill"
            @click.stop="previewImage(item.images, idx)"
          />
          <view v-if="item.images.length > 3" class="image-more">
            <text>+{{ item.images.length - 3 }}</text>
          </view>
        </view>

        <view class="item-footer">
          <view class="item-stats">
            <text class="stats-text">👁 {{ item.view_count || 0 }}</text>
            <text class="stats-text">❤️ {{ item.like_count || 0 }}</text>
            <text class="stats-text">💬 {{ item.comment_count || 0 }}</text>
          </view>
          <view class="item-actions">
            <text class="action-time">{{ formatRelativeTime(item.created_at) }}</text>
            <text class="action-delete" @click.stop="confirmDelete(item)">🗑️ 删除</text>
          </view>
        </view>

        <view v-if="item.is_anonymous === 1" class="anonymous-tag">
          <text>🎭 匿名发布</text>
        </view>
      </view>

      <view v-if="postList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">💬</text>
        <text class="empty-text" v-if="currentFilter">暂无{{ getCategoryName(currentFilter) }}帖子</text>
        <text class="empty-text" v-else>暂无发布的帖子</text>
        <text class="empty-hint">点击右下角按钮发帖吧~</text>
      </view>
    </view>

    <view v-if="loading" class="loading-tip"><text>加载中...</text></view>

    <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
      <text>加载更多</text>
    </view>

    <view class="fab-btn" @click="goPost">
      <text class="fab-icon">✏️</text>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { forumApi } from '@/api/index'
import { formatRelativeTime } from '@/utils/date'

const postList = ref([])
const loading = ref(false)
const currentFilter = ref('')
const page = ref(1)
const pageSize = 10
const hasMore = ref(false)
const stats = ref({
  total: 0,
  study_count: 0,
  experience_count: 0,
  help_count: 0,
  adjust_count: 0,
  treehole_count: 0
})

const loadPosts = async (reset = false) => {
  if (loading.value) return
  loading.value = true

  if (reset) {
    page.value = 1
    postList.value = []
  }

  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      postList.value = []
      loading.value = false
      return
    }

    const params = { page: page.value, pageSize }
    if (currentFilter.value) {
      params.category = currentFilter.value
    }

    const res = await forumApi.getMyPosts(params)
    if (res.code === 200) {
      const list = res.data?.list || []
      if (reset) {
        postList.value = list
      } else {
        postList.value = [...postList.value, ...list]
      }
      hasMore.value = page.value < (res.data?.totalPages || 1)

      if (res.data?.stats) {
        stats.value = res.data.stats
      }
    }
  } catch (e) {
    console.error('加载帖子失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const filterByCategory = (category) => {
  currentFilter.value = category
  loadPosts(true)
}

const loadMore = () => {
  page.value++
  loadPosts(false)
}

const goDetail = (item) => {
  uni.navigateTo({ url: `/pages/forum/detail?id=${item.id}` })
}

const goPost = () => {
  uni.navigateTo({ url: '/pages/forum/post' })
}

const confirmDelete = (item) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${item.title}"吗？删除后不可恢复。`,
    confirmColor: '#ff3b30',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await forumApi.deletePost(item.id)
          if (result.code === 200) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            loadPosts(true)
          } else {
            uni.showToast({ title: result.msg || '删除失败', icon: 'none' })
          }
        } catch (e) {
          console.error('删除失败:', e)
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return 'http://127.0.0.1:3000' + (url.startsWith('/') ? url : '/' + url)
}

const previewImage = (images, index) => {
  const fullUrls = images.map(getImageUrl)
  uni.previewImage({ current: index, urls: fullUrls })
}

const getCategoryName = (category) => {
  const map = {
    study: '备考交流',
    experience: '上岸经验',
    help: '资料求助',
    adjust: '复试调剂',
    treehole: '匿名树洞'
  }
  return map[category] || category
}

onShow(() => {
  loadPosts(true)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  margin: 20rpx 24rpx;
  padding: 24rpx 0;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  flex: 1;
  min-width: 100rpx;
}

.stat-num {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}

.stat-num.active {
  color: #007AFF;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
}

.list-section {
  padding: 0 24rpx;
}

.post-item {
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-info {
  flex: 1;
  margin-right: 16rpx;
}

.item-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-content {
  font-size: 24rpx;
  color: #999;
  display: block;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-badge {
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.category-badge.study {
  background: rgba(0, 122, 255, 0.1);
}

.category-badge.experience {
  background: rgba(76, 175, 80, 0.1);
}

.category-badge.help {
  background: rgba(255, 149, 0, 0.1);
}

.category-badge.adjust {
  background: rgba(156, 39, 176, 0.1);
}

.category-badge.treehole {
  background: rgba(96, 125, 139, 0.1);
}

.category-badge .badge-text {
  font-size: 20rpx;
  font-weight: 500;
}

.category-badge.study .badge-text {
  color: #007AFF;
}

.category-badge.experience .badge-text {
  color: #4CAF50;
}

.category-badge.help .badge-text {
  color: #FF9500;
}

.category-badge.adjust .badge-text {
  color: #9C27B0;
}

.category-badge.treehole .badge-text {
  color: #607D8B;
}

.item-images {
  display: flex;
  gap: 10rpx;
  margin-top: 16rpx;
  position: relative;
}

.preview-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 10rpx;
}

.image-more {
  width: 160rpx;
  height: 160rpx;
  border-radius: 10rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28rpx;
  position: absolute;
  right: 0;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  margin-top: 12rpx;
  border-top: 1rpx solid #f0f0f0;
}

.item-stats {
  display: flex;
}

.stats-text {
  font-size: 22rpx;
  color: #999;
  margin-right: 20rpx;
}

.item-actions {
  display: flex;
  align-items: center;
}

.action-time {
  font-size: 22rpx;
  color: #bbb;
  margin-right: 24rpx;
}

.action-delete {
  font-size: 22rpx;
  color: #ff3b30;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  background: rgba(255, 59, 48, 0.08);
}

.anonymous-tag {
  margin-top: 12rpx;
  padding: 4rpx 12rpx;
  background: rgba(96, 125, 139, 0.08);
  border-radius: 6rpx;
  display: inline-flex;
}

.anonymous-tag text {
  font-size: 20rpx;
  color: #607D8B;
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
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}

.loading-tip {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}

.load-more {
  text-align: center;
  padding: 30rpx;
  color: #007AFF;
  font-size: 26rpx;
}

.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 160rpx;
  width: 110rpx;
  height: 110rpx;
  border-radius: 55rpx;
  background: linear-gradient(135deg, #07c160, #06ad56);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.4);
  z-index: 100;
}

.fab-icon {
  font-size: 40rpx;
}
</style>

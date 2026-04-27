<template>
  <view class="page">
    <!-- 板块切换 -->
    <scroll-view scroll-x class="tab-scroll">
      <view class="tab-list">
        <text 
          v-for="(tab, index) in tabs" :key="index"
          class="tab-item" 
          :class="{ active: currentTab === tab.value }"
          @click="switchTab(tab.value)"
        >{{ tab.label }}</text>
      </view>
    </scroll-view>

    <!-- 排序 -->
    <view class="sort-bar">
      <text 
        class="sort-item" 
        :class="{ active: sortType === 'created_at' }"
        @click="changeSort('created_at')"
      >最新</text>
      <text 
        class="sort-item" 
        :class="{ active: sortType === 'hot' }"
        @click="changeSort('hot')"
      >最热</text>
      <text 
        class="sort-item" 
        :class="{ active: sortType === 'comment' }"
        @click="changeSort('comment')"
      >热评</text>
    </view>

    <!-- 帖子列表 -->
    <view class="post-list">
      <view 
        class="post-card card" 
        v-for="(item, index) in postList" 
        :key="index"
        @click="goDetail(item.id)"
      >
        <view class="post-header">
          <view class="author-info">
            <image class="avatar" :src="getAvatarUrl(item.author_avatar)" mode="aspectFill" @click.stop="goUserProfile(item.user_id, item.is_anonymous)" />
            <view>
              <text class="author-name">{{ item.display_name || item.author_name }}</text>
              <text class="post-time">{{ formatTime(item.created_at) }}</text>
            </view>
          </view>
          <text class="post-tag" v-if="item.is_essence">精华</text>
          <text class="post-tag top-tag" v-if="item.is_top">置顶</text>
        </view>
        
        <text class="post-title">{{ item.title }}</text>
        <text class="post-content">{{ item.content }}</text>
        
        <!-- 图片展示 -->
        <view class="post-images" v-if="item.images && item.images.length > 0">
          <view class="image-grid" :class="'grid-' + Math.min(item.images.length, 9)">
            <image 
              v-for="(img, idx) in item.images.slice(0, 9)" 
              :key="idx" 
              class="post-image" 
              :src="getImageUrl(img)" 
              mode="aspectFill"
              @click.stop="previewPostImage(item.images, idx)"
            />
          </view>
        </view>
        
        <view class="post-footer">
          <text class="footer-item">
            <text>👁 {{ item.view_count }}</text>
          </text>
          <text class="footer-item" @click.stop="toggleLike(item)">
            <text :class="{ liked: item.isLiked }">{{ item.isLiked ? '❤️' : '🤍' }} {{ item.like_count }}</text>
          </text>
          <text class="footer-item">
            <text>💬 {{ item.comment_count }}</text>
          </text>
          <text class="footer-item delete-btn" v-if="item.canDelete" @click.stop="deletePost(item)">
            <text>🗑️ 删除</text>
          </text>
        </view>
      </view>

      <view v-if="postList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无帖子，快来发帖吧~</text>
      </view>

      <view v-if="loading" class="loading-tip"><text>加载中...</text></view>
      <view v-if="!hasMore && postList.length > 0" class="no-more"><text>— 没有更多了 —</text></view>
    </view>

    <!-- 发帖按钮 -->
    <view class="post-fab" @click="goPost">
      <text class="fab-text">✏️</text>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { forumApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'
import { formatMessageTime } from '@/utils/date'

const tabs = [
  { label: '备考交流', value: 'study' },
  { label: '上岸经验', value: 'experience' },
  { label: '资料求助', value: 'help' },
  { label: '复试调剂', value: 'adjust' },
  { label: '匿名树洞', value: 'treehole' }
]

const currentTab = ref('study')
const sortType = ref('created_at')
const postList = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)

const getCurrentUser = () => {
  try {
    return JSON.parse(uni.getStorageSync('user') || '{}')
  } catch (e) {
    return {}
  }
}

const isAdmin = () => {
  const user = getCurrentUser()
  return user.role === 'admin'
}

// 处理列表中的匿名显示
const processPostDisplay = (posts) => {
  const admin = isAdmin()
  return posts.map(post => {
    // 如果是匿名树洞帖子且不是管理员，强制隐藏真实信息
    if (post.category === 'treehole' && !admin) {
      return {
        ...post,
        is_anonymous: 1,
        display_name: '匿名用户',
        author_avatar: '/static/default-avatar.png'
      }
    }
    return post
  })
}

const loadPosts = async (isRefresh = false) => {
  if (loading.value) return
  loading.value = true
  
  if (isRefresh) {
    page.value = 1
    hasMore.value = true
  }

  try {
    console.log('开始加载帖子，参数:', {
      category: currentTab.value,
      sort: sortType.value,
      page: page.value,
      pageSize
    })
    const res = await forumApi.getPosts({
      category: currentTab.value,
      sort: sortType.value,
      page: page.value,
      pageSize
    })
    console.log('接口返回完整数据:', res)
    
    let list = res.data?.list || []
    console.log('解析出的帖子列表:', list)
    
    // 解析 images JSON 字段
    list = list.map(item => {
      let parsedImages = []
      try {
        if (item.images) {
          if (typeof item.images === 'string') {
            parsedImages = JSON.parse(item.images)
          } else if (Array.isArray(item.images)) {
            parsedImages = item.images
          }
        }
      } catch (e) {
        console.warn('解析 images 失败', e)
      }
      return { ...item, images: parsedImages }
    })
    
    // 处理匿名显示
    list = processPostDisplay(list)
    
    if (isRefresh) {
      postList.value = list
    } else {
      postList.value = [...postList.value, ...list]
    }
    
    hasMore.value = postList.value.length < res.data?.total
    console.log('当前帖子列表:', postList.value, '总数:', res.data?.total)
    page.value++
  } catch (e) {
    console.error('加载帖子失败:', e)
  } finally {
    loading.value = false
  }
}

const onLoad = (options) => {
  // 如果URL里有 category 参数，设置当前tab
  if (options.category) {
    currentTab.value = options.category
  }
}

const switchTab = (tab) => {
  currentTab.value = tab
  loadPosts(true)
}

const changeSort = (type) => {
  sortType.value = type
  loadPosts(true)
}

const toggleLike = async (item) => {
  try {
    const res = await forumApi.toggleLike(item.id)
    item.isLiked = res.data.isLiked
    item.like_count = res.data.likeCount
  } catch (e) {
    console.error(e)
  }
}

const goDetail = (id) => uni.navigateTo({ url: `/pages/forum/detail?id=${id}` })
const goUserProfile = (userId, isAnonymous) => {
  if (!userId || isAnonymous) return
  const currentUserId = uni.getStorageSync('userInfo')
  try {
    const parsed = JSON.parse(currentUserId)
    if (parsed && parsed.id === userId) {
      uni.navigateTo({ url: '/pages/mine/profile' })
      return
    }
  } catch (e) {}
  uni.navigateTo({ url: `/pages/mine/user-profile?userId=${userId}` })
}
const goPost = () => {
  const url = currentTab.value === 'treehole' 
    ? '/pages/forum/post?category=treehole' 
    : '/pages/forum/post'
  uni.navigateTo({ url })
}

const deletePost = async (item) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这个帖子吗？',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        const res = await forumApi.deletePost(item.id)
        if (res.code === 200) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          postList.value = postList.value.filter(p => p.id !== item.id)
        } else {
          uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
        }
      } catch (e) {
        console.error('删除帖子失败:', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

const formatTime = (timeStr) => formatMessageTime(timeStr)

// 处理图片 URL，确保完整路径
const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 拼接本地服务器地址
  return 'http://127.0.0.1:3000' + (url.startsWith('/') ? url : '/' + url)
}

// 预览列表页图片
const previewPostImage = (images, index) => {
  // 把所有图片路径转成完整 URL
  const fullUrls = images.map(getImageUrl)
  uni.previewImage({
    current: index,
    urls: fullUrls
  })
}

onMounted(() => {
  loadPosts()
})

uni.$on('switchForumTab', (tab) => {
  currentTab.value = tab
  loadPosts(true)
})

onShow(() => {
  // 检查是否有默认分类需要设置（从首页匿名树洞跳转过来）
  const defaultCategory = uni.getStorageSync('forumDefaultCategory')
  if (defaultCategory) {
    currentTab.value = defaultCategory
    // 清除标记
    uni.removeStorageSync('forumDefaultCategory')
    loadPosts(true)
  } else {
    loadPosts(true)
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.tab-scroll {
  white-space: nowrap;
  background: #fff;
  padding: 20rpx 24rpx;
}

.tab-list {
  display: inline-flex;
  gap: 16rpx;
}

.tab-item {
  display: inline-block;
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;
}

.tab-item.active {
  background: #007AFF;
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
}

.sort-item.active {
  color: #007AFF;
  font-weight: bold;
}

.post-list {
  padding: 20rpx 24rpx;
}

.post-card {
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.author-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.author-name {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  display: block;
}

.post-time {
  font-size: 22rpx;
  color: #999;
}

.post-tag {
  background: #fff3e0;
  color: #ff9500;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.top-tag {
  background: #ffebee;
  color: #ff3b30;
}

.post-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  display: block;
  margin-bottom: 12rpx;
}

.post-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.post-footer {
  display: flex;
  gap: 40rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.footer-item {
  font-size: 24rpx;
  color: #999;
}

.footer-item .liked {
  color: #ff3b30;
}

.footer-item.delete-btn {
  color: #ff3b30;
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

.loading-tip, .no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}

.post-fab {
  position: fixed;
  right: 40rpx;
  bottom: 200rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #07c160, #06ad56);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.4);
}

.fab-text {
  font-size: 44rpx;
}

/* 列表页图片展示 */
.post-images {
  margin-bottom: 16rpx;
}

.image-grid {
  display: grid;
  gap: 8rpx;
}

/* 单张图样式 */
.grid-1 {
  grid-template-columns: 1fr;
}
.grid-1 .post-image {
  width: 100%;
  max-height: 500rpx;
}

/* 2-3张图 */
.grid-2, .grid-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-2 .post-image, .grid-3 .post-image {
  width: 100%;
  aspect-ratio: 1/1;
}

/* 4-9张图 */
.grid-4, .grid-5, .grid-6, .grid-7, .grid-8, .grid-9 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-4 .post-image, .grid-5 .post-image, 
.grid-6 .post-image, .grid-7 .post-image, 
.grid-8 .post-image, .grid-9 .post-image {
  width: 100%;
  aspect-ratio: 1/1;
}

.post-image {
  width: 100%;
  border-radius: 12rpx;
  background-color: #f5f5f5;
}
</style>

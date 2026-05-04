<template>
  <view class="page" v-if="userInfo">
    <view class="profile-header">
      <image class="profile-avatar" :src="getAvatarUrl(userInfo.avatar)" mode="aspectFill" />
      <view class="nickname-row">
        <text class="profile-nickname">{{ userInfo.nickname }}</text>
        <text class="landed-badge" v-if="userInfo.is_landed === 1">已上岸</text>
      </view>
      <text class="profile-desc" v-if="userInfo.college">{{ userInfo.college }} · {{ userInfo.major }}</text>
      <text class="profile-desc" v-if="userInfo.target_school">目标：{{ userInfo.target_school }} · {{ userInfo.target_major }}</text>
      <text class="profile-desc" v-if="userInfo.exam_year">{{ userInfo.exam_year }}年考研</text>
    </view>

    <view class="info-section">
      <view class="section-header">
        <text class="section-title">基本信息</text>
      </view>
      <view class="info-card">
        <view class="info-item" v-if="userInfo.college">
          <text class="info-label">院校</text>
          <text class="info-value">{{ userInfo.college }}</text>
        </view>
        <view class="info-item" v-if="userInfo.major">
          <text class="info-label">专业</text>
          <text class="info-value">{{ userInfo.major }}</text>
        </view>
      </view>
    </view>

    <view class="info-section" v-if="userInfo.target_school || userInfo.target_major || userInfo.exam_year">
      <view class="section-header">
        <text class="section-title">考研信息</text>
      </view>
      <view class="info-card">
        <view class="info-item" v-if="userInfo.target_school">
          <text class="info-label">目标院校</text>
          <text class="info-value">{{ userInfo.target_school }}</text>
        </view>
        <view class="info-item" v-if="userInfo.target_major">
          <text class="info-label">目标专业</text>
          <text class="info-value">{{ userInfo.target_major }}</text>
        </view>
        <view class="info-item" v-if="userInfo.exam_year">
          <text class="info-label">考研年份</text>
          <text class="info-value">{{ userInfo.exam_year }}年</text>
        </view>
      </view>
    </view>

    <view class="info-section">
      <view class="section-header">
        <text class="section-title">TA的帖子</text>
      </view>
      
      <view v-if="postList.length > 0" class="post-list">
        <view 
          class="post-card card" 
          v-for="(item, index) in postList" 
          :key="index"
          @click="goDetail(item.id)"
        >
          <view class="post-header">
            <view class="author-info">
              <image class="avatar" :src="getAvatarUrl(item.author_avatar)" mode="aspectFill" />
              <view>
                <view class="author-name-row">
                  <text class="author-name">{{ item.author_name }}</text>
                  <text class="landed-badge-small" v-if="item.author_is_landed === 1">已上岸</text>
                </view>
                <text class="post-time">{{ formatTime(item.created_at) }}</text>
              </view>
            </view>
            <text class="post-tag" v-if="item.is_essence">精华</text>
            <text class="post-tag top-tag" v-if="item.is_top">置顶</text>
          </view>
          
          <text class="post-title">{{ item.title }}</text>
          <text class="post-content">{{ item.content }}</text>
          
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
            <text class="footer-item">
              <text>{{ item.isLiked ? '❤️' : '🤍' }} {{ item.like_count }}</text>
            </text>
            <text class="footer-item">
              <text>💬 {{ item.comment_count }}</text>
            </text>
          </view>
        </view>
        
        <view v-if="loading" class="loading-tip"><text>加载中...</text></view>
        <view v-if="!hasMore && postList.length > 0" class="no-more"><text>— 没有更多了 —</text></view>
      </view>
      
      <view v-else-if="!loading" class="empty-section">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无帖子</text>
      </view>
    </view>

    <view class="btn-section">
      <button class="msg-btn" @click="sendMessage">发信息</button>
    </view>
  </view>

  <view v-else class="loading-page"><text>加载中...</text></view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onReachBottom } from '@dcloudio/uni-app'
import { userApi, forumApi } from '@/api/index'
import { formatMessageTime } from '@/utils/date'

const userInfo = ref(null)
const userId = ref('')
const postList = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)

const loadUserInfo = async () => {
  try {
    const res = await userApi.getPublicInfo(userId.value)
    if (res.code === 200) {
      userInfo.value = res.data
    }
  } catch (e) {
    console.error('加载用户信息失败:', e)
    uni.showToast({ title: '用户信息加载失败', icon: 'none' })
  }
}

const loadUserPosts = async (isRefresh = false) => {
  if (loading.value) return
  loading.value = true
  
  if (isRefresh) {
    page.value = 1
    hasMore.value = true
  }

  try {
    const res = await forumApi.getUserPosts(userId.value, {
      page: page.value,
      pageSize
    })
    
    const list = res.data?.list || []
    
    if (isRefresh) {
      postList.value = list
    } else {
      postList.value = [...postList.value, ...list]
    }
    
    hasMore.value = postList.value.length < res.data?.total
    page.value++
  } catch (e) {
    console.error('加载用户帖子失败:', e)
  } finally {
    loading.value = false
  }
}

const sendMessage = () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 1000)
    return
  }
  uni.navigateTo({ url: `/pages/mine/chat?userId=${userId.value}&nickname=${encodeURIComponent(userInfo.value.nickname)}` })
}

const goDetail = (id) => uni.navigateTo({ url: `/pages/forum/detail?id=${id}` })

const formatTime = (timeStr) => formatMessageTime(timeStr)

const getAvatarUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return 'http://127.0.0.1:3000' + (url.startsWith('/') ? url : '/' + url)
}

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return 'http://127.0.0.1:3000' + (url.startsWith('/') ? url : '/' + url)
}

const previewPostImage = (images, index) => {
  const fullUrls = images.map(getImageUrl)
  uni.previewImage({
    current: index,
    urls: fullUrls
  })
}

onReachBottom(() => {
  if (hasMore.value && !loading.value) {
    loadUserPosts()
  }
})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  userId.value = currentPage.options?.userId || ''
  if (userId.value) {
    loadUserInfo()
    loadUserPosts(true)
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 160rpx;
}

.profile-header {
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 30rpx 50rpx;
}

.profile-avatar {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.9);
}

.profile-nickname {
  font-size: 38rpx;
  font-weight: bold;
  color: #fff;
  margin-top: 20rpx;
}

.nickname-row {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
}

.landed-badge {
  display: inline-block;
  font-size: 22rpx;
  color: #fff;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
  margin-left: 12rpx;
  font-weight: bold;
}

.profile-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8rpx;
}

.info-section {
  margin-top: 24rpx;
}

.section-header {
  padding: 20rpx 30rpx 10rpx;
}

.section-title {
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
}

.info-card {
  background: #fff;
  padding: 0 30rpx;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 30rpx;
  color: #333;
  flex-shrink: 0;
  width: 160rpx;
}

.info-value {
  font-size: 30rpx;
  color: #666;
  text-align: right;
  flex: 1;
}

.empty-section {
  background: #fff;
  padding: 100rpx 0;
  text-align: center;
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

.post-list {
  padding: 0 24rpx;
}

.post-card {
  background: #fff;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
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
  display: inline;
}

.author-name-row {
  display: flex;
  align-items: center;
}

.landed-badge-small {
  display: inline-block;
  font-size: 18rpx;
  color: #fff;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  padding: 1rpx 8rpx;
  border-radius: 6rpx;
  margin-left: 6rpx;
  font-weight: bold;
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

.post-images {
  margin-bottom: 16rpx;
}

.image-grid {
  display: grid;
  gap: 8rpx;
}

.grid-1 {
  grid-template-columns: 1fr;
}

.grid-1 .post-image {
  width: 100%;
  max-height: 500rpx;
}

.grid-2, .grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-2 .post-image, .grid-3 .post-image {
  width: 100%;
  aspect-ratio: 1/1;
}

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

.btn-section {
  padding: 40rpx 30rpx;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f5f5f5;
}

.msg-btn {
  width: 100%;
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  color: white;
  font-size: 32rpx;
  border-radius: 50rpx;
  padding: 24rpx 0;
  border: none;
  letter-spacing: 4rpx;
}

.loading-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
}

.loading-tip, .no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}
</style>

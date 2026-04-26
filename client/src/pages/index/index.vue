<template>
  <view class="page">
    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="countdown-section">
        <text class="countdown-text">{{ countdown.days }}天</text>
        <text class="countdown-label">距{{ kaoyanYear }}考研</text>
      </view>
      <view class="daily-quote">
        <text class="quote-text">{{ dailyQuote }}</text>
      </view>
      <text class="checkin-btn" @click="goCheckin">打卡</text>
    </view>

    <!-- 大屏轮播 -->
    <view class="ad-carousel card">
      <swiper class="carousel-swiper" autoplay indicator-dots circular interval="3000">
        <swiper-item v-for="(screen, index) in screens" :key="screen.id || index">
          <view class="ad-item">
            <image :src="getImageUrl(screen.image_url)" mode="aspectFill" class="ad-image"></image>
            <view v-if="screen.name" class="ad-content">
              <text class="ad-title">{{ screen.name }}</text>
            </view>
          </view>
        </swiper-item>
        <swiper-item v-if="screens.length === 0">
          <view class="ad-item">
            <image src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=education%20banner%20for%20postgraduate%20exam%20preparation%2C%20students%20studying%2C%20books%2C%20academic%20atmosphere&image_size=landscape_16_9" mode="aspectFill" class="ad-image"></image>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-entry card">
      <scroll-view scroll-x class="entry-scroll" show-scrollbar="false">
        <view class="entry-grid">
          <view class="entry-item" @click="switchToTab('/pages/materials/index')">
            <text class="entry-icon hot">📚</text>
            <text class="entry-label">本校资料中心</text>
          </view>
          <view class="entry-item" @click="navigateTo('/pages/data/dashboard')">
            <text class="entry-icon">📊</text>
            <text class="entry-label">本校考研数据</text>
          </view>
          <view class="entry-item" @click="navigateTo('/pages/mine/checkin')">
            <text class="entry-icon">✅</text>
            <text class="entry-label">学习打卡</text>
          </view>
          <view class="entry-item" @click="navigateTo('')">
            <text class="entry-icon new">🎯</text>
            <text class="entry-label">复试工具箱</text>
          </view>
          <view class="entry-item" @click="goToTreehole">
            <text class="entry-icon">🌳</text>
            <text class="entry-label">匿名树洞</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 考研时间线 -->
    <view class="timeline-section card">
      <view class="timeline-header">
        <text class="timeline-year">{{ currentYear }}</text>
        <text class="timeline-label">Year</text>
      </view>
      <scroll-view scroll-x class="timeline-scroll" show-scrollbar="false" @scroll="onTimelineScroll">
        <view class="timeline-bar">
          <!-- 当年节点 -->
          <view class="timeline-period">
            <text class="period-text">3~6月</text>
            <text class="period-desc">择校择专业</text>
            <text class="period-tip">选择大于努力</text>
          </view>
          <view class="timeline-line">
            <view class="timeline-dot active"></view>
            <view class="timeline-dot"></view>
            <view class="timeline-dot"></view>
          </view>
          <view class="timeline-period">
            <text class="period-text">8~9月</text>
            <text class="period-desc">考研大纲</text>
            <text class="period-tip">大纲在哪找？</text>
          </view>
          <view class="timeline-line">
            <view class="timeline-dot"></view>
          </view>
          <view class="timeline-period">
            <text class="period-text">10月9~</text>
            <text class="period-desc">预报名</text>
            <text class="period-tip">报名注意事项</text>
          </view>
          <view class="timeline-line">
            <view class="timeline-dot"></view>
          </view>
          <view class="timeline-period">
            <text class="period-text">11月</text>
            <text class="period-desc">现场确认</text>
            <text class="period-tip">带好证件照</text>
          </view>
          <view class="timeline-line">
            <view class="timeline-dot"></view>
          </view>
          <view class="timeline-period">
            <text class="period-text">12月</text>
            <text class="period-desc">初试</text>
            <text class="period-tip">考前准备</text>
          </view>
          
          <!-- 次年节点 -->
          <view class="timeline-line">
            <view class="timeline-dot"></view>
          </view>
          <view class="timeline-period">
            <text class="period-text">{{ kaoyanYear }}年2月</text>
            <text class="period-desc">初试成绩公布</text>
            <text class="period-tip">查分注意事项</text>
          </view>
          <view class="timeline-line">
            <view class="timeline-dot"></view>
          </view>
          <view class="timeline-period">
            <text class="period-text">3月初</text>
            <text class="period-desc">院校自主划线</text>
            <text class="period-tip">关注目标院校</text>
          </view>
          <view class="timeline-line">
            <view class="timeline-dot"></view>
          </view>
          <view class="timeline-period">
            <text class="period-text">3月中旬</text>
            <text class="period-desc">国家线</text>
            <text class="period-tip">过线与否</text>
          </view>
          <view class="timeline-line">
            <view class="timeline-dot"></view>
          </view>
          <view class="timeline-period">
            <text class="period-text">3-4月底</text>
            <text class="period-desc">复试及调剂</text>
            <text class="period-tip">准备复试材料</text>
          </view>
        </view>
      </scroll-view>
    </view>



    <view class="experience-section card">
      <view class="section-header">
        <text class="section-title">热门经验帖</text>
      </view>
      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
      <view v-else-if="experiencePosts.length === 0" class="empty-state">
        <text class="empty-text">暂无经验帖</text>
        <text class="empty-hint">快去论坛分享你的考研经验吧~</text>
      </view>
      <view v-else class="experience-list">
        <view v-for="(post, index) in experiencePosts" :key="post.id || index" class="experience-item" @click="goPostDetail(post.id)">
          <text class="post-number" :class="{ 'top-three': index < 3 }">{{ index < 3 ? '🔥' : '' }}{{ index + 1 }}</text>
          <text class="post-title">{{ post.title }}</text>
          <view class="post-stats">
            <text class="stat-item">🤍 {{ post.like_count || 0 }}</text>
            <text class="stat-item">💬 {{ post.comment_count || 0 }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 消息通知栏 -->
    <view class="notification-section card">
      <view class="section-header">
        <text class="section-title">通知公告</text>
        <text class="section-more" @click="goNotifications">查看更多 ></text>
      </view>
      <view v-if="notificationLoading" class="loading-state">
        <text>加载中...</text>
      </view>
      <view v-else-if="notifications.length === 0" class="empty-state">
        <text class="empty-text">暂无通知</text>
      </view>
      <view v-else class="notification-list">
        <view v-for="(notification, index) in notifications" :key="notification.id || index" class="notification-item" @click="goNotificationDetail(notification.id)">
          <view class="notification-title-row">
            <text v-if="notification.is_top === 1" class="top-badge">置顶</text>
            <text class="notification-title" :class="{ 'title-top': notification.is_top === 1 }">{{ notification.title }}</text>
          </view>
          <text class="notification-time">{{ formatTime(notification.created_at) }}</text>
        </view>
      </view>
    </view>

    <!-- 底部安全区域 -->
    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { homeApi, studyApi, forumApi } from '@/api/index'
import { getCurrentYear, getKaoyanYear, getKaoyanTargetDate, formatRelativeTime, getTimeSeed } from '@/utils/date'

const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
let timer = null

const experiencePosts = ref([])
const loading = ref(false)

const kaoyanYear = getKaoyanYear()
const currentYear = ref(getCurrentYear())
const dailyQuote = ref('坚持就是胜利，考研必胜！')
const ads = ref([])
const screens = ref([])
const notifications = ref([])
const notificationLoading = ref(false)

const updateCountdown = () => {
  const now = getTimeSeed()
  const targetDate = getKaoyanTargetDate()
  const diff = targetDate - now

  if (diff <= 0) {
    countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  countdown.value = { days, hours, minutes, seconds }
}

const navigateTo = (path) => {
  if (path) uni.navigateTo({ url: path })
  else uni.showToast({ title: '功能开发中', icon: 'none' })
}

const switchToTab = (path) => {
  uni.switchTab({ url: path })
}

const goCheckin = () => {
  uni.navigateTo({ url: '/pages/mine/checkin' })
}

const goToTreehole = () => {
  // 先设置全局标记
  uni.setStorageSync('forumDefaultCategory', 'treehole')
  // 用switchTab跳转到论坛
  uni.switchTab({ url: '/pages/forum/index' })
}

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return ''
  // 检查是否已经是完整的URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  // 拼接完整的URL
  return 'http://127.0.0.1:3000' + imageUrl
}

const goPostDetail = (id) => {
  uni.navigateTo({ url: `/pages/forum/detail?id=${id}` })
}

const goNotifications = () => {
  uni.navigateTo({ url: '/pages/notifications/index' })
}

const goNotificationDetail = (id) => {
  uni.navigateTo({ url: `/pages/notifications/detail?id=${id}` })
}

const onTimelineScroll = (e) => {
  const scrollLeft = e.detail.scrollLeft
  if (scrollLeft > 800) {
    currentYear.value = kaoyanYear
  } else {
    currentYear.value = kaoyanYear - 1
  }
}

const loadNotifications = async () => {
  notificationLoading.value = true
  try {
    const res = await homeApi.getNotifications(1, 3)
    notifications.value = res.data?.list || []
  } catch (e) {
    console.error('加载通知失败:', e)
    notifications.value = []
  } finally {
    notificationLoading.value = false
  }
}

const formatTime = (time) => formatRelativeTime(time)

const loadHotPosts = async () => {
  loading.value = true
  try {
    const res = await forumApi.getPosts({ 
      sort: 'popular',
      page: 1,
      pageSize: 5
    })
    experiencePosts.value = res.data?.list || []
  } catch (e) {
    console.error('加载热门帖子失败:', e)
    experiencePosts.value = []
  } finally {
    loading.value = false
  }
}

const loadAds = async () => {
  try {
    const res = await homeApi.getAds('banner')
    ads.value = res.data || []
  } catch (e) {
    console.error('加载广告失败:', e)
    ads.value = []
  }
}

const loadScreens = async () => {
  try {
    const res = await homeApi.getScreens()
    screens.value = res.data || []
    // 模拟数据，用于测试
    if (screens.value.length === 0) {
      screens.value = [
        {
          id: 1,
          name: '',
          image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=education%20banner%20for%20postgraduate%20exam%20preparation%2C%20students%20studying%2C%20books%2C%20academic%20atmosphere&image_size=landscape_16_9'
        },
        {
          id: 2,
          name: '',
          image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=study%20materials%20banner%2C%20books%2C%20notes%2C%20educational%20supplies&image_size=landscape_16_9'
        },
        {
          id: 3,
          name: '',
          image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=interview%20preparation%20banner%2C%20students%20preparing%20for%20exam%2C%20professional%20setting&image_size=landscape_16_9'
        }
      ]
    }
  } catch (e) {
    console.error('加载大屏失败:', e)
    // 使用模拟数据
    screens.value = [
      {
        id: 1,
        name: '',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=education%20banner%20for%20postgraduate%20exam%20preparation%2C%20students%20studying%2C%20books%2C%20academic%20atmosphere&image_size=landscape_16_9'
      },
      {
        id: 2,
        name: '',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=study%20materials%20banner%2C%20books%2C%20notes%2C%20educational%20supplies&image_size=landscape_16_9'
      },
      {
        id: 3,
        name: '',
        image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=interview%20preparation%20banner%2C%20students%20preparing%20for%20exam%2C%20professional%20setting&image_size=landscape_16_9'
      }
    ]
  }
}

const loadDailyQuote = async () => {
  try {
    // 检查本地存储中的金句和日期
    const storedQuote = uni.getStorageSync('dailyQuote')
    const storedDate = uni.getStorageSync('quoteDate')
    const today = getTimeSeed().toDateString()
    
    // 如果今天已经获取过金句，直接使用存储的金句
    if (storedQuote && storedDate === today) {
      dailyQuote.value = storedQuote
      return
    }
    
    // 从后端获取金句
    const res = await homeApi.getQuote()
    if (res.data?.quote) {
      dailyQuote.value = res.data.quote
      // 存储金句和日期
      uni.setStorageSync('dailyQuote', res.data.quote)
      uni.setStorageSync('quoteDate', today)
    }
  } catch (e) {
    console.error('加载每日金句失败:', e)
    // 使用默认金句
    const defaultQuotes = [
      '坚持就是胜利，考研必胜！',
      '每一份努力都不会白费',
      '今天的付出，明天的收获',
      '考研是一场持久战，坚持到最后',
      '相信自己，你一定可以的！'
    ]
    // 根据日期生成一个固定的索引，确保每天显示相同的金句
    const today = getTimeSeed()
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000)
    const index = dayOfYear % defaultQuotes.length
    dailyQuote.value = defaultQuotes[index]
  }
}

onMounted(() => {
  updateCountdown()
  loadHotPosts()
  loadDailyQuote()
  loadAds()
  loadScreens()
  loadNotifications()
  
  timer = setInterval(updateCountdown, 1000)
  
  setDailyQuoteRefresh()
})

const setDailyQuoteRefresh = () => {
  const now = getTimeSeed()
  const target = new Date(now)
  target.setHours(4, 0, 0, 0)
  
  if (target <= now) {
    // 今天的4点已经过了，设置为明天的4点
    target.setDate(target.getDate() + 1)
  }
  
  const delay = target - now
  setTimeout(() => {
    loadDailyQuote()
    // 每天重复执行
    setInterval(loadDailyQuote, 24 * 60 * 60 * 1000)
  }, delay)
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f8f8f8;
}

/* 顶部状态栏 */
.status-bar {
  background: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.countdown-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.countdown-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.countdown-label {
  font-size: 24rpx;
  color: #666;
  margin-top: 4rpx;
}

.daily-quote {
  flex: 1;
  text-align: center;
  padding: 0 20rpx;
  max-width: 50%;
}

.quote-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.checkin-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: bold;
  margin-left: 20rpx;
}



/* 快捷入口 */
.quick-entry {
  margin: 20rpx 30rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

/* 广告轮播 */
.ad-carousel {
  margin: 20rpx 30rpx;
  padding: 0;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.carousel-swiper {
  width: 100%;
  height: 300rpx;
}

.ad-item {
  position: relative;
  width: 100%;
  height: 100%;
}

.ad-image {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
}

.ad-content {
  position: absolute;
  top: 0;
  left: 0;
  padding: 20rpx;
  background: rgba(0,0,0,0.5);
  border-top-left-radius: 16rpx;
  border-top-right-radius: 16rpx;
}

.ad-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8rpx;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.ad-desc {
  font-size: 20rpx;
  color: rgba(255,255,255,0.8);
}

.entry-scroll {
  width: 100%;
  white-space: nowrap;
}

.entry-grid {
  display: inline-flex;
  gap: 40rpx;
  padding: 10rpx 0;
}

.entry-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 180rpx;
  flex-shrink: 0;
}

.entry-icon {
  font-size: 56rpx;
  margin-bottom: 12rpx;
  position: relative;
}

.entry-icon.hot::before {
  content: 'HOT';
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  color: #fff;
  font-size: 16rpx;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  font-weight: bold;
}

.entry-icon.new::before {
  content: 'NEW';
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #fff;
  font-size: 16rpx;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  font-weight: bold;
}

.entry-label {
  font-size: 24rpx;
  color: #333;
  text-align: center;
}

/* 时间线 */
.timeline-section {
  margin: 0 30rpx 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.timeline-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 30rpx;
}

.timeline-year {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-right: 12rpx;
}

.timeline-label {
  font-size: 24rpx;
  color: #999;
}

.timeline-scroll {
  white-space: nowrap;
  width: 100%;
}

.timeline-bar {
  display: inline-flex;
  align-items: center;
  padding: 0 10rpx;
}

.timeline-period {
  min-width: 200rpx;
  text-align: center;
  margin: 0 20rpx;
}

.period-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.period-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 4rpx;
}

.period-tip {
  font-size: 20rpx;
  color: #999;
  display: block;
}

.timeline-line {
  min-width: 150rpx;
  display: flex;
  align-items: center;
  position: relative;
  margin: 0 10rpx;
}

.timeline-line::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4rpx;
  background: #f0f0f0;
  transform: translateY(-50%);
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #ddd;
  position: relative;
  z-index: 1;
  margin: 0 20rpx;
}

.timeline-dot.active {
  background: #4CAF50;
  width: 24rpx;
  height: 24rpx;
  box-shadow: 0 0 0 8rpx rgba(76, 175, 80, 0.1);
}



/* 热门经验帖 */
.experience-section {
  margin: 0 30rpx 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 24rpx;
  color: #999;
}

.experience-list {
  margin-top: 20rpx;
}

.experience-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.experience-item:last-child {
  border-bottom: none;
}

.post-number {
  font-size: 28rpx;
  font-weight: bold;
  color: #999;
  margin-right: 20rpx;
  min-width: 40rpx;
  text-align: center;
}

.post-number.top-three {
  color: #ff6b6b;
}

.post-title {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-stats {
  display: flex;
  gap: 16rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.stat-item {
  font-size: 22rpx;
  color: #999;
}

/* 通知公告 */
.notification-section {
  margin: 0 30rpx 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.notification-list {
  margin-top: 20rpx;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:active {
  background: #f9f9f9;
}

.notification-title-row {
  flex: 1;
  display: flex;
  align-items: center;
  margin-right: 20rpx;
  overflow: hidden;
}

.top-badge {
  font-size: 18rpx;
  color: #fff;
  background: #ff6b6b;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
  flex-shrink: 0;
}

.notification-title {
  flex: 1;
  font-size: 24rpx;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-title.title-top {
  font-weight: bold;
  color: #ff6b6b;
}

.notification-time {
  font-size: 20rpx;
  color: #999;
  min-width: 120rpx;
  text-align: right;
}

/* 通用样式 */
.card {
  margin: 0 30rpx 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mt-20 {
  margin-top: 20rpx;
}

.mb-20 {
  margin-bottom: 20rpx;
}

.text-primary {
  color: #4CAF50;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.subtitle {
  font-size: 24rpx;
  color: #666;
}

.btn-primary {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: bold;
}

/* 加载状态 */
.loading-state {
  padding: 40rpx 0;
  text-align: center;
  color: #999;
  font-size: 24rpx;
}

/* 空数据状态 */
.empty-state {
  padding: 60rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
  display: block;
}
</style>

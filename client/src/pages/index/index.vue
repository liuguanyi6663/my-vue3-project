<template>
  <view class="page">
    <!-- 页面加载动画 -->
    <view v-if="showPageLoading" class="page-loading-mask">
      <view class="loading-spinner"></view>
    </view>
    
    <!-- 页面内容容器 -->
    <view class="page-content" :class="{'page-content-visible': pageVisible}">
      <!-- 顶部状态栏 -->
      <view class="status-bar">
        <!-- 背景图片 -->
        <image class="status-background" src="/static/顶部背景.jpg" mode="aspectFill"></image>
        <!-- 校徽和学校名称 -->
        <view class="school-logo-title">
          <image class="school-logo" src="/static/sxlglogo.png" mode="aspectFit"></image>
          <view class="school-title">
            <text class="school-name">绍兴理工学院</text>
            <text class="school-english">SHAOXING INSTITUTE OF TECHNOLOGY</text>
          </view>
        </view>
        
        <!-- 倒计时、标语和按钮 -->
        <view class="countdown-quote-actions">
          <view class="countdown-section">
            <text class="countdown-text">{{ countdown.days }}天</text>
            <text class="countdown-label">距{{ kaoyanYear }}考研</text>
          </view>
          <view class="daily-quote">
            <text class="quote-text">{{ dailyQuote }}</text>
          </view>
          <view class="status-actions">
            <text class="checkin-btn" @click="goCheckin">打卡</text>
          </view>
        </view>
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
        <view class="entry-grid">
          <view class="entry-item" @click="navigateToPage('/pages/national-line/index')">
            <image class="entry-icon" src="/static/国家线.png" mode="aspectFit"></image>
            <text class="entry-title">国家线</text>
            <text class="entry-subtitle">查看最新分数线</text>
          </view>
          <view class="entry-item" @click="navigateToPage('/pages/tools/school-websites')">
            <image class="entry-icon" src="/static/学校官网.png" mode="aspectFit"></image>
            <text class="entry-title">学校官网</text>
            <text class="entry-subtitle">了解学校最新资讯</text>
          </view>
          <view class="entry-item" @click="navigateToPage('/pages/data/dashboard')">
            <image class="entry-icon" src="/static/本校考研数据.png" mode="aspectFit"></image>
            <text class="entry-title">本校考研数据</text>
            <text class="entry-subtitle">历年报录分析</text>
          </view>
          <view class="entry-item" @click="navigateToPage('/pages/tools/interview')">
            <image class="entry-icon" src="/static/复试工具箱.png" mode="aspectFit"></image>
            <text class="entry-title">复试工具箱</text>
            <text class="entry-subtitle">面试问题/材料模板</text>
          </view>
          <view class="entry-item" @click="goToTreehole">
            <image class="entry-icon" src="/static/匿名树洞.png" mode="aspectFit"></image>
            <text class="entry-title">匿名树洞</text>
            <text class="entry-subtitle">倾诉心声/互相鼓励</text>
          </view>
          <view class="entry-item" @click="navigateToPage('/pages/tools/score-estimator')">
            <image class="entry-icon" src="/static/成绩估算.jpg" mode="aspectFit"></image>
            <text class="entry-title">成绩估算</text>
            <text class="entry-subtitle">初步预估考研成绩</text>
          </view>
        </view>
      </view>

      <!-- 考研时间线 -->
      <view class="timeline-section card">
        <!-- 背景图片 -->
        <image class="timeline-background" src="/static/时间线背景.jpg" mode="aspectFill"></image>
        <view class="timeline-header">
          <text class="timeline-year">{{ currentYear }}</text>
          <text class="timeline-label">Year</text>
        </view>
        <scroll-view scroll-x class="timeline-scroll" show-scrollbar="false" @scroll="onTimelineScroll" :scroll-left="timelineScrollLeft" scroll-with-animation>
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
              <text class="period-text">3月初</text>，
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
            <text class="notification-icon">🔔</text>
            <text class="notification-title" :class="{ 'title-top': notification.is_top === 1 }">{{ notification.title }}</text>
            <text class="notification-time">{{ formatTime(notification.created_at) }}</text>
          </view>
        </view>
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

      <!-- 底部安全区域 -->
      <view style="height: 120rpx;"></view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { homeApi, studyApi, forumApi } from '@/api/index'
import { getCurrentYear, getKaoyanYear, getKaoyanTargetDate, formatRelativeTime, getTimeSeed } from '@/utils/date'
import { navigateTo, switchTab } from '@/utils/loading.js'
import { addRequestLoadingListener, removeRequestLoadingListener } from '@/api/request.js'

const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
const showPageLoading = ref(false)
const pageVisible = ref(false)
let timer = null
let timelineTimer = null

// 加载状态监听回调
function handleLoadingChange(visible) {
  showPageLoading.value = visible
}

const experiencePosts = ref([])
const loading = ref(false)

const kaoyanYear = getKaoyanYear()
const currentYear = ref(getCurrentYear())
const timelineScrollLeft = ref(0)
const dailyQuote = ref('进德修业')
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

const navigateToPage = (path) => {
  if (path) navigateTo({ url: path })
  else uni.showToast({ title: '功能开发中', icon: 'none' })
}

const switchToTab = (path) => {
  switchTab({ url: path })
}

const goCheckin = () => {
  navigateTo({ url: '/pages/mine/checkin' })
}

const goToTreehole = () => {
  // 先设置全局标记
  uni.setStorageSync('forumDefaultCategory', 'treehole')
  // 用switchTab跳转到论坛
  switchTab({ url: '/pages/forum/index' })
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
  navigateTo({ url: `/pages/forum/detail?id=${id}` })
}

const goNotifications = () => {
  navigateTo({ url: '/pages/notifications/index' })
}

const goNotificationDetail = (id) => {
  navigateTo({ url: `/pages/notifications/detail?id=${id}` })
}

const onTimelineScroll = (e) => {
  const scrollLeft = e.detail.scrollLeft
  if (scrollLeft > 800) {
    currentYear.value = kaoyanYear
  } else {
    currentYear.value = kaoyanYear - 1
  }
}

const getTimelineProgress = (date = new Date()) => {
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (month >= 3 && month <= 6) return 0
  if (month >= 8 && month <= 9) return 1
  if (month === 10) return 2
  if (month === 11) return 3
  if (month === 12) return 4
  if (month === 1 || month === 2) return 5
  if (month === 3 && day <= 10) return 6
  if (month === 3 && day <= 20) return 7
  return 8
}

const syncTimelineWithSystemTime = () => {
  const progress = getTimelineProgress(getTimeSeed())
  const stepWidth = 260
  timelineScrollLeft.value = progress * stepWidth
  currentYear.value = progress <= 4 ? kaoyanYear - 1 : kaoyanYear
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
  // 固定显示"进德修业"
  dailyQuote.value = '进德修业'
}

onMounted(() => {
  // 添加加载状态监听
  addRequestLoadingListener(handleLoadingChange)
  
  updateCountdown()
  syncTimelineWithSystemTime()
  loadHotPosts()
  loadDailyQuote()
  loadAds()
  loadScreens()
  loadNotifications()

  timer = setInterval(updateCountdown, 1000)
  timelineTimer = setInterval(syncTimelineWithSystemTime, 60 * 1000)

  setDailyQuoteRefresh()
  
  // 延迟显示页面内容，实现淡入效果
  setTimeout(() => {
    pageVisible.value = true
  }, 100)
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
  // 移除加载状态监听
  removeRequestLoadingListener(handleLoadingChange)
  
  if (timer) clearInterval(timer)
  if (timelineTimer) clearInterval(timelineTimer)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  transform: translateZ(0);
}

/* 页面内容容器 */
.page-content {
  opacity: 0;
  transition: opacity 0.6s ease-in-out;
}

.page-content-visible {
  opacity: 1;
}

/* 页面切换加载遮罩 */
.page-loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99998;
}

/* 灰色转圈加载动画 */
.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #e0e0e0;
  border-top-color: #999;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 顶部状态栏 */
.status-bar {
  padding: 15rpx 30rpx;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
  overflow: hidden;
}

.status-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.school-logo-title {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 15rpx;
  position: relative;
  z-index: 1;
}

.school-logo {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}

.school-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.school-name {
  font-family: "Xingkai SC", "STXingkai", "华文行楷", "KaiTi", "STKaiti", "楷体", serif;
  font-size: 32rpx;
  font-weight: 500;
  color: #c82020;
  line-height: 1.1;
  letter-spacing: 2rpx;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-shadow: 0 1rpx 2rpx rgba(255,255,255,0.9);
}

.school-english {
  font-family: "Times New Roman", serif;
  font-size: 14rpx;
  font-weight: 400;
  color: #c82020;
  margin-top: 3rpx;
  letter-spacing: 1rpx;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;
  text-shadow: 0 1rpx 2rpx rgba(255,255,255,0.9);
}

.countdown-quote-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.countdown-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.countdown-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #c82020;
  text-shadow: 0 1rpx 2rpx rgba(255,255,255,0.9);
}

.countdown-label {
  font-size: 20rpx;
  color: #555;
  margin-top: 3rpx;
  text-shadow: 0 1rpx 2rpx rgba(255,255,255,0.9);
}

.daily-quote {
  flex: 1;
  text-align: center;
  padding: 0 15rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.quote-text {
  font-size: 24rpx;
  color: #c82020;
  line-height: 1.3;
  text-shadow: 0 1rpx 2rpx rgba(255,255,255,0.9);
  position: relative;
}

/* 左侧短分割线 */
.daily-quote::before {
  content: '';
  width: 30rpx;
  height: 2rpx;
  background: #b0b0b0;
  flex-shrink: 0;
}

/* 右侧短分割线 */
.daily-quote::after {
  content: '';
  width: 30rpx;
  height: 2rpx;
  background: #b0b0b0;
  flex-shrink: 0;
}

.status-actions {
  display: flex;
  gap: 12rpx;
}

.checkin-btn {
  background: #c82020;
  color: #fff;
  padding: 10rpx 18rpx;
  border-radius: 24rpx;
  font-size: 20rpx;
  font-weight: bold;
}



/* 快捷入口 */
.quick-entry {
  margin: 20rpx 30rpx;
  padding: 20rpx;
  border-radius: 8rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

/* 广告轮播 */
.ad-carousel {
  margin: 15rpx 30rpx;
  padding: 0;
  border-radius: 8rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

.carousel-swiper {
  width: 100%;
  height: 240rpx;
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
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
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

.entry-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  padding: 0;
  position: relative;
}

.entry-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 10rpx 0;
}

/* 垂直分割线（在第1、2、4、5个item的右边添加） */
.entry-item:nth-child(3n+1),
.entry-item:nth-child(3n+2) {
  border-right: 1rpx solid #e5e5e5;
}

/* 水平分割线（在第1、2、3个item的下面添加） */
.entry-item:nth-child(-n+3) {
  border-bottom: 1rpx solid #e5e5e5;
}

.entry-icon {
  width: 60rpx;
  height: 60rpx;
  margin-bottom: 6rpx;
}

.entry-title {
  font-size: 20rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 2rpx;
}

.entry-subtitle {
  font-size: 16rpx;
  color: #999;
  text-align: center;
}

/* 时间线 */
.timeline-section {
  margin: 0 30rpx 15rpx;
  padding: 15rpx;
  border-radius: 8rpx;
  background: transparent;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
  position: relative;
  overflow: hidden;
}

.timeline-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.timeline-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 15rpx;
  position: relative;
  z-index: 1;
}

.timeline-year {
  font-size: 42rpx;
  font-weight: bold;
  color: #c82020;
  margin-right: 6rpx;
}

.timeline-label {
  font-size: 22rpx;
  color: #999;
}

.timeline-scroll {
  white-space: nowrap;
  width: 100%;
  position: relative;
  z-index: 1;
}

.timeline-bar {
  display: inline-flex;
  align-items: center;
  padding: 0;
  margin-left: -20rpx;
}

.timeline-period {
  min-width: 240rpx;
  text-align: center;
  margin: 0 15rpx;
}

.period-text {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}

.period-desc {
  font-size: 22rpx;
  color: #666;
  display: block;
  margin-bottom: 4rpx;
}

.period-tip {
  font-size: 18rpx;
  color: #999;
  display: block;
}

.timeline-line {
  min-width: 80rpx;
  display: flex;
  align-items: center;
  position: relative;
  margin: 0 8rpx;
}

.timeline-line::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2rpx;
  background: #eee;
  transform: translateY(-50%);
}

.timeline-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ddd;
  position: relative;
  z-index: 1;
  margin: 0 15rpx;
}

.timeline-dot.active {
  background: #c82020;
  width: 12rpx;
  height: 12rpx;
}



/* 热门经验帖 */
.experience-section {
  margin: 0 30rpx 15rpx;
  padding: 15rpx;
  border-radius: 8rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.section-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 20rpx;
  color: #999;
}

.experience-list {
  margin-top: 10rpx;
}

.experience-item {
  display: flex;
  align-items: center;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.experience-item:last-child {
  border-bottom: none;
}

.post-number {
  font-size: 24rpx;
  font-weight: bold;
  color: #999;
  margin-right: 15rpx;
  min-width: 35rpx;
  text-align: center;
}

.post-number.top-three {
  color: #c82020;
}

.post-title {
  flex: 1;
  font-size: 24rpx;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-stats {
  display: flex;
  gap: 12rpx;
  margin-left: 12rpx;
  flex-shrink: 0;
}

.stat-item {
  font-size: 18rpx;
  color: #999;
}

/* 通知公告 */
.notification-section {
  margin: 0 30rpx 15rpx;
  padding: 15rpx;
  border-radius: 8rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

.notification-list {
  margin-top: 8rpx;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  font-size: 24rpx;
  color: #c82020;
  margin-right: 12rpx;
  flex-shrink: 0;
}

.notification-title {
  flex: 1;
  font-size: 22rpx;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-title.title-top {
  font-weight: bold;
  color: #c82020;
}

.notification-time {
  font-size: 18rpx;
  color: #999;
  min-width: 80rpx;
  text-align: right;
  margin-left: 12rpx;
  flex-shrink: 0;
}

/* 通用样式 */
.card {
  margin: 0 30rpx 20rpx;
  padding: 20rpx;
  border-radius: 8rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
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

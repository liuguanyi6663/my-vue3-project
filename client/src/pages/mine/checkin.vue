<template>
  <view class="page">
    <!-- 统计概览 -->
    <view class="stats-card card">
      <view class="stat-row">
        <view class="stat-item">
          <text class="stat-num">{{ stats.totalDays || 0 }}</text>
          <text class="stat-label">累计打卡</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ stats.currentStreak || 0 }}</text>
          <text class="stat-label">当前连续</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ stats.maxStreak || 0 }}</text>
          <text class="stat-label">最长连续</text>
        </view>
      </view>
    </view>

    <!-- 日历选择 -->
    <view class="calendar-card card">
      <view class="calendar-header">
        <text class="calendar-arrow" @click="changeMonth(-1)">◀</text>
        <text class="calendar-title">{{ currentYear }}年{{ currentMonth }}月</text>
        <text class="calendar-arrow" @click="changeMonth(1)" :class="{ disabled: isCurrentMonth }">▶</text>
      </view>

      <!-- 星期标题 -->
      <view class="week-header">
        <text v-for="day in weekDays" :key="day" class="week-day">{{ day }}</text>
      </view>

      <!-- 日历格子 -->
      <view class="calendar-grid">
        <view 
          v-for="(item, index) in calendarDays" 
          :key="index"
          class="calendar-cell"
          :class="{ 
            'other-month': !item.isCurrentMonth,
            'has-checkin': item.hasCheckin,
            'today': item.isToday,
            'selected': isSelected(item.date)
          }"
          @click="selectDate(item)"
        >
          <text class="cell-date">{{ item.day }}</text>
          <text v-if="item.hasCheckin" class="checkin-check">✓</text>
        </view>
      </view>
    </view>

    <!-- 当日打卡记录 -->
    <view class="record-card card" v-if="selectedDateRecords.length > 0">
      <text class="section-title">{{ selectedDateLabel }} 打卡记录</text>
      
      <view class="record-list">
        <view class="record-item" v-for="(item, index) in selectedDateRecords" :key="index">
          <view class="record-subject" :class="'subject-' + getSubjectColor(item.subject)">
            {{ item.subject }}
          </view>
          <view class="record-info">
            <text class="record-task">{{ item.task_name }}</text>
            <text class="record-time">{{ item.duration || 0 }}分钟</text>
          </view>
          <text class="record-remark" v-if="item.remark">{{ item.remark }}</text>
        </view>
      </view>
    </view>

    <view class="empty-tip card" v-if="selectedDateRecords.length === 0 && selectedDate">
      <text>{{ selectedDate === today ? '今天还没有打卡，加油！' : '当天无打卡记录' }}</text>
      <button v-if="selectedDate === today" class="checkin-btn" @click="checkinToday">立即打卡</button>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { studyApi } from '@/api/index'
import { getTimeSeed, getCurrentYear } from '@/utils/date'

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const today = getTimeSeed().toISOString().split('T')[0]
const currentYear = ref(getCurrentYear())
const currentMonth = ref(getTimeSeed().getMonth() + 1)
const selectedDate = ref(today)
const calendarData = ref({})
const stats = ref({})
const selectedDateRecords = ref([])

const isCurrentMonth = computed(() => {
  const now = getTimeSeed()
  return currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth() + 1
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekDay = firstDay.getDay()
  
  const days = []
  
  // 上月日期
  const prevLastDay = new Date(year, month - 1, 0).getDate()
  for (let i = startWeekDay - 1; i >= 0; i--) {
    const day = prevLastDay - i
    const dateStr = `${year}-${String(month - 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    days.push({
      day,
      date: dateStr,
      isCurrentMonth: false,
      hasCheckin: !!calendarData.value[dateStr],
      isToday: false
    })
  }
  
  // 当月日期
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(i).padStart(2,'0')}`
    days.push({
      day: i,
      date: dateStr,
      isCurrentMonth: true,
      hasCheckin: !!calendarData.value[dateStr],
      isToday: dateStr === today
    })
  }
  
  // 下月日期
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2,'0')}-${String(i).padStart(2,'0')}`
    days.push({
      day: i,
      date: dateStr,
      isCurrentMonth: false,
      hasCheckin: !!calendarData.value[dateStr],
      isToday: false
    })
  }
  
  return days
})

const loadCheckins = async () => {
  try {
    const res = await studyApi.getCheckins(currentYear.value, currentMonth.value)
    
    stats.value = res.data?.stats || {}
    
    calendarData.value = res.data?.calendar || {}
    
    // 检查当天是否已打卡
    const todayCheckin = calendarData.value[today]
    if (todayCheckin) {
      // 当天已打卡，显示记录
      selectedDateRecords.value = [{ subject: '综合', task_name: '今日学习', duration: 60, remark: '每日打卡' }]
    } else {
      // 当天未打卡，显示空状态和打卡按钮
      selectedDateRecords.value = []
    }
  } catch (e) {
    console.error(e)
    // 出错时显示空状态和打卡按钮
    selectedDateRecords.value = []
  }
}

const loadDayRecords = async () => {
  try {
    // 这里可以添加从后端获取当日详细记录的逻辑
    // 暂时使用空数组，因为当前后端API没有提供按日期获取详细记录的接口
    selectedDateRecords.value = []
  } catch (e) {
    console.error('加载当日记录失败:', e)
    selectedDateRecords.value = []
  }
}

const changeMonth = (delta) => {
  let m = currentMonth.value + delta
  let y = currentYear.value
  
  if (m > 12) { m = 1; y++ }
  if (m < 1) { m = 12; y-- }
  
  currentMonth.value = m
  currentYear.value = y
  loadCheckins()
}

const selectDate = (item) => {
  if (!item.isCurrentMonth) return
  selectedDate.value = item.date
  // 加载该日的详细记录
}

const isSelected = (date) => {
  return date === selectedDate.value
}

const getSubjectColor = (subject) => {
  const colors = { '英语': 'blue', '政治': 'red', '数学': 'green' }
  return colors[subject] || 'gray'
}

const checkinToday = async () => {
  try {
    // 检查是否登录
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/login/login' })
      }, 1000)
      return
    }
    
    // 检查当天是否已打卡
    if (calendarData.value[today]) {
      uni.showToast({ title: '今日已打卡', icon: 'none' })
      return
    }
    
    // 调用打卡接口
    const res = await studyApi.checkin({
      subject: '综合',
      task_name: '今日学习',
      duration: 60,
      remark: '每日打卡'
    })
    
    if (res.code === 200) {
      uni.showToast({ title: '打卡成功', icon: 'success' })
      // 直接更新selectedDateRecords，显示打卡记录
      selectedDateRecords.value = [{ subject: '综合', task_name: '今日学习', duration: 60, remark: '每日打卡' }]
      // 重新加载打卡数据，更新日历
      loadCheckins()
    } else if (res.code === 401) {
      uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/login/login' })
      }, 1000)
    } else {
      uni.showToast({ title: res.msg || '打卡失败', icon: 'none' })
    }
  } catch (e) {
    console.error('打卡失败:', e)
    // 如果是业务错误（已有msg），不再重复提示
    if (e.msg || e.code === 500 || e.code === 401) {
      return
    }
    uni.showToast({ title: '网络错误，请检查网络连接', icon: 'none' })
  }
}

watch([currentYear, currentMonth], () => {
  loadCheckins()
})

onMounted(() => {
  loadCheckins()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.stats-card {
  padding: 24rpx;
  margin: 20rpx 24rpx;
}

.stat-row {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #007AFF;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

.calendar-card {
  margin: 20rpx 24rpx;
  padding: 24rpx;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.calendar-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.calendar-arrow {
  font-size: 28rpx;
  color: #007AFF;
  padding: 8rpx;
}

.calendar-arrow.disabled {
  color: #ccc;
}

.week-header {
  display: flex;
  margin-bottom: 10rpx;
}

.week-day {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #999;
  padding: 10rpx 0;
}

.calendar-grid {
  display: flex;
  flex-wrap: wrap;
}

.calendar-cell {
  width: calc(100% / 7);
  height: 80rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.cell-date {
  font-size: 26rpx;
  color: #333;
}

.calendar-cell.other-month .cell-date {
  color: #ccc;
}

.calendar-cell.today .cell-date {
  background: #007AFF;
  color: #fff;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  line-height: 48rpx;
  text-align: center;
}

.checkin-check {
  font-size: 20rpx;
  color: #07c160;
  font-weight: bold;
  position: absolute;
  bottom: 4rpx;
  background: #fff;
  border-radius: 50%;
  width: 24rpx;
  height: 24rpx;
  line-height: 24rpx;
  text-align: center;
  border: 2rpx solid #07c160;
}

.record-card {
  margin: 20rpx 24rpx;
  padding: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.record-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.record-subject {
  display: inline-block;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  color: #fff;
  margin-bottom: 8rpx;
}

.subject-blue { background: #007AFF; }
.subject-red { background: #ff3b30; }
.subject-green { background: #07c160; }
.subject-gray { background: #999; }

.record-task {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.record-time {
  font-size: 24rpx;
  color: #999;
  margin-left: 16rpx;
}

.record-remark {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-top: 6rpx;
  padding-left: 16rpx;
  border-left: 3rpx solid #007AFF;
}

.empty-tip {
  margin: 20rpx 24rpx;
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}

.checkin-btn {
  width: 200rpx;
  height: 80rpx;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin-top: 30rpx;
  line-height: 80rpx;
}
</style>

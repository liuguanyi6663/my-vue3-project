<template>
  <view class="page">
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

    <view class="calendar-card card">
      <view class="calendar-header">
        <text class="calendar-arrow" @click="changeMonth(-1)">◀</text>
        <text class="calendar-title">{{ currentYear }}年{{ currentMonth }}月</text>
        <text class="calendar-arrow" :class="{ disabled: isCurrentMonth }" @click="changeMonth(1)">▶</text>
      </view>

      <view class="week-header">
        <text v-for="day in weekDays" :key="day" class="week-day">{{ day }}</text>
      </view>

      <view class="calendar-grid">
        <view
          v-for="item in calendarDays"
          :key="item.date"
          class="calendar-cell"
          :class="{
            'other-month': !item.isCurrentMonth,
            'has-checkin': item.hasCheckin,
            today: item.isToday,
            selected: isSelected(item.date)
          }"
          @click="selectDate(item)"
        >
          <text class="cell-date">{{ item.day }}</text>
          <view v-if="item.hasCheckin" class="checkin-dot"></view>
        </view>
      </view>
    </view>

    <view v-if="selectedDateRecords.length > 0" class="record-card card">
      <text class="section-title">{{ selectedDateLabel }} 打卡记录</text>

      <view class="record-list">
        <view v-for="(item, index) in selectedDateRecords" :key="index" class="record-item">
          <view class="record-subject" :class="'subject-' + getSubjectColor(item.subject)">
            {{ item.subject }}
          </view>
          <view class="record-info">
            <text class="record-task">{{ item.task_name }}</text>
            <text class="record-time">{{ item.duration || 0 }}分钟</text>
          </view>
          <text v-if="item.remark" class="record-remark">{{ item.remark }}</text>
        </view>
      </view>
    </view>

    <view v-if="selectedDateRecords.length === 0 && selectedDate" class="empty-tip card">
      <text>{{ selectedDate === today ? '今天还没有打卡，加油！' : '当天无打卡记录' }}</text>
      <button v-if="selectedDate === today" class="checkin-btn" @click="checkinToday">立即打卡</button>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { studyApi } from '@/api/index'
import { getTimeSeed, getCurrentYear, formatDate } from '@/utils/date'

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const today = formatDate(getTimeSeed())
const currentYear = ref(getCurrentYear())
const currentMonth = ref(getTimeSeed().getMonth() + 1)
const selectedDate = ref(today)
const calendarData = ref({})
const recordsByDate = ref({})
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

  const prevMonthDate = new Date(year, month - 1, 0)
  const prevMonthLastDay = prevMonthDate.getDate()
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  for (let i = startWeekDay - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    days.push(buildDayCell(day, date, false))
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    days.push(buildDayCell(day, date, true))
  }

  const remaining = 42 - days.length
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  for (let day = 1; day <= remaining; day++) {
    const date = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    days.push(buildDayCell(day, date, false))
  }

  return days
})

const buildDayCell = (day, date, isCurrentMonth) => {
  return {
    day,
    date,
    isCurrentMonth,
    hasCheckin: !!calendarData.value[date],
    isToday: date === today
  }
}

const syncSelectedDateRecords = () => {
  selectedDateRecords.value = recordsByDate.value[selectedDate.value] || []
}

const loadCheckins = async () => {
  try {
    const res = await studyApi.getCheckins(currentYear.value, currentMonth.value)
    stats.value = res.data?.stats || {}
    calendarData.value = res.data?.calendar || {}
    recordsByDate.value = res.data?.recordsByDate || {}
    syncSelectedDateRecords()
  } catch (e) {
    console.error('加载打卡记录失败:', e)
    calendarData.value = {}
    recordsByDate.value = {}
    selectedDateRecords.value = []
  }
}

const changeMonth = (delta) => {
  if (delta > 0 && isCurrentMonth.value) return

  let month = currentMonth.value + delta
  let year = currentYear.value

  if (month > 12) {
    month = 1
    year += 1
  }

  if (month < 1) {
    month = 12
    year -= 1
  }

  currentMonth.value = month
  currentYear.value = year

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
  if (!selectedDate.value.startsWith(monthPrefix)) {
    selectedDate.value = `${monthPrefix}-01`
  }
}

const selectDate = (item) => {
  if (!item.isCurrentMonth) return
  selectedDate.value = item.date
  syncSelectedDateRecords()
}

const isSelected = (date) => date === selectedDate.value

const getSubjectColor = (subject) => {
  const colors = {
    英语: 'blue',
    政治: 'red',
    数学: 'green',
    综合: 'gray'
  }

  return colors[subject] || 'gray'
}

const checkinToday = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/login/login' })
      }, 800)
      return
    }

    if (calendarData.value[today]) {
      uni.showToast({ title: '今日已打卡', icon: 'none' })
      return
    }

    const res = await studyApi.checkin({
      subject: '综合',
      task_name: '今日学习',
      duration: 60,
      remark: '每日打卡'
    })

    if (res.code === 200) {
      uni.showToast({ title: '打卡成功', icon: 'success' })
      selectedDate.value = today
      await loadCheckins()
    } else {
      uni.showToast({ title: res.msg || '打卡失败', icon: 'none' })
    }
  } catch (e) {
    console.error('打卡失败:', e)
    if (e?.msg) return
    uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
  }
}

watch([currentYear, currentMonth], () => {
  loadCheckins()
})

watch(selectedDate, () => {
  syncSelectedDateRecords()
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
  color: #007aff;
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
  color: #007aff;
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
  height: 88rpx;
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
  background: #007aff;
  color: #fff;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  line-height: 48rpx;
  text-align: center;
}

.calendar-cell.selected::after {
  content: '';
  position: absolute;
  inset: 10rpx;
  border: 2rpx solid rgba(0, 122, 255, 0.18);
  border-radius: 18rpx;
  pointer-events: none;
}

.checkin-dot {
  position: absolute;
  bottom: 10rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ff4d4f;
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

.subject-blue {
  background: #007aff;
}

.subject-red {
  background: #ff3b30;
}

.subject-green {
  background: #07c160;
}

.subject-gray {
  background: #999;
}

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
  border-left: 3rpx solid #007aff;
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
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin-top: 30rpx;
  line-height: 80rpx;
}
</style>

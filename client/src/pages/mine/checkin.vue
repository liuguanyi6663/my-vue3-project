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

    <view class="heatmap-card card">
      <view class="heatmap-header">
        <text class="heatmap-title">打卡热力图</text>
      </view>

      <view class="heatmap-body">
        <view class="heatmap-week-labels">
          <text class="hm-wl" v-for="label in hmWeekLabels" :key="label">{{ label }}</text>
        </view>
        <scroll-view
          scroll-x
          class="heatmap-scroll"
          show-scrollbar="false"
          :scroll-left="hmScrollLeft"
          scroll-with-animation
        >
          <view class="heatmap-scroll-inner">
            <view class="hm-month-row">
              <text
                v-for="(m, i) in hmMonths"
                :key="i"
                class="hm-month-text"
                :style="{ width: m.width + 'rpx' }"
              >{{ m.label }}</text>
            </view>
            <view class="hm-grid">
              <view v-for="(col, cIdx) in hmGrid" :key="cIdx" class="hm-col">
                <view
                  v-for="(cell, rIdx) in col"
                  :key="rIdx"
                  class="hm-cell"
                  :class="{ 'hm-cell-today': cell.isToday }"
                  :style="{ background: hmColor(cell) }"
                  @click="hmTap(cell)"
                ></view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="heatmap-footer">
        <text class="hm-footer-text">{{ heatmapRangeLabel }}</text>
        <view class="hm-legend">
          <text class="hm-legend-text">Less</text>
          <view class="hm-legend-block" style="background:#ebedf0;"></view>
          <view class="hm-legend-block" style="background:#9be9a8;"></view>
          <view class="hm-legend-block" style="background:#40c463;"></view>
          <view class="hm-legend-block" style="background:#30a14e;"></view>
          <view class="hm-legend-block" style="background:#216e39;"></view>
          <text class="hm-legend-text">More</text>
        </view>
      </view>

      <view v-if="hmTip" class="hm-tip">
        <text class="hm-tip-text">{{ hmTip }}</text>
      </view>
    </view>

    <view class="mood-trend-card card" v-if="moodTrendData.some(t => t.mood)">
      <view class="mood-trend-header">
        <text class="section-title">备考心情曲线</text>
        <text class="mood-trend-sub">近30天</text>
      </view>
      <view class="mood-chart">
        <view class="mood-y-axis">
          <text class="mood-y-label">😊</text>
          <text class="mood-y-label">😌</text>
          <text class="mood-y-label">😫</text>
          <text class="mood-y-label">😢</text>
        </view>
        <view class="mood-chart-body">
          <view class="mood-grid-lines">
            <view class="mood-grid-line" style="top:0%"></view>
            <view class="mood-grid-line" style="top:33.3%"></view>
            <view class="mood-grid-line" style="top:66.6%"></view>
            <view class="mood-grid-line" style="top:100%"></view>
          </view>
          <view class="mood-points">
            <view
              v-for="(item, idx) in moodTrendData"
              :key="idx"
              class="mood-point-wrap"
              :style="{ left: (idx / 29) * 100 + '%' }"
            >
              <view
                v-if="item.mood"
                class="mood-point"
                :style="{ bottom: ((item.score - 1) / 4) * 100 + '%', background: moodPointColor(item.mood) }"
              >
                <text class="mood-point-emoji">{{ item.emoji }}</text>
              </view>
            </view>
          </view>
          <view class="mood-x-axis">
            <text class="mood-x-label">{{ moodTrendData[0] ? moodTrendData[0].date.slice(5) : '' }}</text>
            <text class="mood-x-label">{{ moodTrendData[14] ? moodTrendData[14].date.slice(5) : '' }}</text>
            <text class="mood-x-label">{{ moodTrendData[29] ? moodTrendData[29].date.slice(5) : '' }}</text>
          </view>
        </view>
      </view>
      <view v-if="comfortQuote" class="comfort-banner" @click="refreshComfort">
        <text class="comfort-text">{{ comfortQuote }}</text>
        <text class="comfort-hint">点击换一条</text>
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
          <view v-if="item.moodEmoji" class="mood-emoji-cell">{{ item.moodEmoji }}</view>
          <view v-else-if="item.hasCheckin" class="checkin-dot"></view>
        </view>
      </view>
    </view>

    <view v-if="selectedDateInfo" class="record-card card">
      <view class="record-header">
        <text class="section-title">{{ selectedDateLabel }} 打卡状态</text>
        <text v-if="selectedDateInfo.streak > 0" class="streak-badge">连续 {{ selectedDateInfo.streak }} 天</text>
      </view>
      <view v-if="selectedDateInfo.checked" class="record-info">
        <text class="record-status checked">已打卡</text>
        <text class="record-streak">当日连续第 {{ selectedDateInfo.streak }} 天</text>
        <text v-if="selectedDateInfo.moodEmoji" class="record-mood">{{ selectedDateInfo.moodEmoji }} {{ selectedDateInfo.moodLabel }}</text>
        <text v-else class="record-mood-unset">未记录心情</text>
      </view>
      <view v-else class="record-info">
        <text class="record-status unchecked">未打卡</text>
      </view>
      <view v-if="selectedDateInfo.isToday" class="record-actions">
        <button
          v-if="!selectedDateInfo.checked"
          class="checkin-btn"
          @click="showMoodPicker('checkin')"
        >
          立即打卡
        </button>
        <button
          v-if="selectedDateInfo.checked"
          class="mood-btn"
          @click="showMoodPicker('update')"
        >
          {{ selectedDateInfo.moodEmoji ? '更新心情' : '记录心情' }}
        </button>
        <button
          v-if="selectedDateInfo.checked"
          class="cancel-btn"
          @click="cancelCheckin"
        >
          取消打卡
        </button>
      </view>
    </view>

    <view v-if="moodPickerVisible" class="mood-picker-mask" @click="moodPickerVisible = false">
      <view class="mood-picker" @click.stop>
        <text class="mood-picker-title">{{ moodPickerMode === 'checkin' ? '今天心情如何？' : '更新今天的心情' }}</text>
        <view class="mood-options">
          <view
            v-for="item in moodOptions"
            :key="item.value"
            class="mood-option"
            :class="{ active: selectedMood === item.value }"
            @click="selectedMood = item.value"
          >
            <text class="mood-option-emoji">{{ item.emoji }}</text>
            <text class="mood-option-label">{{ item.label }}</text>
          </view>
        </view>
        <button class="mood-confirm-btn" @click="confirmMood">{{ moodPickerMode === 'checkin' ? '确认打卡' : '确认更新' }}</button>
      </view>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { getTimeSeed, formatDate } from '@/utils/date'
import { studyApi } from '@/api'

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const today = formatDate(getTimeSeed())
const currentYear = ref(getTimeSeed().getFullYear())
const currentMonth = ref(getTimeSeed().getMonth() + 1)
const selectedDate = ref(today)

const moodOptions = [
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'calm', emoji: '😌', label: '平静' },
  { value: 'anxious', emoji: '😰', label: '焦虑' },
  { value: 'tired', emoji: '😫', label: '疲惫' },
  { value: 'sad', emoji: '😢', label: '低落' }
]

const moodEmojiMap = { happy: '😊', calm: '😌', anxious: '😰', tired: '😫', sad: '😢' }
const moodLabelMap = { happy: '开心', calm: '平静', anxious: '焦虑', tired: '疲惫', sad: '低落' }
const moodScoreMap = { happy: 5, calm: 4, anxious: 2, tired: 2, sad: 1 }

const moodPickerVisible = ref(false)
const selectedMood = ref('calm')
const moodPickerMode = ref('checkin')

const moodTrendData = ref([])
const comfortQuote = ref('')

const hmWeekLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const hmGrid = ref([])
const hmMonths = ref([])
const hmTip = ref('')
const hmScrollLeft = ref(9999)
const hmRangeLabel = ref('')

const CELL_RPX = 22
const GAP_RPX = 3
const COL_RPX = CELL_RPX + GAP_RPX

const calendarData = ref({})
const stats = ref({ totalDays: 0, currentStreak: 0, maxStreak: 0 })
const heatmapData = ref({})

const loadCheckins = async () => {
  try {
    const res = await studyApi.getCheckins(currentYear.value, currentMonth.value)
    if (res.code === 200) {
      calendarData.value = res.data.calendar || {}
      stats.value = res.data.stats || { totalDays: 0, currentStreak: 0, maxStreak: 0 }
    }
  } catch (e) {
    console.error('加载打卡数据失败', e)
  }
}

const loadHeatmap = async () => {
  try {
    const res = await studyApi.getHeatmap()
    if (res.code === 200) {
      heatmapData.value = res.data.heatmap || {}
      hmBuildGrid()
    }
  } catch (e) {
    console.error('加载热力图失败', e)
  }
}

const loadMoodTrend = async () => {
  try {
    const res = await studyApi.getMoodTrend()
    if (res.code === 200) {
      moodTrendData.value = res.data.trend || []
      if (res.data.needComfort && res.data.comfortQuote) {
        comfortQuote.value = res.data.comfortQuote
      } else {
        comfortQuote.value = ''
      }
    }
  } catch (e) {
    console.error('加载心情趋势失败', e)
  }
}

const isChecked = (dateStr) => {
  const entry = calendarData.value[dateStr]
  return entry ? (entry.count > 0) : false
}

const getMood = (dateStr) => {
  const entry = calendarData.value[dateStr]
  return entry ? entry.mood : null
}

const getStreakAt = (dateStr) => {
  if (!isChecked(dateStr)) return 0
  let streak = 1
  const d = new Date(dateStr)
  while (true) {
    d.setDate(d.getDate() - 1)
    const prev = formatDate(d)
    if (isChecked(prev)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

const hmBuildGrid = () => {
  const now = getTimeSeed()
  const todayStr = formatDate(now)

  const currentSunday = new Date(now.getTime() - now.getDay() * 86400000)
  const startSunday = new Date(currentSunday.getTime() - 52 * 7 * 86400000)

  const totalWeeks = 53
  const grid = []
  const monthStartWeeks = new Map()

  const cursor = new Date(startSunday)

  for (let w = 0; w < totalWeeks; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const dateStr = formatDate(cursor)
      const isFuture = dateStr > todayStr
      const hmEntry = heatmapData.value[dateStr]
      const count = hmEntry ? hmEntry.count : 0

      if (cursor.getDate() === 1 && !monthStartWeeks.has(w)) {
        monthStartWeeks.set(w, cursor.getMonth())
      }

      col.push({
        date: dateStr,
        count,
        isFuture,
        isToday: dateStr === todayStr
      })

      cursor.setDate(cursor.getDate() + 1)
    }
    grid.push(col)
  }

  if (!monthStartWeeks.has(0)) {
    monthStartWeeks.set(0, startSunday.getMonth())
  }

  hmGrid.value = grid

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const sorted = Array.from(monthStartWeeks.entries()).sort((a, b) => a[0] - b[0])
  const months = []

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]
    const nextWeek = i + 1 < sorted.length ? sorted[i + 1][0] : totalWeeks
    const spanWeeks = nextWeek - cur[0]
    months.push({
      label: monthNames[cur[1]],
      width: spanWeeks * COL_RPX
    })
  }

  hmMonths.value = months

  const sy = startSunday.getFullYear()
  const sm = startSunday.getMonth() + 1
  const ey = now.getFullYear()
  const em = now.getMonth() + 1
  hmRangeLabel.value = `${sy}年${sm}月 - ${ey}年${em}月`

  nextTick(() => {
    const totalWidth = totalWeeks * COL_RPX
    hmScrollLeft.value = totalWidth
  })
}

const hmColor = (cell) => {
  if (cell.isFuture) return 'transparent'
  if (cell.count === 0) return '#ebedf0'
  if (cell.count === 1) return '#9be9a8'
  if (cell.count === 2) return '#40c463'
  if (cell.count >= 3 && cell.count < 5) return '#30a14e'
  return '#216e39'
}

const hmTap = (cell) => {
  if (cell.isFuture) return
  const d = new Date(cell.date)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const mood = getMood(cell.date)
  const moodStr = mood ? ` ${moodEmojiMap[mood]}${moodLabelMap[mood]}` : ''

  if (cell.count > 0) {
    const hmEntry = heatmapData.value[cell.date]
    const duration = hmEntry ? hmEntry.duration : 0
    hmTip.value = `${m}月${day}日：打卡 ${cell.count} 次，学习 ${duration} 分钟${moodStr}`
  } else {
    hmTip.value = `${m}月${day}日：未打卡`
  }
}

const showMoodPicker = (mode) => {
  moodPickerMode.value = mode || 'checkin'
  const currentMood = getMood(today)
  selectedMood.value = currentMood || 'calm'
  moodPickerVisible.value = true
}

const confirmMood = async () => {
  try {
    if (moodPickerMode.value === 'checkin') {
      const res = await studyApi.checkin({ mood: selectedMood.value })
      if (res.code === 200) {
        moodPickerVisible.value = false
        uni.showToast({ title: '打卡成功', icon: 'success' })
        await Promise.all([loadCheckins(), loadHeatmap(), loadMoodTrend()])
      } else {
        uni.showToast({ title: res.msg || '打卡失败', icon: 'none' })
      }
    } else {
      const res = await studyApi.updateMood({ mood: selectedMood.value })
      if (res.code === 200) {
        moodPickerVisible.value = false
        uni.showToast({ title: '心情已更新', icon: 'success' })
        await Promise.all([loadCheckins(), loadHeatmap(), loadMoodTrend()])
      } else {
        uni.showToast({ title: res.msg || '更新失败', icon: 'none' })
      }
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const cancelCheckin = async () => {
  try {
    const res = await studyApi.deleteCheckin()
    if (res.code === 200) {
      uni.showToast({ title: '已取消打卡', icon: 'none' })
      await Promise.all([loadCheckins(), loadHeatmap(), loadMoodTrend()])
    } else {
      uni.showToast({ title: res.msg || '取消失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '取消失败', icon: 'none' })
  }
}

const comfortQuotes = [
  '每一次焦虑都是成长的前奏，你比想象中更坚强 💪',
  '休息不是放弃，是为了走更远的路 🌈',
  '你已经很努力了，给自己一个拥抱吧 🤗',
  '考研路上，你不是一个人在战斗 🌟',
  '今天的疲惫，是明天上岸的基石 🏔️',
  '允许自己偶尔低落，但别忘了抬头看星空 ✨',
  '坚持到现在的你，已经赢过了大多数人 🏆'
]

const refreshComfort = () => {
  comfortQuote.value = comfortQuotes[Math.floor(Math.random() * comfortQuotes.length)]
}

const moodPointColor = (mood) => {
  const colorMap = {
    happy: '#52c41a',
    calm: '#1890ff',
    anxious: '#fa8c16',
    tired: '#faad14',
    sad: '#ff4d4f'
  }
  return colorMap[mood] || '#ccc'
}

const isCurrentMonth = computed(() => {
  const now = getTimeSeed()
  return currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth() + 1
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const selectedDateInfo = computed(() => {
  if (!selectedDate.value) return null
  const checked = isChecked(selectedDate.value)
  const mood = getMood(selectedDate.value)
  return {
    date: selectedDate.value,
    checked,
    streak: checked ? getStreakAt(selectedDate.value) : 0,
    isToday: selectedDate.value === today,
    mood,
    moodEmoji: mood ? moodEmojiMap[mood] : '',
    moodLabel: mood ? moodLabelMap[mood] : ''
  }
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
  const mood = getMood(date)
  return {
    day,
    date,
    isCurrentMonth,
    hasCheckin: isChecked(date),
    isToday: date === today,
    moodEmoji: mood ? moodEmojiMap[mood] : ''
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
  selectedDate.value = item.date
}

const isSelected = (date) => date === selectedDate.value

watch([currentYear, currentMonth], () => {
  loadCheckins()
})

onMounted(() => {
  loadCheckins()
  loadHeatmap()
  loadMoodTrend()
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

/* ========== 热力图 ========== */
.heatmap-card {
  margin: 20rpx 24rpx;
  padding: 24rpx;
}

.heatmap-header {
  margin-bottom: 16rpx;
}

.heatmap-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.heatmap-body {
  display: flex;
}

.heatmap-week-labels {
  display: flex;
  flex-direction: column;
  margin-right: 4rpx;
  flex-shrink: 0;
  padding-top: 24rpx;
}

.hm-wl {
  font-size: 14rpx;
  color: #767676;
  height: 22rpx;
  line-height: 22rpx;
  margin-bottom: 3rpx;
  text-align: right;
  width: 36rpx;
}

.heatmap-scroll {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
}

.heatmap-scroll-inner {
  display: inline-flex;
  flex-direction: column;
}

.hm-month-row {
  display: flex;
  height: 22rpx;
  margin-bottom: 3rpx;
}

.hm-month-text {
  font-size: 14rpx;
  color: #767676;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-grid {
  display: flex;
}

.hm-col {
  display: flex;
  flex-direction: column;
  margin-right: 3rpx;
}

.hm-col:last-child {
  margin-right: 0;
}

.hm-cell {
  width: 22rpx;
  height: 22rpx;
  border-radius: 3rpx;
  margin-bottom: 3rpx;
}

.hm-cell:last-child {
  margin-bottom: 0;
}

.hm-cell-today {
  box-shadow: 0 0 0 2rpx #007aff;
}

.heatmap-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.hm-footer-text {
  font-size: 20rpx;
  color: #999;
}

.hm-tip {
  margin-top: 12rpx;
  padding: 8rpx 16rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.hm-tip-text {
  font-size: 22rpx;
  color: #666;
}

.hm-legend {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.hm-legend-text {
  font-size: 14rpx;
  color: #767676;
}

.hm-legend-block {
  width: 16rpx;
  height: 16rpx;
  border-radius: 3rpx;
}

/* ========== 心情趋势图 ========== */
.mood-trend-card {
  margin: 20rpx 24rpx;
  padding: 24rpx;
}

.mood-trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.mood-trend-sub {
  font-size: 22rpx;
  color: #999;
}

.mood-chart {
  display: flex;
  height: 240rpx;
}

.mood-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 12rpx;
  flex-shrink: 0;
  height: 200rpx;
}

.mood-y-label {
  font-size: 20rpx;
  line-height: 1;
}

.mood-chart-body {
  flex: 1;
  position: relative;
  height: 200rpx;
}

.mood-grid-lines {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.mood-grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1rpx;
  background: #f0f0f0;
}

.mood-points {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.mood-point-wrap {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
}

.mood-point {
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mood-point-emoji {
  font-size: 18rpx;
  line-height: 1;
}

.mood-x-axis {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -28rpx;
  display: flex;
  justify-content: space-between;
}

.mood-x-label {
  font-size: 18rpx;
  color: #999;
}

.comfort-banner {
  margin-top: 24rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #fff7e6, #fff1f0);
  border-radius: 16rpx;
  border: 1rpx solid #ffe7ba;
}

.comfort-text {
  font-size: 26rpx;
  color: #ad6800;
  line-height: 1.6;
  display: block;
}

.comfort-hint {
  font-size: 20rpx;
  color: #d48806;
  margin-top: 8rpx;
  display: block;
  text-align: right;
}

/* ========== 月历 ========== */
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

.mood-emoji-cell {
  position: absolute;
  bottom: 4rpx;
  font-size: 18rpx;
  line-height: 1;
}

/* ========== 打卡详情 ========== */
.record-card {
  margin: 20rpx 24rpx;
  padding: 24rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.streak-badge {
  font-size: 22rpx;
  color: #fff;
  background: #07c160;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}

.record-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.record-status {
  font-size: 28rpx;
  font-weight: bold;
}

.record-status.checked {
  color: #07c160;
}

.record-status.unchecked {
  color: #999;
}

.record-streak {
  font-size: 24rpx;
  color: #666;
}

.record-mood {
  font-size: 24rpx;
  color: #666;
}

.record-mood-unset {
  font-size: 24rpx;
  color: #fa8c16;
}

.record-actions {
  display: flex;
  gap: 16rpx;
}

.checkin-btn {
  flex: 1;
  height: 80rpx;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  line-height: 80rpx;
}

.mood-btn {
  flex: 1;
  height: 80rpx;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  line-height: 80rpx;
}

.cancel-btn {
  flex: 1;
  height: 80rpx;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  line-height: 80rpx;
}

.checkin-btn.checked-btn {
  background: #ff4d4f;
}

/* ========== 心情选择弹窗 ========== */
.mood-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.mood-picker {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
}

.mood-picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  display: block;
  margin-bottom: 32rpx;
}

.mood-options {
  display: flex;
  justify-content: space-around;
  margin-bottom: 36rpx;
}

.mood-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 8rpx;
  border-radius: 16rpx;
  border: 3rpx solid transparent;
  transition: all 0.2s;
}

.mood-option.active {
  border-color: #007aff;
  background: #f0f7ff;
}

.mood-option-emoji {
  font-size: 48rpx;
  display: block;
  margin-bottom: 8rpx;
}

.mood-option-label {
  font-size: 22rpx;
  color: #666;
  display: block;
}

.mood-option.active .mood-option-label {
  color: #007aff;
  font-weight: bold;
}

.mood-confirm-btn {
  width: 100%;
  height: 80rpx;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  line-height: 80rpx;
}
</style>

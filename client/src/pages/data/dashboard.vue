<template>
  <view class="page">
    <!-- 顶部操作栏 -->
    <view class="top-actions">
      <view class="action-btn record-btn" @click="goToRecord">
        <text class="action-icon">📝</text>
        <text class="action-text">录入/修改我的考研信息</text>
      </view>
    </view>

    <!-- 年份选择 -->
    <view class="year-selector card">
      <scroll-view scroll-x class="year-scroll">
        <view class="year-list">
          <text
            v-for="(y, index) in years" :key="index"
            class="year-item"
            :class="{ active: currentYear === y }"
            @click="changeYear(y)"
          >{{ y }}年</text>
        </view>
      </scroll-view>
    </view>

    <!-- 全校概览 -->
    <view class="card overview-card">
      <text class="section-title">全校概况</text>

      <view class="stats-grid">
        <view class="stat-box primary">
          <text class="stat-value">{{ data.totalApplicants || 0 }}</text>
          <text class="stat-label">报名人数</text>
        </view>
        <view class="stat-box success">
          <text class="stat-value">{{ data.totalAdmitted || 0 }}</text>
          <text class="stat-label">上岸人数</text>
        </view>
        <view class="stat-box warning">
          <text class="stat-value">{{ data.admissionRate || 0 }}%</text>
          <text class="stat-label">上岸率</text>
        </view>
        <view class="stat-box info">
          <text class="stat-value">{{ data.crossRate || 0 }}%</text>
          <text class="stat-label">跨考率</text>
        </view>
      </view>
    </view>

    <!-- 近五年上岸率趋势 - 折线图 -->
    <view class="card chart-card" v-if="data.fiveYearTrend?.length">
      <text class="section-title">近五年上岸率趋势</text>
      <view class="line-chart">
        <!-- Y轴 -->
        <view class="chart-y-axis">
          <text class="y-label">{{ yMaxLabel }}%</text>
          <text class="y-label">{{ Math.round(yMaxValue * 0.75) }}%</text>
          <text class="y-label">{{ Math.round(yMaxValue * 0.5) }}%</text>
          <text class="y-label">{{ Math.round(yMaxValue * 0.25) }}%</text>
          <text class="y-label">0%</text>
        </view>
        <!-- 图表区域 -->
        <view class="chart-area">
          <!-- 网格线 -->
          <view class="grid-lines">
            <view class="grid-line"></view>
            <view class="grid-line"></view>
            <view class="grid-line"></view>
            <view class="grid-line"></view>
            <view class="grid-line"></view>
          </view>
          <!-- 折线 - SVG实现 -->
          <view class="line-container">
            <!-- SVG画布 -->
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <!-- 折线 -->
              <polyline
                :points="linePoints"
                fill="none"
                stroke="#c53030"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></polyline>
            </svg>
            <!-- 叠加的数据点 -->
            <view class="overlay-dots">
              <view
                v-for="(point, index) in lineDataPoints"
                :key="'overlay-' + index"
                class="overlay-dot"
                :style="{
                  left: point.x + '%',
                  top: point.y + '%'
                }"
              ></view>
            </view>
          </view>
          <!-- X轴标签 -->
          <view class="x-labels">
            <text
              v-for="(item, index) in data.fiveYearTrend"
              :key="index"
              class="x-label"
            >{{ item.year }}届</text>
          </view>
        </view>
      </view>
      <!-- 数据标签 -->
      <view class="trend-labels">
        <view
          v-for="(item, index) in data.fiveYearTrend"
          :key="index"
          class="trend-label-item"
        >
          <text class="trend-rate">{{ item.admission_rate }}%</text>
        </view>
      </view>
    </view>

    <!-- 录取院校层次分布 - 饼状图 -->
    <view class="card chart-card" v-if="data.schoolLevels?.length">
      <text class="section-title">录取院校层次分布</text>
      <view class="pie-chart-container">
        <view class="pie-chart">
          <view
            class="pie-circle"
            :style="pieStyle"
          ></view>
          <view class="pie-center">
            <text class="pie-total">{{ totalAdmittedCount }}</text>
            <text class="pie-total-label">上岸总数</text>
          </view>
        </view>
        <view class="pie-legend">
          <view
            v-for="(item, index) in data.schoolLevels"
            :key="index"
            class="legend-item"
          >
            <view class="legend-dot" :style="{ background: pieColors[index % pieColors.length] }"></view>
            <text class="legend-name">{{ item.level }}</text>
            <text class="legend-value">{{ item.count }}人</text>
            <text class="legend-percent">{{ getPiePercent(item.count) }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 各分院上岸人数 - 水平条形图 -->
    <view class="card chart-card" v-if="data.colleges?.length">
      <text class="section-title">各分院上岸人数</text>
      <view class="bar-chart">
        <view
          v-for="(college, index) in topColleges"
          :key="index"
          class="bar-row"
        >
          <text class="bar-name">{{ college.college }}</text>
          <view class="bar-track">
            <view
              class="bar-fill"
              :style="{
                width: (college.admitted / maxAdmitted * 100) + '%',
                background: barColors[index % barColors.length]
              }"
            ></view>
          </view>
          <text class="bar-value">{{ college.admitted }}人</text>
        </view>
      </view>
    </view>

    <!-- 各学院数据列表 -->
    <view class="card college-card" v-if="data.colleges?.length">
      <text class="section-title">各学院详细数据</text>

      <view class="college-list">
        <view
          v-for="(college, index) in data.colleges"
          :key="index"
          class="college-item"
          @click="showCollegeDetail(college)"
        >
          <view class="college-header">
            <text class="college-name">{{ college.college }}</text>
            <text class="college-rate" :class="getRateClass(college.admissionRate)">
              上岸率 {{ college.admissionRate || 0 }}%
            </text>
          </view>

          <view class="college-stats">
            <view class="mini-stat">
              <text class="mini-num">{{ college.applicants || 0 }}</text>
              <text class="mini-label">报名</text>
            </view>
            <view class="mini-stat">
              <text class="mini-num">{{ college.admitted || 0 }}</text>
              <text class="mini-label">上岸</text>
            </view>
            <view class="mini-stat">
              <text class="mini-num">{{ college.cross || 0 }}</text>
              <text class="mini-label">跨考</text>
            </view>
          </view>

          <view class="rate-bar-wrap">
            <view class="rate-bar" :style="{ width: (college.admissionRate || 0) + '%' }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 数据说明 -->
    <view class="card notice-card">
      <text class="notice-title">📊 数据说明</text>
      <text class="notice-text">数据来源于学校官方统计及各学院上报，仅供参考。具体以当年实际录取情况为准。</text>
      <text class="notice-text">如发现数据有误，请联系管理员修正。</text>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { adminApi, recordApi } from '@/api/index'
import { getRecentYears, getCurrentYear } from '@/utils/date'

const currentYear = ref(getCurrentYear())
const years = ref([])
const data = ref({})
const hasRecord = ref(false)
const myRecord = ref(null)

const pieColors = ['#c53030', '#ed8936', '#38a169', '#3182ce', '#805ad5', '#d69e2e']
const barColors = [
  'linear-gradient(90deg, #c53030, #e53e3e)',
  'linear-gradient(90deg, #dd6b20, #ed8936)',
  'linear-gradient(90deg, #38a169, #48bb78)',
  'linear-gradient(90deg, #3182ce, #4299e1)',
  'linear-gradient(90deg, #805ad5, #9f7aea)',
  'linear-gradient(90deg, #d69e2e, #ecc94b)',
  'linear-gradient(90deg, #e53e3e, #fc8181)',
  'linear-gradient(90deg, #319795, #38b2ac)'
]

const loadData = async () => {
  try {
    uni.showLoading({ title: '加载中...' })

    // 同时从两个数据源获取数据
    let officialRes, studentRes
    try {
      officialRes = await adminApi.getKaoyanData({ year: currentYear.value })
    } catch (e) {
      officialRes = { data: null }
    }
    try {
      studentRes = await recordApi.getPublicSummary({ year: currentYear.value })
    } catch (e) {
      studentRes = { data: null }
    }

    const officialData = officialRes?.data || {}
    const studentData = studentRes?.data || {}

    // 合并官方数据和学生录入数据
    const officialTotal = officialData.totalApplicants || 0
    const officialAdmitted = officialData.totalAdmitted || 0
    const officialCross = officialData.crossMajorCount || 0

    const studentTotal = studentData.total?.total_count || 0
    const studentAdmitted = studentData.total?.admitted_count || 0
    const studentCross = studentData.total?.cross_count || 0

    const totalApplicants = officialTotal + studentTotal
    const totalAdmitted = officialAdmitted + studentAdmitted
    const crossMajorCount = officialCross + studentCross

    const admissionRate = totalApplicants > 0 ? ((totalAdmitted / totalApplicants) * 100).toFixed(2) : 0
    const crossRate = totalApplicants > 0 ? ((crossMajorCount / totalApplicants) * 100).toFixed(2) : 0

    // 合并分院数据
    const colleges = []
    const collegeMap = new Map()

    // 先添加官方数据
    if (officialData.colleges) {
      officialData.colleges.forEach(c => {
        collegeMap.set(c.college, {
          college: c.college,
          applicants: c.applicants || 0,
          admitted: c.admitted || 0,
          cross: c.cross || 0
        })
      })
    }

    // 再合并学生录入数据（按隶属分院统计）
    if (studentData.colleges) {
      studentData.colleges.forEach(c => {
        const existing = collegeMap.get(c.college)
        if (existing) {
          existing.applicants += c.count || 0
          existing.admitted += c.admitted_count || 0
        } else {
          collegeMap.set(c.college, {
            college: c.college,
            applicants: c.count || 0,
            admitted: c.admitted_count || 0,
            cross: 0
          })
        }
      })
    }

    collegeMap.forEach(c => {
      colleges.push({
        ...c,
        admissionRate: c.applicants > 0 ? ((c.admitted / c.applicants) * 100).toFixed(2) : 0,
        crossRate: c.applicants > 0 ? ((c.cross / c.applicants) * 100).toFixed(2) : 0
      })
    })

    // 合并趋势数据（官方 + 学生）
    const trendMap = new Map()

    if (officialData.trend) {
      officialData.trend.forEach(t => {
        trendMap.set(parseInt(t.year), {
          year: parseInt(t.year),
          applicants: t.applicants || 0,
          admitted: t.admitted || 0,
          cross: t.cross || 0
        })
      })
    }

    // 合并学生趋势数据
    if (studentData.fiveYearTrend) {
      studentData.fiveYearTrend.forEach(t => {
        const year = parseInt(t.year)
        const existing = trendMap.get(year)
        if (existing) {
          existing.applicants += t.total_count || 0
          existing.admitted += t.admitted_count || 0
        } else {
          trendMap.set(year, {
            year: year,
            applicants: t.total_count || 0,
            admitted: t.admitted_count || 0,
            cross: 0
          })
        }
      })
    }

    // 转换为数组并排序
    const trend = Array.from(trendMap.values()).sort((a, b) => a.year - b.year)
    // 补充缺失年份
    const minYear = currentYear.value - 4
    const maxYear = currentYear.value
    const fullTrend = []
    for (let y = minYear; y <= maxYear; y++) {
      const found = trend.find(t => t.year === y)
      if (found) {
        fullTrend.push({
          ...found,
          admission_rate: found.applicants > 0 ? ((found.admitted / found.applicants) * 100).toFixed(1) : 0
        })
      } else {
        fullTrend.push({ year: y, applicants: 0, admitted: 0, cross: 0, admission_rate: 0 })
      }
    }

    // 生成最终数据
    data.value = {
      year: currentYear.value,
      totalApplicants,
      totalAdmitted,
      admissionRate: parseFloat(admissionRate),
      crossMajorCount,
      crossRate: parseFloat(crossRate),
      colleges: colleges.sort((a, b) => b.admitted - a.admitted),
      trend: officialData.trend || [],
      fiveYearTrend: fullTrend,
      schoolLevels: studentData.schoolLevels || []
    }

    // 生成年份选项
    if (!years.value.length) {
      years.value = getRecentYears(4)
    }

    // 检查当前用户是否已有考研记录
    await checkMyRecord()

    uni.hideLoading()
  } catch (e) {
    uni.hideLoading()
    console.error(e)
  }
}

const checkMyRecord = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      hasRecord.value = false
      return
    }
    const res = await recordApi.getMyRecords()
    if (res.code === 200 && res.data && res.data.length > 0) {
      // 查找当前年份的记录
      const currentRecord = res.data.find(r => r.exam_year == currentYear.value)
      if (currentRecord) {
        hasRecord.value = true
        myRecord.value = currentRecord
      } else {
        hasRecord.value = false
        myRecord.value = null
      }
    } else {
      hasRecord.value = false
      myRecord.value = null
    }
  } catch (e) {
    console.error('检查我的记录失败:', e)
    hasRecord.value = false
  }
}

// Y轴最大值（用于归一化）
const yMaxValue = computed(() => {
  if (!data.value.fiveYearTrend?.length) return 50
  const maxRate = Math.max(
    ...data.value.fiveYearTrend.map(item => parseFloat(item.admission_rate) || 0)
  )
  // 向上取整到最近的10的倍数，至少50
  return Math.max(Math.ceil(maxRate / 10) * 10, 50)
})

const yMaxLabel = computed(() => yMaxValue.value)

// 折线图数据点 - 修复坐标计算
const lineDataPoints = computed(() => {
  if (!data.value.fiveYearTrend?.length) return []
  const count = data.value.fiveYearTrend.length
  const maxRate = yMaxValue.value
  return data.value.fiveYearTrend.map((item, index) => {
    const rate = parseFloat(item.admission_rate) || 0
    // 归一化Y坐标：0%在底部(100), 100%在顶部(0)，但基于maxRate归一化
    const y = 100 - (rate / maxRate) * 100
    return {
      x: count === 1 ? 50 : (index / (count - 1)) * 100,
      y: Math.max(0, Math.min(100, y)) // 确保在0-100范围内
    }
  })
})

const linePoints = computed(() => {
  return lineDataPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

// 饼图总上岸人数
const totalAdmittedCount = computed(() => {
  if (!data.value.schoolLevels?.length) return 0
  return data.value.schoolLevels.reduce((sum, item) => sum + (item.count || 0), 0)
})

// 饼图样式
const pieStyle = computed(() => {
  if (!data.value.schoolLevels?.length) return {}
  const total = totalAdmittedCount.value
  if (total === 0) return {}

  let currentDeg = 0
  const gradients = []
  data.value.schoolLevels.forEach((item, index) => {
    const percent = (item.count / total) * 100
    const color = pieColors[index % pieColors.length]
    gradients.push(`${color} ${currentDeg}% ${currentDeg + percent}%`)
    currentDeg += percent
  })

  return {
    background: `conic-gradient(${gradients.join(', ')})`
  }
})

const getPiePercent = (count) => {
  const total = totalAdmittedCount.value
  if (total === 0) return 0
  return ((count / total) * 100).toFixed(1)
}

// TOP学院（按上岸人数排序）
const topColleges = computed(() => {
  return (data.value.colleges || []).slice(0, 8)
})

const maxAdmitted = computed(() => {
  if (!topColleges.value.length) return 1
  return Math.max(...topColleges.value.map(c => c.admitted || 0))
})

const changeYear = (year) => {
  currentYear.value = year
  loadData()
}

const getRateClass = (rate) => {
  const r = parseFloat(rate)
  if (r >= 30) return 'rate-high'
  if (r >= 15) return 'rate-medium'
  return 'rate-low'
}

const showCollegeDetail = (college) => {
  uni.showModal({
    title: college.college,
    content: `报名：${college.applicants}人\n上岸：${college.admitted}人\n跨考：${college.cross}人\n上岸率：${college.admissionRate}%\n跨考率：${college.crossRate}%`,
    showCancel: false
  })
}

const goToRecord = () => {
  if (myRecord.value) {
    uni.setStorageSync('editRecordData', myRecord.value)
    uni.navigateTo({ url: `/pages/data/record?edit=1&id=${myRecord.value.id}` })
  } else {
    uni.navigateTo({ url: '/pages/data/record' })
  }
}

const goToEdit = () => {
  if (myRecord.value) {
    uni.setStorageSync('editRecordData', myRecord.value)
    uni.navigateTo({ url: `/pages/data/record?edit=1&id=${myRecord.value.id}` })
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.year-selector {
  padding: 20rpx 24rpx;
}

.year-scroll {
  white-space: nowrap;
}

.year-list {
  display: inline-flex;
  gap: 16rpx;
}

.year-item {
  display: inline-block;
  padding: 12rpx 32rpx;
  background: #f5f5f5;
  border-radius: 24rpx;
  font-size: 28rpx;
  color: #666;
}

.year-item.active {
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  color: #fff;
}

.overview-card {
  margin: 20rpx 24rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 24rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.stat-box {
  background: #f9f9f9;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
}

.stat-box.primary { border-left: 6rpx solid #c53030; }
.stat-box.success { border-left: 6rpx solid #38a169; }
.stat-box.warning { border-left: 6rpx solid #dd6b20; }
.stat-box.info { border-left: 6rpx solid #3182ce; }

.stat-value {
  font-size: 44rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

/* 图表卡片 */
.chart-card {
  margin: 20rpx 24rpx;
  padding: 30rpx;
}

/* 折线图 */
.line-chart {
  display: flex;
  height: 320rpx;
  padding: 20rpx 0;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 16rpx;
  width: 80rpx;
}

.y-label {
  font-size: 20rpx;
  color: #999;
  text-align: right;
}

.chart-area {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 40rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-line {
  height: 1rpx;
  background: #f0f0f0;
}

.line-container {
  flex: 1;
  position: relative;
}

.line-container svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 在SVG上方再叠加一层数据点，让它们更明显 */
.overlay-dots {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.overlay-dot {
  position: absolute;
  width: 24rpx;
  height: 24rpx;
  background: #c53030;
  border: 6rpx solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
  box-shadow: 0 4rpx 12rpx rgba(197, 48, 48, 0.5);
}

.x-labels {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
  height: 40rpx;
}

.x-label {
  font-size: 20rpx;
  color: #666;
  text-align: center;
  flex: 1;
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 80rpx;
}

.trend-label-item {
  flex: 1;
  text-align: center;
}

.trend-rate {
  font-size: 22rpx;
  color: #c53030;
  font-weight: bold;
}

/* 饼状图 */
.pie-chart-container {
  display: flex;
  align-items: center;
  gap: 40rpx;
  padding: 20rpx 0;
}

.pie-chart {
  position: relative;
  width: 240rpx;
  height: 240rpx;
  flex-shrink: 0;
}

.pie-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140rpx;
  height: 140rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pie-total {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.pie-total-label {
  font-size: 22rpx;
  color: #999;
}

.pie-legend {
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.legend-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
  flex-shrink: 0;
}

.legend-name {
  font-size: 26rpx;
  color: #333;
  flex: 1;
}

.legend-value {
  font-size: 24rpx;
  color: #666;
}

.legend-percent {
  font-size: 24rpx;
  color: #c53030;
  font-weight: bold;
  width: 80rpx;
  text-align: right;
}

/* 水平条形图 */
.bar-chart {
  padding: 10rpx 0;
}

.bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.bar-name {
  width: 180rpx;
  font-size: 24rpx;
  color: #333;
  text-align: right;
  padding-right: 16rpx;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 32rpx;
  background: #f0f0f0;
  border-radius: 16rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 16rpx;
  transition: width 0.5s ease;
}

.bar-value {
  width: 100rpx;
  font-size: 24rpx;
  color: #666;
  padding-left: 16rpx;
  flex-shrink: 0;
}

/* 学院列表 */
.college-card {
  margin: 0 24rpx 20rpx;
  padding: 30rpx;
}

.college-list {
  max-height: 600rpx;
  overflow-y: auto;
}

.college-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.college-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.college-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.college-rate {
  font-size: 24rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
}

.rate-high { background: #e8ffee; color: #38a169; }
.rate-medium { background: #fff8e6; color: #dd6b20; }
.rate-low { background: #ffebee; color: #e53e3e; }

.college-stats {
  display: flex;
  gap: 30rpx;
  margin-bottom: 12rpx;
}

.mini-stat {
  text-align: center;
}

.mini-num {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.mini-label {
  font-size: 22rpx;
  color: #999;
}

.rate-bar-wrap {
  height: 8rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
}

.rate-bar {
  height: 100%;
  background: linear-gradient(90deg, #c53030, #e53e3e);
  border-radius: 4rpx;
  transition: width 0.3s;
}

.notice-card {
  margin: 0 24rpx 20rpx;
  padding: 24rpx;
  background: #e8f4ff;
}

.notice-title {
  font-size: 28rpx;
  color: #3182ce;
  font-weight: 500;
  display: block;
  margin-bottom: 12rpx;
}

.notice-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.8;
  display: block;
}

.top-actions {
  margin: 20rpx 24rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 28rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  box-shadow: 0 4rpx 16rpx rgba(197, 48, 48, 0.3);
  margin-bottom: 16rpx;
}

.action-btn:last-child {
  margin-bottom: 0;
}

.action-icon {
  font-size: 36rpx;
}

.action-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #fff;
}
</style>

<template>
  <view class="page">
    <view class="header-section">
      <text class="page-title">考研国家线</text>
      <text class="page-desc">历年考研国家分数线查询</text>
    </view>

    <view class="year-selector card">
      <scroll-view scroll-x class="year-scroll" show-scrollbar="false">
        <view class="year-list">
          <view
            v-for="y in years"
            :key="y"
            class="year-item"
            :class="{ active: currentYear === y }"
            @click="switchYear(y)"
          >
            <text class="year-text">{{ y }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="category-tabs card">
      <view class="tab-item" :class="{ active: currentCategory === 'academic' }" @click="currentCategory = 'academic'">
        <text>学术型</text>
      </view>
      <view class="tab-item" :class="{ active: currentCategory === 'professional' }" @click="currentCategory = 'professional'">
        <text>专业型</text>
      </view>
    </view>

    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <view v-else-if="!hasData" class="empty-state">
      <text class="empty-icon">📊</text>
      <text class="empty-text">暂无{{ currentYear }}年国家线数据</text>
      <text class="empty-hint">请等待管理员上传数据</text>
    </view>

    <view v-else class="data-section">
      <view class="region-section">
        <view class="region-header">
          <text class="region-title">A区（一区）</text>
          <text class="region-desc">北京、天津、上海、江苏、浙江、福建、山东、河南、湖北、湖南、广东、河北、山西、辽宁、吉林、黑龙江、安徽、江西、重庆、四川、陕西</text>
        </view>
        <view class="score-table">
          <view class="table-header">
            <text class="col col-subject">学科门类</text>
            <text class="col col-score">总分</text>
            <text class="col col-score">政治</text>
            <text class="col col-score">外语</text>
            <text class="col col-score">业务课一</text>
            <text class="col col-score">业务课二</text>
          </view>
          <view v-for="item in currentData.A" :key="item.id" class="table-row">
            <text class="col col-subject">{{ item.subject_type }}</text>
            <text class="col col-score highlight">{{ item.total_score }}</text>
            <text class="col col-score">{{ item.politics_score || '-' }}</text>
            <text class="col col-score">{{ item.foreign_score || '-' }}</text>
            <text class="col col-score">{{ item.subject1_score || '-' }}</text>
            <text class="col col-score">{{ item.subject2_score || '-' }}</text>
          </view>
          <view v-if="currentData.A.length === 0" class="table-row">
            <text class="col col-full">暂无数据</text>
          </view>
        </view>
      </view>

      <view class="region-section">
        <view class="region-header">
          <text class="region-title">B区（二区）</text>
          <text class="region-desc">内蒙古、广西、海南、贵州、云南、西藏、甘肃、青海、宁夏、新疆</text>
        </view>
        <view class="score-table">
          <view class="table-header">
            <text class="col col-subject">学科门类</text>
            <text class="col col-score">总分</text>
            <text class="col col-score">政治</text>
            <text class="col col-score">外语</text>
            <text class="col col-score">业务课一</text>
            <text class="col col-score">业务课二</text>
          </view>
          <view v-for="item in currentData.B" :key="item.id" class="table-row">
            <text class="col col-subject">{{ item.subject_type }}</text>
            <text class="col col-score highlight">{{ item.total_score }}</text>
            <text class="col col-score">{{ item.politics_score || '-' }}</text>
            <text class="col col-score">{{ item.foreign_score || '-' }}</text>
            <text class="col col-score">{{ item.subject1_score || '-' }}</text>
            <text class="col col-score">{{ item.subject2_score || '-' }}</text>
          </view>
          <view v-if="currentData.B.length === 0" class="table-row">
            <text class="col col-full">暂无数据</text>
          </view>
        </view>
      </view>
    </view>

    <view class="tip-section card">
      <text class="tip-title">💡 说明</text>
      <text class="tip-text">1. A区（一区）通常分数线高于B区（二区）约10分</text>
      <text class="tip-text">2. 国家线是考研复试和调剂的基本分数线要求</text>
      <text class="tip-text">3. 各院校可在国家线基础上自行划定更高的院校线</text>
    </view>

    <view style="height: 60rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { nationalLineApi } from '@/api/index'
import { getCurrentYear } from '@/utils/date'

const years = ref([])
const currentYear = ref(getCurrentYear())
const currentCategory = ref('academic')
const lineData = ref({ academic: { A: [], B: [] }, professional: { A: [], B: [] } })
const loading = ref(false)

const currentData = computed(() => {
  return lineData.value[currentCategory.value] || { A: [], B: [] }
})

const hasData = computed(() => {
  const d = currentData.value
  return (d.A && d.A.length > 0) || (d.B && d.B.length > 0)
})

const loadData = async (year) => {
  loading.value = true
  try {
    const res = await nationalLineApi.getList({ year })
    if (res.code === 200 && res.data) {
      years.value = res.data.years || []
      lineData.value = res.data.data || { academic: { A: [], B: [] }, professional: { A: [], B: [] } }
      currentYear.value = year || getCurrentYear()
    }
  } catch (e) {
    console.error('加载国家线数据失败:', e)
  } finally {
    loading.value = false
  }
}

const switchYear = (year) => {
  currentYear.value = year
  loadData(year)
}

onMounted(() => {
  loadData(getCurrentYear())
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header-section {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
}

.page-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.page-desc {
  font-size: 26rpx;
  color: rgba(255,255,255,0.85);
}

.card {
  margin: 20rpx 24rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.year-selector {
  margin-top: -20rpx;
}

.year-scroll {
  white-space: nowrap;
}

.year-list {
  display: inline-flex;
  gap: 16rpx;
  padding: 4rpx 0;
}

.year-item {
  padding: 12rpx 32rpx;
  border-radius: 30rpx;
  background: #f5f5f5;
  flex-shrink: 0;
}

.year-item.active {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.year-text {
  font-size: 28rpx;
  color: #666;
}

.year-item.active .year-text {
  color: #fff;
  font-weight: bold;
}

.category-tabs {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 12rpx;
  background: #f5f5f5;
  font-size: 28rpx;
  color: #666;
}

.tab-item.active {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #fff;
  font-weight: bold;
}

.loading-state {
  padding: 120rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.empty-state {
  padding: 120rpx 0;
  text-align: center;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}

.data-section {
  padding: 0 24rpx;
}

.region-section {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  overflow: hidden;
}

.region-header {
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.region-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.region-desc {
  font-size: 20rpx;
  color: #999;
  line-height: 1.4;
}

.score-table {
  width: 100%;
  overflow-x: auto;
}

.table-header {
  display: flex;
  align-items: center;
  background: #f8f8f8;
  padding: 16rpx 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 20rpx 12rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.table-row:last-child {
  border-bottom: none;
}

.col {
  font-size: 24rpx;
  color: #333;
  text-align: center;
  flex-shrink: 0;
}

.col-subject {
  width: 160rpx;
  text-align: left;
  font-weight: 500;
}

.col-score {
  width: 110rpx;
}

.col-full {
  flex: 1;
  text-align: center;
  color: #999;
  padding: 20rpx 0;
}

.highlight {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 28rpx;
}

.table-header .col {
  font-size: 22rpx;
  color: #999;
  font-weight: bold;
}

.tip-section {
  margin: 20rpx 24rpx;
}

.tip-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.8;
  display: block;
}
</style>

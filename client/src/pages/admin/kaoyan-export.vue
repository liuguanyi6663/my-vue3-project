<template>
  <view class="page">
    <view class="header">
      <text class="header-icon">📊</text>
      <view class="header-content">
        <text class="header-title">考研数据导出</text>
        <text class="header-desc">将所有用户上传的考研资料统一导出为Excel表格</text>
      </view>
    </view>

    <view class="card-section">
      <text class="section-title">导出方式</text>

      <view class="export-card" @click="exportByScore">
        <view class="card-left">
          <view class="card-icon score-icon">
            <text class="icon-text">📉</text>
          </view>
          <view class="card-info">
            <text class="card-title">按成绩降序导出</text>
            <text class="card-desc">按考研总分从高到低排列，生成Excel文件</text>
          </view>
        </view>
        <view class="card-arrow">
          <text class="arrow-text">></text>
        </view>
      </view>

      <view class="export-card" @click="exportByName">
        <view class="card-left">
          <view class="card-icon name-icon">
            <text class="icon-text">🔤</text>
          </view>
          <view class="card-info">
            <text class="card-title">按姓名排序导出</text>
            <text class="card-desc">按姓名拼音首字母升序排列，生成Excel文件</text>
          </view>
        </view>
        <view class="card-arrow">
          <text class="arrow-text">></text>
        </view>
      </view>
    </view>

    <view class="info-section">
      <text class="section-title">导出说明</text>
      <view class="info-card">
        <view class="info-item">
          <text class="info-dot">•</text>
          <text class="info-text">仅导出已通过审核的考研数据</text>
        </view>
        <view class="info-item">
          <text class="info-dot">•</text>
          <text class="info-text">导出文件为标准Excel(.xlsx)格式</text>
        </view>
        <view class="info-item">
          <text class="info-dot">•</text>
          <text class="info-text">包含所有考研数据字段，确保数据完整性</text>
        </view>
        <view class="info-item">
          <text class="info-dot">•</text>
          <text class="info-text">成绩降序排序依据：数学+英语+政治+专业课总分</text>
        </view>
        <view class="info-item">
          <text class="info-dot">•</text>
          <text class="info-text">姓名排序依据：姓名拼音首字母ABC顺序</text>
        </view>
      </view>
    </view>

    <view class="stats-section" v-if="stats.total > 0">
      <text class="section-title">数据概览</text>
      <view class="stats-card">
        <view class="stats-row">
          <view class="stats-item">
            <text class="stats-num">{{ stats.total }}</text>
            <text class="stats-label">已审核通过</text>
          </view>
          <view class="stats-divider"></view>
          <view class="stats-item">
            <text class="stats-num">{{ stats.admitted }}</text>
            <text class="stats-label">上岸人数</text>
          </view>
          <view class="stats-divider"></view>
          <view class="stats-item">
            <text class="stats-num">{{ stats.cross }}</text>
            <text class="stats-label">跨考人数</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { recordApi, adminApi } from '@/api/index'

const stats = ref({
  total: 0,
  admitted: 0,
  cross: 0
})

const loadStats = async () => {
  try {
    const res = await recordApi.getList({ status: 'approved', page: 1, pageSize: 1 })
    if (res.code === 200) {
      stats.value.total = res.data.total || 0
    }

    const summaryRes = await recordApi.getPublicSummary({})
    if (summaryRes.code === 200 && summaryRes.data && summaryRes.data.total) {
      stats.value.admitted = summaryRes.data.total.admitted_count || 0
      stats.value.cross = summaryRes.data.total.cross_count || 0
    }
  } catch (e) {
    console.error('加载统计失败:', e)
  }
}

const doExport = async (sortType) => {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  uni.showLoading({ title: '正在导出...' })

  try {
    const res = await adminApi.exportKaoyanData(sortType)
    uni.hideLoading()

    const filePath = res.tempFilePath
    uni.openDocument({
      filePath: filePath,
      showMenu: true,
      success: () => {
        uni.showToast({ title: '导出成功', icon: 'success' })
      },
      fail: () => {
        uni.saveFile({
          tempFilePath: filePath,
          success: () => {
            uni.showToast({ title: '文件已保存', icon: 'success' })
          },
          fail: () => {
            uni.showToast({ title: '文件已下载', icon: 'success' })
          }
        })
      }
    })
  } catch (e) {
    uni.hideLoading()
    console.error('导出失败:', e)
  }
}

const exportByScore = () => {
  doExport('score')
}

const exportByName = () => {
  doExport('name')
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  padding: 50rpx 30rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.header-icon {
  font-size: 64rpx;
}

.header-content {
  flex: 1;
}

.header-title {
  font-size: 38rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.header-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  display: block;
}

.card-section {
  margin: -20rpx 24rpx 20rpx;
}

.section-title {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
  padding: 20rpx 10rpx 16rpx;
  display: block;
}

.export-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}

.export-card:active {
  transform: scale(0.98);
  background: #fafafa;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.card-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-icon {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.name-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.icon-text {
  font-size: 40rpx;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}

.card-desc {
  font-size: 24rpx;
  color: #999;
  display: block;
}

.card-arrow {
  padding: 0 10rpx;
}

.arrow-text {
  font-size: 32rpx;
  color: #ccc;
}

.info-section {
  margin: 0 24rpx 20rpx;
}

.info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.info-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-dot {
  color: #c53030;
  font-size: 28rpx;
  margin-right: 12rpx;
  line-height: 40rpx;
}

.info-text {
  font-size: 26rpx;
  color: #666;
  line-height: 40rpx;
}

.stats-section {
  margin: 0 24rpx 20rpx;
}

.stats-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stats-item {
  text-align: center;
  flex: 1;
}

.stats-num {
  font-size: 44rpx;
  font-weight: bold;
  color: #c53030;
  display: block;
}

.stats-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.stats-divider {
  width: 1rpx;
  height: 60rpx;
  background: #f0f0f0;
}
</style>

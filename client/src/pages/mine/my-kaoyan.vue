<template>
  <view class="page">
    <!-- 顶部提示 -->
    <view class="header-tip">
      <text class="tip-icon">📋</text>
      <view class="tip-content">
        <text class="tip-title">我的考研信息</text>
        <text class="tip-desc">查看和管理您提交的考研信息</text>
      </view>
    </view>

    <!-- 数据列表 -->
    <view class="list-container">
      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
      <view v-else-if="list.length === 0" class="empty-state">
        <text class="empty-text">暂无考研信息</text>
        <button class="empty-btn" @click="goToSubmit">去录入</button>
      </view>
      <view v-else>
        <view
          v-for="item in list"
          :key="item.id"
          class="record-card"
        >
          <!-- 状态标签 -->
          <view class="status-bar">
            <text class="status-tag" :class="item.status">{{ statusText[item.status] }}</text>
            <text class="year-tag">{{ item.exam_year }}年</text>
          </view>

          <!-- 基本信息 -->
          <view class="info-section">
            <view class="info-row">
              <text class="info-label">姓名：</text>
              <text class="info-value">{{ item.name }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">分院：</text>
              <text class="info-value">{{ item.college || '未知' }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">专业：</text>
              <text class="info-value">{{ item.major }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">学号：</text>
              <text class="info-value">{{ item.student_id }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">考研科目：</text>
              <text class="info-value">{{ item.exam_subjects }}</text>
            </view>
          </view>

          <!-- 考试情况 -->
          <view class="info-section">
            <view class="info-row">
              <text class="info-label">跨考：</text>
              <text class="info-value">{{ item.is_cross_major ? '是' : '否' }}</text>
              <text class="info-label ml-20">上岸：</text>
              <text class="info-value">{{ item.is_admitted ? '是' : '否' }}</text>
              <text class="info-label ml-20">过线：</text>
              <text class="info-value">{{ item.is_pass_line ? '是' : '否' }}</text>
            </view>
          </view>

          <!-- 成绩 -->
          <view class="score-section" v-if="item.math_score || item.english_score || item.politics_score || item.professional_score">
            <view class="score-row">
              <view class="score-item" v-if="item.math_score">
                <text class="score-label">数学</text>
                <text class="score-value">{{ item.math_score }}</text>
              </view>
              <view class="score-item" v-if="item.english_score">
                <text class="score-label">英语</text>
                <text class="score-value">{{ item.english_score }}</text>
              </view>
              <view class="score-item" v-if="item.politics_score">
                <text class="score-label">政治</text>
                <text class="score-value">{{ item.politics_score }}</text>
              </view>
              <view class="score-item" v-if="item.professional_score">
                <text class="score-label">专业课</text>
                <text class="score-value">{{ item.professional_score }}</text>
              </view>
            </view>
          </view>

          <!-- 目标院校 -->
          <view class="info-section">
            <view class="info-row">
              <text class="info-label">目标院校：</text>
              <text class="info-value">{{ item.target_school || '未填写' }}</text>
              <text v-if="item.school_level" class="level-tag">{{ item.school_level }}</text>
            </view>
            <view class="info-row" v-if="item.target_major">
              <text class="info-label">目标专业：</text>
              <text class="info-value">{{ item.target_major }}</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="card-actions">
            <!-- 已通过：可以修改 -->
            <button v-if="item.status === 'approved'" class="action-btn edit" @click="goToEdit(item)">修改信息</button>
            <!-- 已拒绝：可以重新上传 -->
            <button v-if="item.status === 'rejected'" class="action-btn reupload" @click="goToReupload(item)">重新上传</button>
            <!-- 审核中：提示等待 -->
            <text v-if="item.status === 'pending'" class="pending-tip">审核中，请耐心等待</text>
          </view>
        </view>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { recordApi } from '@/api/index'

const statusText = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝'
}

const list = ref([])
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const res = await recordApi.getMyRecords()
    if (res.code === 200) {
      list.value = res.data || []
    }
  } catch (e) {
    console.error('加载我的考研信息失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goToSubmit = () => {
  uni.navigateTo({ url: '/pages/data/record' })
}

const goToEdit = (item) => {
  // 将数据存入storage，然后跳转到编辑页面
  uni.setStorageSync('editRecordData', item)
  uni.navigateTo({ url: `/pages/data/record?edit=1&id=${item.id}` })
}

const goToReupload = (item) => {
  // 重新上传和编辑使用同一个页面
  uni.setStorageSync('editRecordData', item)
  uni.navigateTo({ url: `/pages/data/record?edit=1&id=${item.id}` })
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

.header-tip {
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  padding: 40rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.tip-icon {
  font-size: 60rpx;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  display: block;
}

.tip-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8rpx;
  display: block;
}

.list-container {
  padding: 20rpx 24rpx;
}

.empty-state {
  text-align: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 30rpx;
  color: #999;
  display: block;
  margin-bottom: 30rpx;
}

.empty-btn {
  display: inline-block;
  padding: 16rpx 60rpx;
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}

.record-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 24rpx;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.status-tag {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.status-tag.pending {
  background: #fff8e6;
  color: #ff9500;
}

.status-tag.approved {
  background: #e8ffee;
  color: #07c160;
}

.status-tag.rejected {
  background: #ffebee;
  color: #ff3b30;
}

.year-tag {
  font-size: 24rpx;
  color: #999;
}

.info-section {
  margin-bottom: 16rpx;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
  flex-wrap: wrap;
}

.info-label {
  font-size: 26rpx;
  color: #999;
}

.info-value {
  font-size: 26rpx;
  color: #333;
}

.ml-20 {
  margin-left: 20rpx;
}

.level-tag {
  font-size: 22rpx;
  padding: 2rpx 10rpx;
  background: #e8f4ff;
  color: #3182ce;
  border-radius: 6rpx;
  margin-left: 12rpx;
}

.score-section {
  margin: 16rpx 0;
  padding: 16rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
}

.score-row {
  display: flex;
  gap: 20rpx;
}

.score-item {
  text-align: center;
  flex: 1;
}

.score-label {
  font-size: 22rpx;
  color: #999;
  display: block;
}

.score-value {
  font-size: 30rpx;
  font-weight: bold;
  color: #c53030;
  display: block;
  margin-top: 4rpx;
}

.card-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
}

.action-btn.edit {
  background: #e8f4ff;
  color: #3182ce;
}

.action-btn.reupload {
  background: #fff8e6;
  color: #ff9500;
}

.pending-tip {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #999;
  line-height: 70rpx;
}

.loading-state {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 26rpx;
}
</style>

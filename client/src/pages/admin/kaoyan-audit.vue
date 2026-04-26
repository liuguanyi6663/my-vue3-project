<template>
  <view class="page">
    <!-- 统计卡片 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-num">{{ stats.pending }}</text>
        <text class="stat-label">待审核</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.approved }}</text>
        <text class="stat-label">已通过</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.rejected }}</text>
        <text class="stat-label">已拒绝</text>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-bar">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-list">
          <text
            v-for="tab in tabs"
            :key="tab.value"
            class="filter-item"
            :class="{ active: currentTab === tab.value }"
            @click="changeTab(tab.value)"
          >{{ tab.label }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 批量操作栏 -->
    <view class="batch-bar" v-if="selectedIds.length > 0">
      <view class="batch-left">
        <text class="batch-info">已选 {{ selectedIds.length }} 项</text>
        <view class="select-all-text" @click="selectAll">全选</view>
        <view class="select-all-text cancel" @click="clearSelection">取消全选</view>
      </view>
      <view class="batch-actions">
        <button class="batch-btn approve" @click="batchAudit('approved')">批量通过</button>
        <button class="batch-btn reject" @click="batchAudit('rejected')">批量拒绝</button>
      </view>
    </view>
    <!-- 未选择时显示全选按钮 -->
    <view class="batch-bar" v-else-if="list.length > 0 && currentTab === 'pending'">
      <view class="batch-left">
        <view class="select-all-text" @click="selectAll">全选</view>
      </view>
    </view>

    <!-- 数据列表 -->
    <view class="list-container">
      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
      <view v-else-if="list.length === 0" class="empty-state">
        <text class="empty-text">暂无数据</text>
      </view>
      <view v-else>
        <view
          v-for="item in list"
          :key="item.id"
          class="record-card"
          :class="{ selected: selectedIds.includes(item.id) }"
          @click="toggleSelect(item.id)"
        >
          <!-- 选择框 -->
          <view class="select-box">
            <view class="checkbox" :class="{ checked: selectedIds.includes(item.id) }">
              <text v-if="selectedIds.includes(item.id)" class="check-icon">✓</text>
            </view>
          </view>

          <!-- 内容区 -->
          <view class="card-content">
            <view class="content-header">
              <view class="header-left">
                <text class="student-name">{{ item.name }}</text>
                <text class="student-id">学号：{{ item.student_id }}</text>
              </view>
              <text class="status-tag" :class="item.status">{{ statusText[item.status] }}</text>
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
              <text class="info-label">考研科目：</text>
              <text class="info-value">{{ item.exam_subjects }}</text>
            </view>

            <view class="info-row">
              <text class="info-label">年份：</text>
              <text class="info-value">{{ item.exam_year }}年</text>
              <text class="info-label ml-20">跨考：</text>
              <text class="info-value">{{ item.is_cross_major ? '是' : '否' }}</text>
              <text class="info-label ml-20">上岸：</text>
              <text class="info-value">{{ item.is_admitted ? '是' : '否' }}</text>
            </view>

            <!-- 成绩 -->
            <view class="score-row" v-if="item.math_score || item.english_score || item.politics_score || item.professional_score">
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

            <view class="info-row" v-if="item.target_school">
              <text class="info-label">目标院校：</text>
              <text class="info-value">{{ item.target_school }}</text>
              <text v-if="item.school_level" class="level-tag">{{ item.school_level }}</text>
            </view>
            <view class="info-row" v-if="item.target_major">
              <text class="info-label">目标专业：</text>
              <text class="info-value">{{ item.target_major }}</text>
            </view>

            <!-- 单条操作 -->
            <view class="card-actions" v-if="item.status === 'pending'">
              <button class="action-btn approve" @click.stop="singleAudit(item.id, 'approved')">通过</button>
              <button class="action-btn reject" @click.stop="singleAudit(item.id, 'rejected')">拒绝</button>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="hasMore" class="load-more" @click="loadMore">
          <text>{{ loadingMore ? '加载中...' : '点击加载更多' }}</text>
        </view>
        <view v-else-if="list.length > 0" class="no-more">
          <text>没有更多了</text>
        </view>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { recordApi } from '@/api/index'

const tabs = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '全部', value: '' }
]

const statusText = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

const currentTab = ref('pending')
const list = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const selectedIds = ref([])
const stats = ref({ pending: 0, approved: 0, rejected: 0 })

const loadList = async (isRefresh = true) => {
  if (isRefresh) {
    page.value = 1
    hasMore.value = true
    selectedIds.value = []
  }

  loading.value = isRefresh
  loadingMore.value = !isRefresh

  try {
    const res = await recordApi.getList({
      status: currentTab.value || undefined,
      page: page.value,
      pageSize: pageSize.value
    })

    if (res.code === 200) {
      const data = res.data || {}
      if (isRefresh) {
        list.value = data.list || []
      } else {
        list.value = [...list.value, ...(data.list || [])]
      }
      hasMore.value = list.value.length < (data.total || 0)
    }
  } catch (e) {
    console.error('加载列表失败:', e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await recordApi.getList({ page: 1, pageSize: 1 })
    if (res.code === 200) {
      // 分别获取各状态数量
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        recordApi.getList({ status: 'pending', page: 1, pageSize: 1 }),
        recordApi.getList({ status: 'approved', page: 1, pageSize: 1 }),
        recordApi.getList({ status: 'rejected', page: 1, pageSize: 1 })
      ])

      stats.value = {
        pending: pendingRes.data?.total || 0,
        approved: approvedRes.data?.total || 0,
        rejected: rejectedRes.data?.total || 0
      }
    }
  } catch (e) {
    console.error('加载统计失败:', e)
  }
}

const changeTab = (tab) => {
  currentTab.value = tab
  loadList(true)
}

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  page.value++
  loadList(false)
}

const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const selectAll = () => {
  // 只选择当前列表中 pending 状态的记录
  const pendingIds = list.value
    .filter(item => item.status === 'pending')
    .map(item => item.id)
  selectedIds.value = [...pendingIds]
}

const clearSelection = () => {
  selectedIds.value = []
}

const singleAudit = async (id, status) => {
  uni.showModal({
    title: '确认',
    content: status === 'approved' ? '确认通过该条记录？' : '确认拒绝该条记录？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          await recordApi.audit(id, { status })
          uni.hideLoading()
          uni.showToast({ title: '操作成功', icon: 'success' })
          loadList(true)
          loadStats()
        } catch (e) {
          uni.hideLoading()
          console.error(e)
        }
      }
    }
  })
}

const batchAudit = async (status) => {
  if (selectedIds.value.length === 0) {
    uni.showToast({ title: '请先选择记录', icon: 'none' })
    return
  }

  uni.showModal({
    title: '批量确认',
    content: `确认${status === 'approved' ? '通过' : '拒绝'}选中的 ${selectedIds.value.length} 条记录？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '批量处理中...' })
          await recordApi.batchAudit({ ids: selectedIds.value, status })
          uni.hideLoading()
          uni.showToast({ title: '批量操作成功', icon: 'success' })
          selectedIds.value = []
          loadList(true)
          loadStats()
        } catch (e) {
          uni.hideLoading()
          console.error(e)
        }
      }
    }
  })
}

onMounted(() => {
  loadList(true)
  loadStats()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.stats-bar {
  display: flex;
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  padding: 30rpx 0;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8rpx;
  display: block;
}

.filter-bar {
  background: #fff;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-scroll {
  white-space: nowrap;
}

.filter-list {
  display: inline-flex;
  gap: 16rpx;
}

.filter-item {
  display: inline-block;
  padding: 12rpx 28rpx;
  background: #f5f5f5;
  border-radius: 24rpx;
  font-size: 26rpx;
  color: #666;
}

.filter-item.active {
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  color: #fff;
}

.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff8e6;
  border-bottom: 1rpx solid #ffe4b3;
}

.batch-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.batch-info {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.select-all-text {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  border: 1rpx solid #c53030;
  background: #fff;
  color: #c53030;
}

.select-all-text.cancel {
  border: 1rpx solid #999;
  color: #666;
}

.batch-actions {
  display: flex;
  gap: 16rpx;
}

.batch-btn {
  padding: 12rpx 28rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  border: none;
}

.batch-btn.approve {
  background: #07c160;
  color: #fff;
}

.batch-btn.reject {
  background: #ff3b30;
  color: #fff;
}

.list-container {
  padding: 20rpx 24rpx;
}

.record-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 24rpx;
  transition: all 0.2s;
}

.record-card.selected {
  background: #fff8e6;
  border: 2rpx solid #ff9500;
}

.select-box {
  display: flex;
  align-items: center;
  margin-right: 20rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  background: #c53030;
  border-color: #c53030;
}

.check-icon {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
}

.card-content {
  flex: 1;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.student-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.student-id {
  font-size: 24rpx;
  color: #999;
}

.status-tag {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
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

.score-row {
  display: flex;
  gap: 20rpx;
  margin: 16rpx 0;
  padding: 16rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
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
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  border: none;
}

.action-btn.approve {
  background: #e8ffee;
  color: #07c160;
}

.action-btn.reject {
  background: #ffebee;
  color: #ff3b30;
}

.loading-state,
.empty-state,
.load-more,
.no-more {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 26rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #666;
}
</style>

<template>
  <view class="page">
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

    <view class="filter-bar">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-list">
          <text
            v-for="tab in categoryTabs"
            :key="tab.value"
            class="filter-item"
            :class="{ active: currentCategory === tab.value }"
            @click="changeCategory(tab.value)"
          >{{ tab.label }}</text>
        </view>
      </scroll-view>
    </view>

    <view class="status-bar">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-list">
          <text
            v-for="tab in statusTabs"
            :key="tab.value"
            class="filter-item small"
            :class="{ active: currentStatus === tab.value }"
            @click="changeStatus(tab.value)"
          >{{ tab.label }}</text>
        </view>
      </scroll-view>
    </view>

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
        >
          <view class="card-content">
            <view class="content-header">
              <view class="header-left">
                <text class="item-name">{{ getItemName(item) }}</text>
                <text class="item-type-tag">{{ getCategoryLabel(item._type) }}</text>
              </view>
              <text class="status-tag" :class="item.audit_status">{{ statusText[item.audit_status] }}</text>
            </view>

            <view class="info-row">
              <text class="info-label">上传者：</text>
              <text class="info-value">{{ item.uploader_name || '未知' }}</text>
            </view>

            <view v-if="item._type === 'oral'" class="info-row">
              <text class="info-label">英文问题：</text>
              <text class="info-value">{{ (item.question_en || '').substring(0, 60) }}{{ (item.question_en || '').length > 60 ? '...' : '' }}</text>
            </view>

            <view v-if="item._type === 'oral'" class="info-row">
              <text class="info-label">参考回答：</text>
              <text class="info-value">{{ (item.reference_answer || '').substring(0, 80) }}{{ (item.reference_answer || '').length > 80 ? '...' : '' }}</text>
            </view>

            <view v-if="item._type !== 'oral'" class="info-row">
              <text class="info-label">文件名：</text>
              <text class="info-value">{{ item.file_name }}</text>
            </view>

            <view v-if="item._type !== 'oral'" class="info-row">
              <text class="info-label">文件大小：</text>
              <text class="info-value">{{ formatFileSize(item.file_size) }}</text>
            </view>

            <view v-if="item.desc" class="info-row">
              <text class="info-label">描述：</text>
              <text class="info-value">{{ item.desc }}</text>
            </view>

            <view class="info-row">
              <text class="info-label">上传时间：</text>
              <text class="info-value">{{ formatTime(item.created_at) }}</text>
            </view>

            <view class="card-actions" v-if="item.audit_status === 'pending'">
              <button class="action-btn approve" @click.stop="auditItem(item, 'approved')">通过</button>
              <button class="action-btn reject" @click.stop="auditItem(item, 'rejected')">拒绝</button>
            </view>
            <view class="card-actions" v-else-if="item.audit_status === 'rejected'">
              <button class="action-btn approve" @click.stop="auditItem(item, 'approved')">修改成通过</button>
            </view>
            <view class="card-actions" v-else-if="item.audit_status === 'approved'">
              <button class="action-btn reject" @click.stop="auditItem(item, 'rejected')">修改成拒绝</button>
            </view>
          </view>
        </view>

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
import { adminApi } from '@/api/index'
import { formatMessageTime } from '@/utils/date'

const categoryTabs = [
  { label: '全部', value: '' },
  { label: '英语口语题库', value: 'oral' },
  { label: '简历模板', value: 'resume' },
  { label: '导师邮件模板', value: 'email' }
]

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
]

const statusText = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

const currentCategory = ref('')
const currentStatus = ref('')
const list = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const stats = ref({ pending: 0, approved: 0, rejected: 0 })

const getCategoryLabel = (type) => {
  const map = { oral: '口语题库', resume: '简历模板', email: '邮件模板' }
  return map[type] || type
}

const getItemName = (item) => {
  if (item._type === 'oral') return item.question_cn || item.question_en || '口语题目'
  return item.name || '未命名模板'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return size.toFixed(1) + ' ' + units[i]
}

const formatTime = (timeStr) => formatMessageTime(timeStr)

const loadList = async (isRefresh = true) => {
  if (isRefresh) {
    page.value = 1
    hasMore.value = true
  }

  loading.value = isRefresh
  loadingMore.value = !isRefresh

  try {
    const params = {
      status: currentStatus.value || undefined,
      category: currentCategory.value || undefined,
      page: page.value,
      pageSize: pageSize.value
    }

    const res = await adminApi.getInterviewAuditList(params)
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
    const res = await adminApi.getInterviewAuditStats()
    if (res.code === 200) {
      stats.value = res.data || { pending: 0, approved: 0, rejected: 0 }
    }
  } catch (e) {
    console.error('加载统计失败:', e)
  }
}

const changeCategory = (tab) => {
  currentCategory.value = tab
  loadList(true)
}

const changeStatus = (tab) => {
  currentStatus.value = tab
  loadList(true)
}

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  page.value++
  loadList(false)
}

const auditItem = async (item, status) => {
  uni.showModal({
    title: '确认',
    content: status === 'approved' ? '确认通过该条记录？' : '确认拒绝该条记录？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          await adminApi.auditInterviewItem(item._type, item.id, { audit_status: status })
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

.status-bar {
  background: #fff;
  padding: 0 24rpx 16rpx;
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

.filter-item.small {
  padding: 8rpx 22rpx;
  font-size: 24rpx;
}

.filter-item.active {
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  color: #fff;
}

.list-container {
  padding: 20rpx 24rpx;
}

.record-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 24rpx;
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
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-type-tag {
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  background: #e8f4ff;
  color: #3182ce;
  flex-shrink: 0;
}

.status-tag {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
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
  align-items: flex-start;
  margin-bottom: 8rpx;
}

.info-label {
  font-size: 26rpx;
  color: #999;
  flex-shrink: 0;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  word-break: break-all;
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

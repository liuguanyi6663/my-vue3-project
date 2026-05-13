<template>
  <view class="page">
    <view class="stats-bar card">
      <view class="stat-item">
        <text class="stat-num pending-num">{{ stats.pending }}</text>
        <text class="stat-label">待审核</text>
      </view>
      <view class="stat-item">
        <text class="stat-num approved-num">{{ stats.approved }}</text>
        <text class="stat-label">已通过</text>
      </view>
      <view class="stat-item">
        <text class="stat-num rejected-num">{{ stats.rejected }}</text>
        <text class="stat-label">已拒绝</text>
      </view>
    </view>

    <view class="filter-bar card">
      <view
        class="filter-item"
        :class="{ active: currentStatus === '' }"
        @click="changeStatus('')"
      >
        <text>全部</text>
      </view>
      <view
        class="filter-item"
        :class="{ active: currentStatus === 'pending' }"
        @click="changeStatus('pending')"
      >
        <text>待审核</text>
      </view>
      <view
        class="filter-item"
        :class="{ active: currentStatus === 'approved' }"
        @click="changeStatus('approved')"
      >
        <text>已通过</text>
      </view>
      <view
        class="filter-item"
        :class="{ active: currentStatus === 'rejected' }"
        @click="changeStatus('rejected')"
      >
        <text>已拒绝</text>
      </view>
    </view>

    <view class="list-section">
      <view class="cert-card card" v-for="item in list" :key="item.id">
        <view class="card-header">
          <view class="user-info">
            <image class="user-avatar" :src="getAvatarUrl(item.avatar)" mode="aspectFill" />
            <view class="user-detail">
              <text class="user-name">{{ item.nickname || '未知用户' }}</text>
              <text class="user-meta" v-if="item.college">{{ item.college }} · {{ item.major }}</text>
              <text class="user-meta" v-if="item.student_id">学号：{{ item.student_id }}</text>
            </view>
          </view>
          <text class="status-tag" :class="item.status">{{ statusMap[item.status] }}</text>
        </view>

        <view class="screenshot-area" @click="previewImage(item.screenshot)">
          <image class="screenshot-img" :src="getImageUrl(item.screenshot)" mode="widthFix" />
          <text class="preview-hint">点击查看大图</text>
        </view>

        <text class="cert-desc" v-if="item.description">说明：{{ item.description }}</text>

        <view class="card-footer">
          <text class="cert-time">申请时间：{{ formatTime(item.created_at) }}</text>
          <text class="review-time" v-if="item.reviewed_at">审核时间：{{ formatTime(item.reviewed_at) }}</text>
          <text class="review-remark" v-if="item.review_remark">审核备注：{{ item.review_remark }}</text>
        </view>

        <view class="action-area" v-if="item.status === 'pending'">
          <textarea
            class="remark-input"
            :value="remarks[item.id] || ''"
            @input="onRemarkInput(item.id, $event)"
            placeholder="审核备注（选填）"
            maxlength="200"
          />
          <view class="action-btns">
            <button class="btn-reject" @click="handleAudit(item.id, 'rejected')">拒绝</button>
            <button class="btn-approve" @click="handleAudit(item.id, 'approved')">通过</button>
          </view>
        </view>

        <view class="action-area" v-if="item.status === 'approved'">
          <button class="btn-revoke" @click="handleRevoke(item.user_id)">撤销头衔</button>
        </view>
      </view>

      <view v-if="list.length === 0" class="empty-state">
        <text>暂无认证申请</text>
      </view>

      <view class="load-more" v-if="hasMore">
        <text @click="loadMore">加载更多</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { titleCertApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'

const list = ref([])
const stats = ref({ pending: 0, approved: 0, rejected: 0 })
const currentStatus = ref('')
const page = ref(1)
const hasMore = ref(false)
const remarks = reactive({})

const statusMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

const loadStats = async () => {
  try {
    const res = await titleCertApi.getAdminStats()
    if (res.code === 200) {
      stats.value = res.data
    }
  } catch (e) {
    console.error('获取统计失败:', e)
  }
}

const loadList = async (reset = true) => {
  if (reset) {
    page.value = 1
    list.value = []
  }

  try {
    const res = await titleCertApi.getAdminList({
      status: currentStatus.value || undefined,
      page: page.value,
      pageSize: 10
    })
    if (res.code === 200) {
      if (reset) {
        list.value = res.data.list || []
      } else {
        list.value = [...list.value, ...(res.data.list || [])]
      }
      hasMore.value = list.value.length < res.data.total
    }
  } catch (e) {
    console.error('获取列表失败:', e)
  }
}

const changeStatus = (status) => {
  currentStatus.value = status
  loadList(true)
  loadStats()
}

const onRemarkInput = (id, e) => {
  remarks[id] = e.detail.value
}

const loadMore = () => {
  page.value++
  loadList(false)
}

const handleAudit = (id, status) => {
  const statusText = status === 'approved' ? '通过' : '拒绝'
  uni.showModal({
    title: '确认操作',
    content: `确定要${statusText}该认证申请吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await titleCertApi.audit(id, {
          status,
          review_remark: remarks[id] || null
        })
        if (result.code === 200) {
          uni.showToast({ title: result.msg || '操作成功', icon: 'success' })
          delete remarks[id]
          loadList(true)
          loadStats()
        }
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  })
}

const handleRevoke = (userId) => {
  uni.showModal({
    title: '确认撤销',
    content: '确定要撤销该用户的"已上岸"头衔吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await titleCertApi.revoke(userId)
        if (result.code === 200) {
          uni.showToast({ title: '已撤销头衔', icon: 'success' })
          loadList(true)
          loadStats()
        }
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  })
}

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return 'http://127.0.0.1:3000' + url
}

const previewImage = (url) => {
  uni.previewImage({
    current: getImageUrl(url),
    urls: [getImageUrl(url)]
  })
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadStats()
  loadList(true)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 30rpx 0;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.pending-num { color: #FF9500; }
.approved-num { color: #4CAF50; }
.rejected-num { color: #f44336; }

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.filter-bar {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx;
}

.filter-item {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  border-radius: 30rpx;
  background: #f5f5f5;
  font-size: 26rpx;
  color: #666;
}

.filter-item.active {
  background: #c53030;
  color: #fff;
}

.cert-card {
  padding: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.user-detail {
  flex: 1;
}

.user-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}

.user-meta {
  font-size: 24rpx;
  color: #999;
  display: block;
}

.status-tag {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.status-tag.pending { background: #fff3e0; color: #FF9500; }
.status-tag.approved { background: #e8f5e9; color: #4CAF50; }
.status-tag.rejected { background: #ffebee; color: #f44336; }

.screenshot-area {
  margin-bottom: 16rpx;
  text-align: center;
}

.screenshot-img {
  width: 100%;
  max-height: 500rpx;
  border-radius: 12rpx;
}

.preview-hint {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 8rpx;
}

.cert-desc {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
  padding: 16rpx;
  background: #f9f9f9;
  border-radius: 8rpx;
}

.card-footer {
  margin-bottom: 16rpx;
}

.cert-time, .review-time {
  font-size: 22rpx;
  color: #bbb;
  display: block;
  margin-bottom: 4rpx;
}

.review-remark {
  font-size: 24rpx;
  color: #f44336;
  display: block;
  margin-top: 8rpx;
}

.action-area {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
}

.remark-input {
  width: 100%;
  height: 120rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 26rpx;
  box-sizing: border-box;
  margin-bottom: 16rpx;
}

.action-btns {
  display: flex;
  gap: 20rpx;
}

.btn-reject {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  background: #ffebee;
  color: #f44336;
  font-size: 28rpx;
  border-radius: 36rpx;
  border: none;
}

.btn-approve {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  background: #e8f5e9;
  color: #4CAF50;
  font-size: 28rpx;
  border-radius: 36rpx;
  border: none;
}

.btn-revoke {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  background: #fff3e0;
  color: #FF9500;
  font-size: 28rpx;
  border-radius: 36rpx;
  border: none;
}

.empty-state {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

.load-more {
  text-align: center;
  padding: 20rpx 0;
  color: #007AFF;
  font-size: 26rpx;
}
</style>

<template>
  <view class="page">
    <scroll-view scroll-x class="filter-scroll">
      <view class="filter-list">
        <text
          v-for="item in categoryTabs"
          :key="item.key"
          class="filter-item"
          :class="{ active: currentCategory === item.key }"
          @click="switchCategory(item.key)"
        >
          {{ item.label }}
        </text>
      </view>
    </scroll-view>

    <view class="list-section">
      <view v-for="item in filteredUploads" :key="`${item.source_type}-${item.id}`" class="upload-item card">
        <view class="item-header" @click="viewUpload(item)">
          <view class="item-info">
            <text class="item-title">{{ item.title }}</text>
            <view class="item-meta">
              <text class="meta-tag">{{ item.source_label }}</text>
              <text class="meta-dot">·</text>
              <text class="meta-text">{{ formatRelativeTime(item.created_at) }}</text>
              <text v-if="item.file_size" class="meta-dot">·</text>
              <text v-if="item.file_size" class="meta-text">{{ formatFileSize(item.file_size) }}</text>
            </view>
          </view>
          <view class="audit-badge" :class="item.audit_status">
            <text class="badge-text">{{ getAuditLabel(item.audit_status) }}</text>
          </view>
        </view>

        <text class="item-desc">{{ getItemDescription(item) }}</text>

        <view class="item-actions">
          <view class="action-btn" @click="viewUpload(item)">
            <text class="action-text">查看</text>
          </view>
          <view
            v-if="canDownload(item)"
            class="action-btn"
            @click="downloadUpload(item)"
          >
            <text class="action-text">下载</text>
          </view>
          <view class="action-btn delete" @click="confirmDelete(item)">
            <text class="action-text">删除</text>
          </view>
        </view>
      </view>

      <view v-if="filteredUploads.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📂</text>
        <text class="empty-text">当前分类暂无上传内容</text>
        <text class="empty-hint">你在资料中心和复试资料箱上传的内容都会汇总在这里。</text>
      </view>
    </view>

    <view v-if="loading" class="loading-tip">
      <text>加载中...</text>
    </view>

    <view v-if="detailVisible && activeItem" class="modal-mask" @click="closeDetail">
      <view class="detail-modal card" @click.stop>
        <view class="detail-header">
          <text class="detail-title">上传详情</text>
          <text class="detail-close" @click="closeDetail">×</text>
        </view>

        <view class="detail-body">
          <view class="detail-row">
            <text class="detail-label">类型</text>
            <text class="detail-value">{{ activeItem.source_label }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">标题</text>
            <text class="detail-value">{{ activeItem.title }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">状态</text>
            <text class="detail-value">{{ getAuditLabel(activeItem.audit_status) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">上传时间</text>
            <text class="detail-value">{{ formatDateTime(activeItem.created_at) }}</text>
          </view>

          <template v-if="activeItem.source_type === 'material'">
            <view class="detail-row">
              <text class="detail-label">资料分类</text>
              <text class="detail-value">{{ activeItem.category_name || '未分类' }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">资料描述</text>
              <text class="detail-value multiline">{{ activeItem.description || '暂无描述' }}</text>
            </view>
          </template>

          <template v-if="activeItem.source_type === 'oral'">
            <view class="detail-row">
              <text class="detail-label">英文问题</text>
              <text class="detail-value multiline">{{ activeItem.question_en || '-' }}</text>
            </view>
            <view class="detail-row" v-if="activeItem.question_cn">
              <text class="detail-label">中文翻译</text>
              <text class="detail-value multiline">{{ activeItem.question_cn }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">参考回答</text>
              <text class="detail-value multiline">{{ activeItem.reference_answer || '-' }}</text>
            </view>
          </template>

          <template v-if="activeItem.source_type === 'resume' || activeItem.source_type === 'email'">
            <view class="detail-row">
              <text class="detail-label">文件名</text>
              <text class="detail-value">{{ activeItem.file_name || '-' }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">文件大小</text>
              <text class="detail-value">{{ formatFileSize(activeItem.file_size) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">模板说明</text>
              <text class="detail-value multiline">{{ activeItem.desc || '暂无说明' }}</text>
            </view>
          </template>
        </view>

        <view class="detail-actions">
          <button v-if="activeItem.source_type === 'material'" class="primary-btn" @click="goMaterialDetail(activeItem)">
            查看资料页
          </button>
          <button v-if="canDownload(activeItem)" class="primary-btn" @click="downloadUpload(activeItem)">
            下载内容
          </button>
        </view>
      </view>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { interviewApi, materialApi } from '@/api/index'
import { formatDateTime, formatRelativeTime } from '@/utils/date'

const categoryTabs = [
  { key: 'all', label: '全部' },
  { key: 'material', label: '资料' },
  { key: 'oral', label: '英语口语模板' },
  { key: 'resume', label: '简历模板' },
  { key: 'email', label: '导师邮件模板' }
]

const currentCategory = ref('all')
const loading = ref(false)
const uploadList = ref([])
const detailVisible = ref(false)
const activeItem = ref(null)

const filteredUploads = computed(() => {
  const list = uploadList.value
  if (currentCategory.value === 'all') return list
  return list.filter((item) => item.source_type === currentCategory.value)
})

const normalizeMaterialItems = (list) => {
  return (list || []).map((item) => ({
    ...item,
    source_type: 'material',
    source_label: '资料'
  }))
}

const normalizeInterviewItems = (res) => {
  return [
    ...(res?.data?.oral || []),
    ...(res?.data?.resume || []),
    ...(res?.data?.email || [])
  ]
}

const sortUploads = (list) => {
  return [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

const loadUploads = async () => {
  loading.value = true
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uploadList.value = []
      return
    }

    const [materialRes, interviewRes] = await Promise.all([
      materialApi.getMyUploads({ page: 1, pageSize: 1000 }),
      interviewApi.getMyUploads()
    ])

    const materialItems = normalizeMaterialItems(materialRes.data?.list || [])
    const interviewItems = normalizeInterviewItems(interviewRes)
    uploadList.value = sortUploads([...materialItems, ...interviewItems])
  } catch (e) {
    console.error('加载我的上传失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const switchCategory = (key) => {
  currentCategory.value = key
}

const getAuditLabel = (status) => {
  const map = {
    pending: '审核中',
    approved: '已通过',
    rejected: '未通过'
  }
  return map[status] || '未知状态'
}

const getItemDescription = (item) => {
  if (item.source_type === 'material') {
    return item.description || '资料中心上传内容'
  }
  if (item.source_type === 'oral') {
    return item.reference_answer || item.question_en || '英语口语题库上传内容'
  }
  return item.desc || '复试资料箱上传内容'
}

const canDownload = (item) => {
  return item.audit_status === 'approved' && ['material', 'resume', 'email'].includes(item.source_type)
}

const viewUpload = (item) => {
  activeItem.value = item
  detailVisible.value = true
}

const closeDetail = () => {
  detailVisible.value = false
  activeItem.value = null
}

const goMaterialDetail = (item) => {
  uni.navigateTo({ url: `/pages/materials/detail?id=${item.id}` })
}

const downloadUpload = (item) => {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }

  let url = ''
  if (item.source_type === 'material') {
    url = `http://127.0.0.1:3000/api/material/download/${item.id}`
  } else if (item.source_type === 'resume') {
    url = `http://127.0.0.1:3000/api/interview/resume-templates/${item.id}/download`
  } else if (item.source_type === 'email') {
    url = `http://127.0.0.1:3000/api/interview/email-templates/${item.id}/download`
  }

  if (!url) return

  uni.showLoading({ title: '下载中...' })
  uni.downloadFile({
    url,
    header: { Authorization: `Bearer ${token}` },
    success: (res) => {
      uni.hideLoading()
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true
        })
      } else {
        uni.showToast({ title: '下载失败', icon: 'none' })
      }
    },
    fail: (err) => {
      uni.hideLoading()
      console.error('下载失败:', err)
      uni.showToast({ title: '下载失败，请检查网络', icon: 'none' })
    }
  })
}

const deleteUpload = async (item) => {
  if (item.source_type === 'material') {
    await materialApi.deleteMaterial(item.id)
    return
  }
  if (item.source_type === 'oral') {
    await interviewApi.deleteOralQuestion(item.id)
    return
  }
  if (item.source_type === 'resume') {
    await interviewApi.deleteResumeTemplate(item.id)
    return
  }
  if (item.source_type === 'email') {
    await interviewApi.deleteEmailTemplate(item.id)
  }
}

const confirmDelete = (item) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除“${item.title}”吗？删除后不可恢复。`,
    confirmColor: '#ff3b30',
    success: async (res) => {
      if (!res.confirm) return

      try {
        await deleteUpload(item)
        if (activeItem.value && activeItem.value.id === item.id && activeItem.value.source_type === item.source_type) {
          closeDetail()
        }
        uni.showToast({ title: '删除成功', icon: 'success' })
        loadUploads()
      } catch (e) {
        console.error('删除上传内容失败:', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0B'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

onShow(() => {
  loadUploads()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.filter-scroll {
  white-space: nowrap;
  background: #fff;
  padding: 20rpx 24rpx 16rpx;
}

.filter-list {
  display: inline-flex;
  gap: 16rpx;
}

.filter-item {
  display: inline-block;
  padding: 10rpx 28rpx;
  background: #f5f5f5;
  border-radius: 24rpx;
  font-size: 26rpx;
  color: #666;
}

.filter-item.active {
  background: #007aff;
  color: #fff;
}

.list-section {
  padding: 20rpx 24rpx;
}

.upload-item {
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-info {
  flex: 1;
  margin-right: 16rpx;
}

.item-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 10rpx;
}

.item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 22rpx;
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  margin-right: 8rpx;
}

.meta-dot {
  font-size: 22rpx;
  color: #ccc;
  margin: 0 4rpx;
}

.meta-text {
  font-size: 22rpx;
  color: #999;
}

.item-desc {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.audit-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.audit-badge.pending {
  background: rgba(255, 149, 0, 0.1);
}

.audit-badge.approved {
  background: rgba(76, 175, 80, 0.1);
}

.audit-badge.rejected {
  background: rgba(255, 59, 48, 0.1);
}

.badge-text {
  font-size: 22rpx;
  font-weight: 500;
}

.audit-badge.pending .badge-text {
  color: #ff9500;
}

.audit-badge.approved .badge-text {
  color: #4caf50;
}

.audit-badge.rejected .badge-text {
  color: #ff3b30;
}

.item-actions {
  display: flex;
  gap: 28rpx;
  padding-top: 18rpx;
  margin-top: 18rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  display: flex;
  align-items: center;
}

.action-text {
  font-size: 24rpx;
  color: #666;
}

.action-btn.delete .action-text {
  color: #ff3b30;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 88rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}

.loading-tip {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.detail-modal {
  width: 86%;
  max-height: 80vh;
  padding: 28rpx;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.detail-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.detail-close {
  font-size: 40rpx;
  color: #999;
  line-height: 1;
}

.detail-body {
  max-height: 52vh;
  overflow-y: auto;
}

.detail-row {
  margin-bottom: 16rpx;
}

.detail-label {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-bottom: 6rpx;
}

.detail-value {
  display: block;
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}

.detail-value.multiline {
  white-space: pre-wrap;
}

.detail-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.primary-btn {
  flex: 1;
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 39rpx;
  background: linear-gradient(135deg, #007aff, #00c6ff);
  color: #fff;
  font-size: 28rpx;
  border: none;
}
</style>

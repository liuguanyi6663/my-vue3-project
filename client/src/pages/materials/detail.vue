<template>
  <view class="page" v-if="detail">
    <view class="card detail-header">
      <text class="detail-title">{{ detail.title }}</text>
      <view class="detail-meta">
        <text class="meta-tag">{{ detail.category_name || '未分类' }}</text>
        <text v-if="detail.year" class="meta-tag">{{ detail.year }}年</text>
      </view>
      <view class="detail-stats">
        <text>📥 {{ detail.download_count }}次下载</text>
        <text style="margin-left: 20rpx;">👁 {{ detail.view_count }}次预览</text>
      </view>
    </view>

    <view class="card" v-if="detail.description">
      <text class="section-title">资料简介</text>
      <text class="desc-text">{{ detail.description }}</text>
    </view>

    <view class="card file-info-card">
      <text class="section-title">文件信息</text>
      <view class="file-info-row">
        <view class="file-icon-large">{{ getFileIcon(detail.file_path) }}</view>
        <view class="file-detail">
          <text class="file-detail-name">{{ detail.file_name || '未知文件' }}</text>
          <view class="file-detail-meta">
            <text class="file-detail-tag">{{ getFileType(detail.file_path).toUpperCase() || '未知' }}</text>
            <text class="file-detail-size">{{ formatFileSize(detail.file_size) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card action-bar">
      <button 
        class="action-btn favorite-btn"
        :class="{ active: isFavorited }"
        @click="toggleFavorite"
      >{{ isFavorited ? '已收藏' : '收藏' }}</button>
      <button 
        class="action-btn like-btn"
        :class="{ active: isLiked }"
        @click="toggleLike"
      >👍 {{ likeCount }}</button>
      <button class="action-btn preview-btn" @click="previewFile">在线预览</button>
      <button class="action-btn download-btn" @click="downloadMaterial">下载文件</button>
      <button v-if="canDelete" class="action-btn delete-btn" @click="deleteMaterial">删除</button>
    </view>

    <!-- 评价区域 -->
    <view class="card review-section">
      <view class="flex-between mb-20">
        <text class="section-title">用户评价 ({{ detail.review_count }})</text>
      </view>

      <view class="rating-input" v-if="!showReplyInput">
        <text class="rate-label">评分：</text>
        <text
          v-for="i in 5" :key="i"
          class="rate-star"
          :class="{ active: i <= currentRating }"
          @click="currentRating = i"
        >★</text>
      </view>

      <textarea
        v-if="!showReplyInput"
        class="review-input"
        v-model="reviewContent"
        placeholder="写下你的评价..."
        maxlength="200"
      />
      <button
        v-if="!showReplyInput && currentRating > 0 && reviewContent.trim()"
        class="btn-primary"
        style="margin-top: 16rpx; font-size: 26rpx;"
        @click="submitReview"
      >提交评价</button>

      <!-- 回复输入框 -->
      <view class="reply-input-box" v-if="showReplyInput">
        <view class="reply-to-info">
          <text>回复 @{{ replyingTo.nickname }}</text>
          <text class="cancel-reply" @click="cancelReply">取消</text>
        </view>
        <textarea
          class="review-input"
          v-model="replyContent"
          placeholder="写下你的回复..."
          maxlength="200"
        />
        <button
          class="btn-primary"
          style="margin-top: 16rpx; font-size: 26rpx;"
          @click="submitReply"
        >提交回复</button>
      </view>

      <view class="review-list">
        <view class="review-item" v-for="(item, index) in (detail.reviews || [])" :key="index">
          <view class="review-header">
            <image class="avatar" :src="getAvatarUrl(item.avatar)" mode="aspectFill" @click="goUserProfile(item.user_id)" />
            <view class="review-header-info">
              <text class="reviewer-name">{{ item.nickname }}</text>
              <view class="review-stars" v-if="item.score">
                <text v-for="s in 5" :key="s" class="star-small" :class="{ active: s <= item.score }">★</text>
              </view>
            </view>
          </view>
          <text class="review-text" v-if="item.comment">{{ item.comment }}</text>
          <view class="review-actions">
            <text class="review-time">{{ formatTime(item.created_at) }}</text>
            <view class="review-btns">
              <view class="review-action-btn" :class="{ liked: item.isLiked }" @click="toggleReviewLike(item)">
                <text>{{ item.isLiked ? '❤️' : '🤍' }} {{ item.like_count || 0 }}</text>
              </view>
              <view class="review-action-btn reply-btn" @click="showReplyBox(item)">
                <text>💬 回复 {{ item.reply_count || 0 }}</text>
              </view>
              <view class="review-action-btn report-btn" @click="showReportModal(item)">
                <text>🚫</text>
              </view>
              <view class="review-action-btn delete-btn" v-if="canDeleteReview(item)" @click="deleteReview(item)">
                <text>🗑️</text>
              </view>
            </view>
          </view>

          <!-- 回复列表 -->
          <view class="reply-list" v-if="item.replies && item.replies.length > 0">
            <template v-for="(reply, rIdx) in item.replies" :key="rIdx">
              <view class="reply-item" v-if="expandedReviews[item.id] || rIdx < 2">
                <view class="reply-header">
                  <image class="avatar-small" :src="reply.avatar || '/static/default-avatar.png'" mode="aspectFill" />
                  <text class="replyer-name">{{ reply.nickname }}</text>
                  <text class="reply-to" v-if="reply.reply_to_nickname">回复 @{{ reply.reply_to_nickname }}</text>
                </view>
                <text class="reply-text">{{ reply.comment }}</text>
                <view class="reply-actions">
                  <text class="reply-time">{{ formatTime(reply.created_at) }}</text>
                  <view class="review-btns">
                    <view class="review-action-btn" :class="{ liked: reply.isLiked }" @click="toggleReviewLike(reply)">
                      <text>{{ reply.isLiked ? '❤️' : '🤍' }} {{ reply.like_count || 0 }}</text>
                    </view>
                    <view class="review-action-btn reply-btn" @click="showReplyBox(item, reply)">
                      <text>💬 回复</text>
                    </view>
                    <view class="review-action-btn report-btn" @click="showReportModal(reply)">
                      <text>🚫</text>
                    </view>
                    <view class="review-action-btn delete-btn" v-if="canDeleteReview(reply)" @click="deleteReview(reply)">
                      <text>🗑️</text>
                    </view>
                  </view>
                </view>
              </view>
            </template>

            <!-- 展开收起 -->
            <view v-if="(item.total_replies || item.replies.length) > 2" class="expand-toggle" @click="toggleExpand(item.id)">
              <text>{{ expandedReviews[item.id] ? '收起回复' : `展开全部 ${item.total_replies || item.replies.length} 条回复` }} ▼</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!detail.reviews?.length" class="empty-review">
        <text>暂无评价，快来第一个评价吧~</text>
      </view>
    </view>

    <view style="height: 120rpx;"></view>

    <view class="report-modal" v-if="reportModalVisible" @tap.stop="closeReportModal">
      <view class="report-content" @tap.stop="() => {}">
        <text class="report-title">举报评论</text>
        <view class="report-reasons">
          <view
            class="reason-item"
            :class="{ active: reportReason === reason }"
            v-for="reason in reportReasons"
            :key="reason"
            @tap.stop="selectReportReason(reason)"
          >
            <text>{{ reason }}</text>
          </view>
        </view>
        <textarea 
          class="report-desc" 
          v-model="reportDescription" 
          placeholder="补充说明（选填）"
          maxlength="200"
        />
        <view class="report-actions">
          <button class="report-cancel" @tap.stop="closeReportModal">取消</button>
          <button class="report-confirm" @tap.stop="submitReport">提交举报</button>
        </view>
      </view>
    </view>
  </view>
  
  <view v-else class="loading-page">
    <text>加载中...</text>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { materialApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'
import { formatDate as formatDateUtil } from '@/utils/date'
import { ensureAuthorize } from '@/utils/authorize'

const detail = ref(null)
const reviews = ref([])
const isFavorited = ref(false)
const isLiked = ref(false)
const likeCount = ref(0)
const currentRating = ref(0)
const reviewContent = ref('')
const showReplyInput = ref(false)
const replyingTo = ref(null)
const replyContent = ref('')
const replyingToReview = ref(null)
const expandedReviews = ref({})

const toggleExpand = (reviewId) => {
  expandedReviews.value[reviewId] = !expandedReviews.value[reviewId]
}

const loadDetail = async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = currentPage.options?.id
  
  if (!id) return
  
  try {
    const res = await materialApi.getDetail(id)
    detail.value = res.data
    isFavorited.value = res.data.isFavorited
    isLiked.value = res.data.isLiked || false
    likeCount.value = res.data.like_count || 0
    checkDeletePermission()
  } catch (e) {
    console.error(e)
  }
}

const isImageFile = (filePath) => {
  if (!filePath) return false
  const ext = filePath.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)
}

const getDocFileType = (filePath) => {
  if (!filePath) return ''
  const ext = filePath.split('.').pop().toLowerCase()
  const docTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  return docTypes.includes(ext) ? ext : ''
}

const getFileType = (filePath) => {
  if (!filePath) return ''
  const ext = filePath.split('.').pop().toLowerCase()
  const typeMap = {
    pdf: 'pdf',
    doc: 'doc', docx: 'docx',
    xls: 'xls', xlsx: 'xlsx',
    ppt: 'ppt', pptx: 'pptx',
    jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif',
    txt: 'txt',
    zip: 'zip', rar: 'rar'
  }
  return typeMap[ext] || ext
}

const getFileIcon = (filePath) => {
  if (!filePath) return '📄'
  const ext = filePath.split('.').pop().toLowerCase()
  const iconMap = {
    pdf: '📕', doc: '📘', docx: '📘',
    xls: '📗', xlsx: '📗',
    ppt: '📙', pptx: '📙',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
    txt: '📝', zip: '📦', rar: '📦'
  }
  return iconMap[ext] || '📄'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0B'
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

const downloadMaterial = async () => {
  try {
    uni.showLoading({ title: '准备下载...' })

    const token = uni.getStorageSync('token')
    if (!token) {
      uni.hideLoading()
      return uni.navigateTo({ url: '/pages/login/login' })
    }

    if (isImageFile(detail.value.file_path)) {
      const authorized = await ensureAuthorize('writePhotosAlbum')
      if (!authorized) {
        uni.hideLoading()
        return
      }
    }

    uni.downloadFile({
      url: `http://127.0.0.1:3000/api/material/download/${detail.value.id}`,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.statusCode === 200) {
          if (isImageFile(detail.value.file_path)) {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                uni.showToast({ title: '已保存到相册', icon: 'success' })
              },
              fail: () => {
                uni.previewImage({
                  urls: [res.tempFilePath],
                  current: res.tempFilePath
                })
              }
            })
          } else {
            const docType = getDocFileType(detail.value.file_path)
            if (docType) {
              uni.openDocument({
                filePath: res.tempFilePath,
                fileType: docType,
                showMenu: true,
                success: () => {
                  uni.showToast({ title: '下载成功', icon: 'success' })
                },
                fail: (err) => {
                  console.error('打开文档失败:', err)
                  uni.showToast({ title: '文件打开失败，请重试', icon: 'none' })
                }
              })
            } else {
              uni.openDocument({
                filePath: res.tempFilePath,
                showMenu: true,
                success: () => {
                  uni.showToast({ title: '下载成功', icon: 'success' })
                },
                fail: () => {
                  uni.showToast({ title: '该文件类型暂不支持打开', icon: 'none' })
                }
              })
            }
          }
        } else if (res.statusCode === 404) {
          uni.showToast({ title: '文件不存在', icon: 'none' })
        } else {
          uni.showToast({ title: '下载失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('下载失败:', err)
        uni.showToast({ title: '下载失败，请检查网络', icon: 'none' })
      },
      complete: () => {
        uni.hideLoading()
      }
    })
  } catch (e) {
    uni.hideLoading()
    console.error(e)
    uni.showToast({ title: '下载异常', icon: 'none' })
  }
}

const toggleFavorite = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 1000)
      return
    }
    const res = await materialApi.toggleFavorite(detail.value.id)
    if (res.code === 200) {
      isFavorited.value = res.data.isFavorite
      uni.showToast({ title: isFavorited.value ? '收藏成功' : '已取消收藏', icon: 'success' })
    } else {
      uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
    }
  } catch (e) {
    console.error('收藏操作失败:', e)
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const toggleLike = async () => {
  try {
    const res = await materialApi.toggleLike(detail.value.id)
    if (res.code === 200) {
      isLiked.value = res.data.isLiked
      likeCount.value = res.data.likeCount || likeCount.value + (isLiked.value ? 1 : -1)
      uni.showToast({ title: isLiked.value ? '点赞成功' : '已取消点赞', icon: 'success' })
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const previewFile = () => {
  const token = uni.getStorageSync('token')
  const filePath = detail.value.file_path
  
  if (isImageFile(filePath)) {
    const fileUrl = 'http://127.0.0.1:3000' + filePath
    uni.previewImage({
      urls: [fileUrl],
      current: fileUrl
    })
    return
  }
  
  uni.showLoading({ title: '加载预览...' })
  
  const fileUrl = 'http://127.0.0.1:3000' + filePath
  uni.downloadFile({
    url: fileUrl,
    header: token ? { 'Authorization': `Bearer ${token}` } : {},
    success: (downloadRes) => {
      if (downloadRes.statusCode === 200) {
        const docType = getDocFileType(filePath)
        if (docType) {
          uni.openDocument({
            filePath: downloadRes.tempFilePath,
            fileType: docType,
            showMenu: true,
            success: () => {
              uni.hideLoading()
            },
            fail: (err) => {
              console.error('预览失败:', err)
              uni.hideLoading()
              uni.showToast({ title: '该文件类型暂不支持预览', icon: 'none' })
            }
          })
        } else {
          uni.hideLoading()
          uni.showToast({ title: '该文件类型暂不支持预览', icon: 'none' })
        }
      } else {
        uni.hideLoading()
        uni.showToast({ title: '文件加载失败', icon: 'none' })
      }
    },
    fail: (err) => {
      console.error('文件下载失败:', err)
      uni.hideLoading()
      uni.showToast({ title: '文件加载失败，请检查网络', icon: 'none' })
    }
  })
}

const submitReview = async () => {
  if (!currentRating.value) {
    return uni.showToast({ title: '请选择评分', icon: 'none' })
  }
  if (!reviewContent.value.trim()) {
    return uni.showToast({ title: '请输入评价内容', icon: 'none' })
  }

  try {
    await materialApi.review(detail.value.id, {
      score: currentRating.value,
      comment: reviewContent.value
    })
    uni.showToast({ title: '评价成功', icon: 'success' })
    reviewContent.value = ''
    currentRating.value = 0
    setTimeout(() => loadDetail(), 1000)
  } catch (e) {
    console.error(e)
    uni.showToast({ title: e.message || '评价失败', icon: 'none' })
  }
}

const showReplyBox = (review, replyTo) => {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 1000)
    return
  }
  replyingTo.value = replyTo || review
  replyingToReview.value = review
  replyContent.value = ''
  showReplyInput.value = true
}

const cancelReply = () => {
  showReplyInput.value = false
  replyingTo.value = null
  replyingToReview.value = null
  replyContent.value = ''
}

const submitReply = async () => {
  if (!replyContent.value.trim()) {
    return uni.showToast({ title: '请输入回复内容', icon: 'none' })
  }

  try {
    await materialApi.review(detail.value.id, {
      comment: replyContent.value,
      parent_id: replyingToReview.value.id,
      reply_to_user_id: replyingTo.value.user_id || replyingTo.value.id
    })
    uni.showToast({ title: '回复成功', icon: 'success' })
    replyContent.value = ''
    cancelReply()
    setTimeout(() => loadDetail(), 1000)
  } catch (e) {
    console.error(e)
    uni.showToast({ title: e.message || '回复失败', icon: 'none' })
  }
}

const formatTime = (timeStr) => formatDateUtil(timeStr)

const goUserProfile = (userId) => {
  if (!userId) return
  const currentUserId = uni.getStorageSync('userInfo')
  try {
    const parsed = JSON.parse(currentUserId)
    if (parsed && parsed.id === userId) {
      uni.navigateTo({ url: '/pages/mine/profile' })
      return
    }
  } catch (e) {}
  uni.navigateTo({ url: `/pages/mine/user-profile?userId=${userId}` })
}

const canDelete = ref(false)

const checkDeletePermission = () => {
  const userInfo = uni.getStorageSync('userInfo') || {}
  if (userInfo.role === 'admin' || userInfo.role === 'super_admin') {
    canDelete.value = true
    return
  }
  if (detail.value && detail.value.uploader_id === userInfo.id) {
    canDelete.value = true
    return
  }
  canDelete.value = false
}

const canDeleteReview = (review) => {
  const userInfo = uni.getStorageSync('userInfo') || {}
  return review.user_id === userInfo.id || userInfo.role === 'admin' || userInfo.role === 'super_admin'
}

const toggleReviewLike = async (review) => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 1000)
      return
    }
    const res = await materialApi.likeReview(review.id)
    if (res.code === 200) {
      review.isLiked = res.data.isLiked
      review.like_count = res.data.likeCount
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const reportModalVisible = ref(false)
const reportReason = ref('')
const reportDescription = ref('')
const reportingReview = ref(null)
const reportReasons = ['垃圾广告', '色情低俗', '违法违规', '人身攻击', '虚假信息', '其他']

const selectReportReason = (reason) => {
  reportReason.value = reason
  console.log('Selected reason:', reason)
}

const showReportModal = (review) => {
  console.log('showReportModal called with:', review)
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 1000)
    return
  }
  reportingReview.value = review
  reportReason.value = ''
  reportDescription.value = ''
  reportModalVisible.value = true
  console.log('Report modal should be visible now, visible:', reportModalVisible.value)
}

const closeReportModal = () => {
  reportModalVisible.value = false
}

const submitReport = async () => {
  console.log('submitReport called, reason:', reportReason.value, 'description:', reportDescription.value, 'review:', reportingReview.value)
  if (!reportReason.value) {
    return uni.showToast({ title: '请选择举报原因', icon: 'none' })
  }
  try {
    console.log('Calling reportReview API with:', reportingReview.value.id, { reason: reportReason.value, description: reportDescription.value })
    const res = await materialApi.reportReview(reportingReview.value.id, {
      reason: reportReason.value,
      description: reportDescription.value
    })
    console.log('reportReview API response:', res)
    if (res.code === 200) {
      uni.showToast({ title: '举报成功', icon: 'success' })
      reportModalVisible.value = false
    } else {
      uni.showToast({ title: res.msg || '举报失败', icon: 'none' })
    }
  } catch (e) {
    console.error('Report error:', e)
    uni.showToast({ title: '举报失败', icon: 'none' })
  }
}

const deleteReview = async (review) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这条评论吗？',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        const res = await materialApi.deleteReview(review.id)
        if (res.code === 200) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => loadDetail(), 1000)
        } else {
          uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
        }
      } catch (e) {
        console.error('删除评论失败:', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

const deleteMaterial = async () => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这个资料吗？',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        await materialApi.deleteMaterial(detail.value.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => { uni.navigateBack() }, 1500)
      } catch (e) {
        console.error(e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.detail-header {
  padding: 30rpx;
}

.detail-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.5;
  display: block;
  margin-bottom: 20rpx;
}

.detail-meta {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.meta-tag {
  background: #e8f4ff;
  color: #007AFF;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.detail-stats {
  font-size: 26rpx;
  color: #999;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.desc-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

.file-info-card {
  padding: 30rpx;
}

.file-info-row {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
}

.file-icon-large {
  font-size: 64rpx;
  margin-right: 24rpx;
}

.file-detail {
  flex: 1;
}

.file-detail-name {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
  word-break: break-all;
}

.file-detail-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.file-detail-tag {
  font-size: 22rpx;
  color: #007AFF;
  background: #e8f4ff;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.file-detail-size {
  font-size: 22rpx;
  color: #999;
}

.action-bar {
  display: flex;
  gap: 24rpx;
  padding: 30rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}

.download-btn {
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  color: #fff;
}

.favorite-btn {
  background: #f5f5f5;
  color: #666;
}

.favorite-btn.active {
  background: #fff3e0;
  color: #ff9500;
}

.action-btn.like-btn {
  background: #fff;
  color: #333;
}

.action-btn.like-btn.active {
  background: #ff3b30;
  color: #fff;
}

.action-btn.preview-btn {
  background: #007AFF;
  color: #fff;
}

.action-btn.delete-btn {
  background: #ff3b30;
  color: #fff;
}

.review-section {
  padding: 30rpx;
}

.rating-input {
  display: flex;
  align-items: center;
}

.rate-label {
  font-size: 26rpx;
  color: #666;
  margin-right: 12rpx;
}

.rate-star {
  font-size: 36rpx;
  color: #ddd;
  margin-right: 4rpx;
}

.rate-star.active {
  color: #ff9500;
}

.review-input {
  width: 100%;
  height: 150rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}

.review-list {
  margin-top: 20rpx;
}

.review-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.reviewer-name {
  font-size: 26rpx;
  color: #333;
  margin-right: 16rpx;
}

.review-stars {
  display: flex;
}

.star-small {
  font-size: 22rpx;
  color: #ddd;
}

.star-small.active {
  color: #ff9500;
}

.review-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: block;
  margin-bottom: 8rpx;
}

.review-time {
  font-size: 22rpx;
  color: #bbb;
}

.review-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rpx;
}

.review-btns {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.review-action-btn {
  font-size: 22rpx;
  color: #999;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
}

.review-action-btn.liked {
  color: #ff3b30;
  background: #fff0f0;
}

.review-action-btn.report-btn {
  cursor: pointer;
  user-select: none;
}

.review-action-btn.report-btn:active {
  background: #fff3e0;
}

.review-action-btn.delete-btn {
  color: #ff3b30;
}

.review-action-btn.delete-btn:active {
  background: #fff0f0;
}

.reply-btn {
  color: #007AFF;
}

.reply-input-box {
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-top: 20rpx;
}

.reply-to-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  font-size: 26rpx;
  color: #666;
}

.cancel-reply {
  color: #ff3b30;
  font-size: 24rpx;
}

.review-header-info {
  display: flex;
  flex-direction: column;
}

.reply-list {
  margin-top: 16rpx;
  padding-left: 30rpx;
  border-left: 4rpx solid #f0f0f0;
}

.reply-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-header {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.avatar-small {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.replyer-name {
  font-size: 24rpx;
  color: #007AFF;
}

.reply-to {
  font-size: 22rpx;
  color: #999;
  margin-left: 12rpx;
}

.reply-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
  display: block;
  margin-bottom: 8rpx;
  padding-left: 52rpx;
}

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 52rpx;
}

.reply-time {
  font-size: 20rpx;
  color: #bbb;
}

.expand-toggle {
  text-align: center;
  padding: 12rpx 0;
  margin-top: 8rpx;
}

.expand-toggle text {
  font-size: 24rpx;
  color: #007AFF;
}

.report-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.report-content {
  width: 600rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
}

.report-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 30rpx;
}

.report-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.reason-item {
  padding: 12rpx 24rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #666;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.reason-item.active {
  border-color: #007AFF;
  background: #e6f2ff;
  color: #007AFF;
}

.reason-item:active {
  transform: scale(0.95);
  background: #f0f0f0;
}

.reason-item.active {
  border-color: #ff3b30;
  color: #ff3b30;
  background: #fff0f0;
}

.report-desc {
  width: 100%;
  height: 120rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 26rpx;
  box-sizing: border-box;
  margin-bottom: 24rpx;
}

.report-actions {
  display: flex;
  gap: 20rpx;
}

.report-cancel {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  background: #f5f5f5;
  color: #666;
  border: none;
}

.report-confirm {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  background: #ff3b30;
  color: #fff;
  border: none;
}

.empty-review {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 26rpx;
}

.loading-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

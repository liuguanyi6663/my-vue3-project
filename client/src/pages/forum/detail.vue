<template>
  <view class="page" v-if="processedPost">
    <!-- 帖子内容 -->
    <view class="card post-detail">
      <view class="post-header">
        <image class="avatar" :src="getAvatarUrl(processedPost.author_avatar)" mode="aspectFill" @click="goUserProfile(processedPost.user_id, processedPost.is_anonymous)" />
        <view class="author-info">
          <view class="author-name-row">
            <text class="author-name">{{ processedPost.display_name || processedPost.author_name }}</text>
            <text class="landed-badge" v-if="processedPost.author_is_landed === 1 && !processedPost.is_anonymous">已上岸</text>
          </view>
          <text class="post-time">{{ formatTime(processedPost.created_at) }}</text>
        </view>
        <view class="post-tags">
          <text v-if="processedPost.is_essence" class="tag essence">精华</text>
          <text v-if="processedPost.is_top" class="tag top">置顶</text>
        </view>
      </view>

      <text class="post-title">{{ processedPost.title }}</text>
      <view class="post-content">
        <rich-text :nodes="processedPost.content"></rich-text>
      </view>

      <view class="post-images" v-if="processedPost.images?.length">
        <image
          v-for="(img, index) in parseImages(processedPost.images)"
          :key="index"
          class="post-image"
          :src="img"
          mode="widthFix"
          @click="previewImage(img, parseImages(processedPost.images))"
        />
      </view>

      <view class="post-stats">
        <text>{{ processedPost.view_count }} 浏览</text>
        <text style="margin: 0 20rpx;">·</text>
        <text>发布于 {{ getCategoryName(processedPost.category) }}</text>
      </view>
    </view>

    <!-- 互动栏 -->
    <view class="action-bar card">
      <button class="action-btn" :class="{ active: processedPost.isLiked }" @click="toggleLike">
        {{ processedPost.isLiked ? '❤️' : '🤍' }} {{ processedPost.like_count }}
      </button>
      <button class="action-btn" :class="{ active: processedPost.isFavorited }" @click="toggleFavorite">
        {{ processedPost.isFavorited ? '⭐' : '☆' }} 收藏
      </button>
      <button class="action-btn report-btn" @click="showReport">举报</button>
      <button v-if="processedPost.canDelete" class="action-btn delete-btn" @click="deletePost">🗑️ 删除</button>
    </view>

    <!-- 评论区 -->
    <view class="card comment-section">
      <view class="flex-between mb-20">
        <text class="section-title">评论 ({{ processedPost.comment_count }})</text>
      </view>

      <!-- 禁言提示 -->
      <view class="banned-tip" v-if="isBanned">
        <text class="banned-tip-text">🔇 你已被禁言，请联系管理员解决</text>
      </view>

      <!-- 评论输入框 -->
      <view class="comment-input-area" v-if="!showReplyInput && !isBanned">
        <textarea
          class="comment-textarea"
          v-model="commentText"
          placeholder="写下你的评论..."
          maxlength="200"
        />
        <button
          class="btn-primary submit-comment-btn"
          @click="submitComment"
          :disabled="!commentText.trim()"
        >发表评论</button>
      </view>

      <!-- 回复输入框 -->
      <view class="reply-input-box" v-if="showReplyInput && !isBanned">
        <view class="reply-to-info">
          <text>回复 @{{ replyingTo.nickname }}</text>
          <text class="cancel-reply" @click="cancelReply">取消</text>
        </view>
        <textarea
          class="comment-textarea"
          v-model="replyContent"
          placeholder="写下你的回复..."
          maxlength="200"
        />
        <button
          class="btn-primary submit-comment-btn"
          @click="submitReply"
        >提交回复</button>
      </view>

      <!-- 评论列表 -->
      <view class="comment-list">
        <view class="comment-item" v-for="(item, index) in (processedPost.comments || [])" :key="index">
          <view class="comment-header">
            <image class="avatar" :src="getAvatarUrl(item.avatar)" mode="aspectFill" @click="goUserProfile(item.user_id)" />
            <view class="comment-header-info">
              <view class="commenter-name-row">
                <text class="commenter-name">{{ item.nickname }}</text>
                <text class="landed-badge-small" v-if="item.is_landed === 1">已上岸</text>
              </view>
            </view>
          </view>
          <text class="comment-text" v-if="item.content">{{ item.content }}</text>
          <view class="comment-actions">
            <text class="comment-time">{{ formatTime(item.created_at) }}</text>
            <view class="comment-btns">
              <view class="comment-action-btn" :class="{ liked: item.isLiked }" @click="toggleCommentLike(item)">
                <text>{{ item.isLiked ? '❤️' : '🤍' }} {{ item.like_count || 0 }}</text>
              </view>
              <view class="comment-action-btn reply-btn" @click="showReplyBox(item)">
                <text>💬 回复 {{ item.reply_count || 0 }}</text>
              </view>
              <view class="comment-action-btn report-btn" @click="showReportModal(item)">
                <text>🚫</text>
              </view>
              <view class="comment-action-btn delete-btn" v-if="canDeleteComment(item)" @click="deleteComment(item)">
                <text>🗑️</text>
              </view>
            </view>
          </view>

          <!-- 回复列表 -->
          <view class="reply-list" v-if="item.replies && item.replies.length > 0">
            <template v-for="(reply, rIdx) in item.replies" :key="rIdx">
              <view class="reply-item" v-if="expandedComments[item.id] || rIdx < 2">
                <view class="reply-header">
                  <image class="avatar-small" :src="getAvatarUrl(reply.avatar)" mode="aspectFill" @click="goUserProfile(reply.user_id)" />
                  <text class="replyer-name">{{ reply.nickname }}</text>
                  <text class="landed-badge-tiny" v-if="reply.is_landed === 1">已上岸</text>
                  <text class="reply-to" v-if="reply.reply_to_nickname">回复 @{{ reply.reply_to_nickname }}</text>
                </view>
                <text class="reply-text">{{ reply.content }}</text>
                <view class="reply-actions">
                  <text class="reply-time">{{ formatTime(reply.created_at) }}</text>
                  <view class="comment-btns">
                    <view class="comment-action-btn" :class="{ liked: reply.isLiked }" @click="toggleCommentLike(reply)">
                      <text>{{ reply.isLiked ? '❤️' : '🤍' }} {{ reply.like_count || 0 }}</text>
                    </view>
                    <view class="comment-action-btn reply-btn" @click="showReplyBox(item, reply)">
                      <text>💬 回复</text>
                    </view>
                    <view class="comment-action-btn report-btn" @click="showReportModal(reply)">
                      <text>🚫</text>
                    </view>
                    <view class="comment-action-btn delete-btn" v-if="canDeleteComment(reply)" @click="deleteComment(reply)">
                      <text>🗑️</text>
                    </view>
                  </view>
                </view>
              </view>
            </template>

            <!-- 展开收起 -->
            <view v-if="(item.total_replies || item.replies.length) > 2" class="expand-toggle" @click="toggleExpand(item.id)">
              <text>{{ expandedComments[item.id] ? '收起回复' : `展开全部 ${item.total_replies || item.replies.length} 条回复` }} ▼</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!processedPost.comments?.length" class="empty-comment">
        <text>暂无评论，快来发表你的看法~</text>
      </view>
    </view>

    <!-- 举报弹窗 -->
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

    <view style="height: 120rpx;"></view>
  </view>

  <view v-else class="loading-page"><text>加载中...</text></view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { forumApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'
import { formatDate as formatDateUtil } from '@/utils/date'

const post = ref(null)
const commentText = ref('')
const isBanned = ref(false)
const showReplyInput = ref(false)
const replyingTo = ref(null)
const replyContent = ref('')
const replyingToComment = ref(null)
const expandedComments = ref({})

// 判断是否是管理员
const isAdmin = computed(() => {
  try {
    const user = JSON.parse(uni.getStorageSync('user') || '{}')
    return user.role === 'admin' || user.role === 'super_admin'
  } catch (e) {
    return false
  }
})

// 处理帖子显示
const processedPost = computed(() => {
  if (!post.value) return null
  
  let p = { ...post.value }
  
  // 如果是匿名树洞且不是管理员，强制隐藏真实信息
  if (p.category === 'treehole' && !isAdmin.value) {
    p.display_name = '匿名用户'
    p.author_avatar = '/static/default-avatar.png'
  }
  
  // 处理评论
  if (p.comments && p.comments.length > 0) {
    p.comments = p.comments.map(comment => {
      let c = { ...comment }
      
      // 如果是匿名树洞且不是管理员，隐藏评论者信息
      if (p.category === 'treehole' && !isAdmin.value) {
        c.nickname = '匿名用户'
        c.avatar = '/static/default-avatar.png'
      }
      
      // 处理回复
      if (c.replies && c.replies.length > 0) {
        c.replies = c.replies.map(reply => {
          let r = { ...reply }
          if (p.category === 'treehole' && !isAdmin.value) {
            r.nickname = '匿名用户'
            r.avatar = '/static/default-avatar.png'
            if (r.reply_to_nickname) r.reply_to_nickname = '匿名用户'
          }
          return r
        })
      }
      
      return c
    })
  }
  
  return p
})

const reportModalVisible = ref(false)
const reportReason = ref('')
const reportDescription = ref('')
const reportingComment = ref(null)
const reportReasons = ['垃圾广告', '色情低俗', '违法违规', '人身攻击', '虚假信息', '其他']

const loadPost = async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = currentPage.options?.id

  if (!id) return

  try {
    const res = await forumApi.getPostDetail(id)
    post.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const toggleLike = async () => {
  try {
    const res = await forumApi.toggleLike(post.value.id)
    post.value.isLiked = res.data.isLiked
    post.value.like_count = res.data.likeCount
    uni.showToast({ title: res.data.isLiked ? '点赞成功' : '已取消点赞', icon: 'success' })
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const toggleFavorite = async () => {
  try {
    const res = await forumApi.toggleFavorite(post.value.id)
    post.value.isFavorited = res.data.isFavorited
    uni.showToast({ title: res.data.isFavorited ? '已收藏' : '已取消', icon: 'success' })
  } catch (e) {
    console.error(e)
  }
}

const submitComment = async () => {
  if (!commentText.value.trim()) {
    return uni.showToast({ title: '请输入评论内容', icon: 'none' })
  }

  try {
    await forumApi.addComment(post.value.id, { content: commentText.value })
    uni.showToast({ title: '评论成功', icon: 'success' })
    commentText.value = ''
    setTimeout(() => loadPost(), 500)
  } catch (e) {
    console.error(e)
    uni.showToast({ title: e.message || '评论失败', icon: 'none' })
  }
}

const showReplyBox = (comment, replyTo) => {
  if (isBanned.value) {
    uni.showToast({ title: '你已被禁言，请联系管理员解决', icon: 'none' })
    return
  }
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 1000)
    return
  }
  replyingTo.value = replyTo || comment
  replyingToComment.value = comment
  replyContent.value = ''
  showReplyInput.value = true
}

const cancelReply = () => {
  showReplyInput.value = false
  replyingTo.value = null
  replyingToComment.value = null
  replyContent.value = ''
}

const submitReply = async () => {
  if (!replyContent.value.trim()) {
    return uni.showToast({ title: '请输入回复内容', icon: 'none' })
  }

  try {
    await forumApi.addComment(post.value.id, {
      content: replyContent.value,
      parent_id: replyingToComment.value.id,
      reply_to_user_id: replyingTo.value.user_id || replyingTo.value.id
    })
    uni.showToast({ title: '回复成功', icon: 'success' })
    replyContent.value = ''
    cancelReply()
    setTimeout(() => loadPost(), 500)
  } catch (e) {
    console.error(e)
    uni.showToast({ title: e.message || '回复失败', icon: 'none' })
  }
}

const toggleCommentLike = async (comment) => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 1000)
      return
    }
    const res = await forumApi.likeComment(comment.id)
    if (res.code === 200) {
      comment.isLiked = res.data.isLiked
      comment.like_count = res.data.likeCount
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const canDeleteComment = (comment) => {
  const userInfo = uni.getStorageSync('userInfo') || {}
  return comment.user_id === userInfo.id || userInfo.role === 'admin' || userInfo.role === 'super_admin'
}

const selectReportReason = (reason) => {
  reportReason.value = reason
}

const showReportModal = (comment) => {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => { uni.navigateTo({ url: '/pages/login/login' }) }, 1000)
    return
  }
  reportingComment.value = comment
  reportReason.value = ''
  reportDescription.value = ''
  reportModalVisible.value = true
}

const closeReportModal = () => {
  reportModalVisible.value = false
}

const submitReport = async () => {
  if (!reportReason.value) {
    return uni.showToast({ title: '请选择举报原因', icon: 'none' })
  }
  try {
    const res = await forumApi.reportComment(reportingComment.value.id, {
      reason: reportReason.value,
      description: reportDescription.value
    })
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

const deleteComment = async (comment) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这条评论吗？',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        const res = await forumApi.deleteComment(comment.id)
        if (res.code === 200) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => loadPost(), 500)
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

const showReport = () => {
  uni.showActionSheet({
    itemList: ['广告/引流', '违规内容', '其他原因'],
    success: async (res) => {
      const reasons = ['广告/引流', '违规内容', '其他原因']
      await forumApi.report({
        target_type: 'post',
        target_id: post.value.id,
        reason: reasons[res.tapIndex]
      })
      uni.showToast({ title: '举报成功，我们会尽快处理', icon: 'none' })
    }
  })
}

const deletePost = async () => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这个帖子吗？',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        const res = await forumApi.deletePost(post.value.id)
        if (res.code === 200) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
        }
      } catch (e) {
        console.error('删除帖子失败:', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

const parseImages = (images) => {
  if (!images) return []
  let imgList
  if (typeof images === 'string') {
    try { imgList = JSON.parse(images) } catch { imgList = [] }
  } else {
    imgList = images
  }
  // 转换为完整URL
  return imgList.map(img => {
    if (img && !img.startsWith('http')) {
      return 'http://127.0.0.1:3000' + img
    }
    return img
  })
}

const previewImage = (current, urls) => {
  uni.previewImage({ current, urls })
}

const formatTime = (timeStr) => formatDateUtil(timeStr)

const getCategoryName = (cat) => {
  const map = { study: '备考交流', experience: '上岸经验', help: '资料求助', adjust: '复试调剂', anonymous: '匿名树洞' }
  return map[cat] || cat
}

const goUserProfile = (userId, isAnonymous) => {
  if (!userId || isAnonymous) return
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

const toggleExpand = (commentId) => {
  expandedComments.value[commentId] = !expandedComments.value[commentId]
}

onMounted(() => {
  try {
    const raw = uni.getStorageSync('userInfo')
    let info = raw
    if (typeof raw === 'string') {
      info = JSON.parse(raw)
    }
    if (info && info.is_banned === 1) {
      isBanned.value = true
    }
  } catch (e) {
    console.error('获取用户信息失败:', e)
  }
  loadPost()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.post-detail {
  padding: 30rpx;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  display: inline;
}

.author-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 4rpx;
}

.landed-badge {
  display: inline-block;
  font-size: 18rpx;
  color: #fff;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  margin-left: 8rpx;
  font-weight: bold;
}

.landed-badge-small {
  display: inline-block;
  font-size: 18rpx;
  color: #fff;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  padding: 1rpx 8rpx;
  border-radius: 6rpx;
  margin-left: 6rpx;
  font-weight: bold;
}

.landed-badge-tiny {
  display: inline-block;
  font-size: 16rpx;
  color: #fff;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  padding: 1rpx 6rpx;
  border-radius: 6rpx;
  margin-left: 6rpx;
  font-weight: bold;
}

.post-time {
  font-size: 22rpx;
  color: #999;
}

.post-tags {
  display: flex;
  gap: 8rpx;
}

.tag {
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
}

.tag.essence { background: #fff3e0; color: #ff9500; }
.tag.top { background: #ffebee; color: #ff3b30; }

.post-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.5;
  display: block;
  margin-bottom: 20rpx;
}

.post-content {
  font-size: 30rpx;
  color: #444;
  line-height: 1.8;
  margin-bottom: 20rpx;
}

.post-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.post-image {
  width: 200rpx;
  border-radius: 12rpx;
}

.post-stats {
  font-size: 24rpx;
  color: #999;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-bar {
  display: flex;
  gap: 16rpx;
  margin: 20rpx 24rpx;
  padding: 24rpx;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  background: #f5f5f5;
  color: #666;
  border-radius: 36rpx;
  font-size: 26rpx;
  border: none;
}

.action-btn.active {
  background: #fff3e0;
  color: #ff9500;
}

.report-btn {
  flex: 0.5;
  background: #f0f0f0;
}

.comment-section {
  margin: 0 24rpx 20rpx;
  padding: 30rpx;
}

.banned-tip {
  background: #fff3e0;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  text-align: center;
}

.banned-tip-text {
  font-size: 28rpx;
  color: #e65100;
  font-weight: 500;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-20 {
  margin-bottom: 20rpx;
}

.comment-input-area {
  margin-bottom: 20rpx;
}

.comment-textarea {
  width: 100%;
  height: 150rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 26rpx;
  box-sizing: border-box;
  margin-bottom: 16rpx;
}

.submit-comment-btn {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 28rpx;
  border-radius: 36rpx;
  border: none;
}

.submit-comment-btn[disabled] {
  opacity: 0.5;
}

.comment-list {
  margin-top: 20rpx;
}

.comment-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.comment-header-info {
  display: flex;
  flex-direction: column;
}

.commenter-name {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.commenter-name-row {
  display: flex;
  align-items: center;
}

.comment-text {
  font-size: 28rpx;
  color: #444;
  line-height: 1.6;
  display: block;
  margin-bottom: 8rpx;
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rpx;
}

.comment-time {
  font-size: 22rpx;
  color: #bbb;
}

.comment-btns {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.comment-action-btn {
  font-size: 22rpx;
  color: #999;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
}

.comment-action-btn.liked {
  color: #ff3b30;
  background: #fff0f0;
}

.comment-action-btn.report-btn {
  cursor: pointer;
  user-select: none;
}

.comment-action-btn.report-btn:active {
  background: #fff3e0;
}

.comment-action-btn.delete-btn {
  color: #ff3b30;
}

.comment-action-btn.delete-btn:active {
  background: #fff0f0;
}

.reply-btn {
  color: #007AFF;
}

.reply-input-box {
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
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

.empty-comment {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 26rpx;
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
  border-color: #ff3b30;
  color: #ff3b30;
  background: #fff0f0;
}

.reason-item:active {
  transform: scale(0.95);
  background: #f0f0f0;
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

.loading-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<template>
  <view class="page">
    <view class="tool-grid">
      <view 
        v-for="(tool, index) in tools" 
        :key="index"
        class="tool-card card"
        @click="openTool(tool)"
      >
        <text class="tool-icon">{{ tool.icon }}</text>
        <text class="tool-name">{{ tool.name }}</text>
        <text class="tool-desc">{{ tool.desc }}</text>
      </view>
    </view>

    <!-- 口语题库弹窗 -->
    <view v-if="showOral" class="modal-mask" @click="showOral = false">
      <view class="modal-content oral-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">英语口语题库</text>
          <text class="close-btn" @click="showOral = false">✕</text>
        </view>

        <scroll-view scroll-y class="oral-list">
          <view 
            v-for="(q, index) in allOralQuestions" 
            :key="q.id || index"
            class="oral-item"
          >
            <view class="question-section">
              <text class="q-label">Q{{ index + 1 }}.</text>
              <text class="q-en">{{ q.question_en }}</text>
              <text class="q-cn">{{ q.question_cn }}</text>
            </view>
            
            <view class="answer-section">
              <text class="a-label">参考回答：</text>
              <text class="a-content">{{ q.reference_answer }}</text>
            </view>
            
            <view class="oral-actions">
              <button class="copy-btn" @click="copyAnswer(q)">复制参考回答</button>
              <button 
                v-if="q.type === 'user' && canDeleteOral(q)" 
                class="delete-item-btn" 
                @click="deleteOralQuestion(q)"
              >删除</button>
            </view>
          </view>

          <view v-if="allOralQuestions.length === 0" class="empty-state">
            <text class="empty-text">暂无题目</text>
          </view>
        </scroll-view>

        <view class="upload-bar">
          <button class="btn-primary upload-btn" @click="showOralUpload = true">上传题目</button>
        </view>
      </view>
    </view>

    <!-- 口语题库上传弹窗 -->
    <view v-if="showOralUpload" class="modal-mask" @click="showOralUpload = false">
      <view class="modal-content upload-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">上传口语题目</text>
          <text class="close-btn" @click="showOralUpload = false">✕</text>
        </view>

        <view class="upload-form">
          <view class="form-item">
            <text class="form-label">英文问题 *</text>
            <textarea 
              class="form-textarea" 
              v-model="oralForm.question_en" 
              placeholder="请输入英文问题"
              maxlength="500"
            />
          </view>

          <view class="form-item">
            <text class="form-label">中文翻译</text>
            <textarea 
              class="form-textarea" 
              v-model="oralForm.question_cn" 
              placeholder="请输入中文翻译（选填）"
              maxlength="500"
            />
          </view>

          <view class="form-item">
            <text class="form-label">参考回答 *</text>
            <textarea 
              class="form-textarea answer-textarea" 
              v-model="oralForm.reference_answer" 
              placeholder="请输入参考回答（纯文本）"
              maxlength="2000"
            />
          </view>

          <view class="form-item">
            <text class="form-label">分类</text>
            <input class="form-input" v-model="oralForm.category" placeholder="如：自我介绍、学术背景等" />
          </view>

          <button 
            class="btn-primary submit-btn" 
            :disabled="!oralForm.question_en.trim() || !oralForm.reference_answer.trim() || oralUploading"
            @click="submitOralQuestion"
          >
            {{ oralUploading ? '提交中...' : '提交审核' }}
          </button>
          <text class="upload-tip">提交后将由管理员审核通过后展示</text>
        </view>
      </view>
    </view>

    <!-- 简历模板弹窗 -->
    <view v-if="showResume" class="modal-mask" @click="showResume = false">
      <view class="modal-content resume-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">复试简历模板</text>
          <text class="close-btn" @click="showResume = false">✕</text>
        </view>

        <scroll-view scroll-y class="template-scroll">
          <view class="template-list">
            <view 
              v-for="(tpl, index) in allResumeTemplates" 
              :key="tpl.id || index"
              class="template-item"
            >
              <view class="template-info">
                <text class="template-name">
                  {{ tpl.name }}
                  <text v-if="tpl.type === 'user'" class="user-tag">用户上传</text>
                </text>
                <text class="template-desc">{{ tpl.desc }}</text>
                <text v-if="tpl.type === 'user' && tpl.uploader_name" class="template-uploader">上传者：{{ tpl.uploader_name }}</text>
              </view>
              <view class="template-actions">
                <button class="download-tpl-btn" @click="downloadTemplate(tpl)">
                  {{ tpl.type === 'system' ? '下载模板' : '下载' }}
                </button>
                <button 
                  v-if="tpl.type === 'user' && canDeleteDoc(tpl)" 
                  class="delete-item-btn" 
                  @click="deleteResumeTemplate(tpl)"
                >删除</button>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="upload-bar">
          <button class="btn-primary upload-btn" @click="uploadResumeDoc">上传Word模板</button>
        </view>
      </view>
    </view>

    <!-- 邮件模板弹窗 -->
    <view v-if="showEmail" class="modal-mask" @click="showEmail = false">
      <view class="modal-content email-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">导师联系邮件模板</text>
          <text class="close-btn" @click="showEmail = false">✕</text>
        </view>

        <scroll-view scroll-y class="email-scroll">
          <view class="section-label">系统模板</view>
          <view 
            v-for="(email, index) in systemEmailTemplates" 
            :key="email.id || index"
            class="email-item"
          >
            <text class="email-scene">{{ email.scene }}</text>
            <text class="email-subject">主题：{{ email.subject }}</text>
            <view class="email-body">
              <text class="email-content">{{ email.content }}</text>
            </view>
            <button class="copy-btn" @click="copyEmail(email)">一键复制</button>
          </view>

          <view v-if="userEmailTemplates.length > 0" class="section-label" style="margin-top: 20rpx;">用户上传模板</view>
          <view 
            v-for="(email, index) in userEmailTemplates" 
            :key="email.id || index"
            class="email-item"
          >
            <view class="email-item-header">
              <text class="email-scene">{{ email.name }}</text>
              <view class="email-item-actions">
                <button class="download-tpl-btn small" @click="downloadEmailTemplate(email)">下载</button>
                <button v-if="canDeleteDoc(email)" class="delete-item-btn small" @click="deleteEmailTemplateItem(email)">删除</button>
              </view>
            </view>
            <text v-if="email.desc" class="template-desc">{{ email.desc }}</text>
            <text v-if="email.uploader_name" class="template-uploader">上传者：{{ email.uploader_name }}</text>
          </view>
        </scroll-view>

        <view class="upload-bar">
          <button class="btn-primary upload-btn" @click="uploadEmailDoc">上传Word模板</button>
        </view>
      </view>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { interviewApi } from '@/api/index'

const showOral = ref(false)
const showResume = ref(false)
const showEmail = ref(false)
const showOralUpload = ref(false)

const userInfo = ref(null)
const oralUploading = ref(false)

const systemOralQuestions = ref([])
const userOralQuestions = ref([])
const systemResumeTemplates = ref([])
const userResumeTemplates = ref([])
const systemEmailTemplates = ref([])
const userEmailTemplates = ref([])

const oralForm = ref({
  question_en: '',
  question_cn: '',
  reference_answer: '',
  category: ''
})

const tools = [
  { icon: '🗣️', name: '英语口语题库', desc: '常见问题及参考回答，支持上传', action: 'oral' },
  { icon: '📄', name: '简历模板下载', desc: 'Word模板，支持上传下载', action: 'resume' },
  { icon: '✉️', name: '导师邮件模板', desc: '邮件模板，支持上传下载', action: 'email' },
  { icon: '💬', name: '复试交流', desc: '跳转至复试调剂讨论区', action: 'forum' }
]

const allOralQuestions = computed(() => {
  return [
    ...systemOralQuestions.value.map(q => ({ ...q, type: 'system' })),
    ...userOralQuestions.value.map(q => ({ ...q, type: 'user' }))
  ]
})

const allResumeTemplates = computed(() => {
  return [
    ...systemResumeTemplates.value.map(t => ({ ...t, type: 'system' })),
    ...userResumeTemplates.value.map(t => ({ ...t, type: 'user' }))
  ]
})

const loadUserInfo = () => {
  try {
    const raw = uni.getStorageSync('userInfo')
    userInfo.value = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
  } catch (e) {
    userInfo.value = null
  }
}

const isAdmin = () => userInfo.value?.role === 'admin'

const canDeleteOral = (q) => {
  if (!userInfo.value) return false
  return isAdmin() || q.user_id === userInfo.value.id
}

const canDeleteDoc = (item) => {
  if (!userInfo.value) return false
  return isAdmin() || item.user_id === userInfo.value.id
}

const openTool = (tool) => {
  switch (tool.action) {
    case 'oral':
      showOral.value = true
      loadOralQuestions()
      break
    case 'resume':
      showResume.value = true
      loadResumeTemplates()
      break
    case 'email':
      showEmail.value = true
      loadEmailTemplates()
      break
    case 'forum':
      uni.switchTab({
        url: '/pages/forum/index',
        success: () => {
          setTimeout(() => {
            uni.$emit('switchForumTab', 'adjust')
          }, 300)
        },
        fail: () => {
          uni.navigateTo({ url: '/pages/forum/index?category=adjust' })
        }
      })
      break
  }
}

const loadOralQuestions = async () => {
  try {
    const res = await interviewApi.getOralQuestions()
    if (res.code === 200) {
      systemOralQuestions.value = res.data.system || []
      userOralQuestions.value = res.data.user || []
    }
  } catch (e) {
    console.error('加载口语题库失败:', e)
  }
}

const submitOralQuestion = async () => {
  if (!oralForm.value.question_en.trim() || !oralForm.value.reference_answer.trim()) return
  
  oralUploading.value = true
  try {
    const res = await interviewApi.uploadOralQuestion(oralForm.value)
    if (res.code === 200) {
      uni.showToast({ title: '提交成功，等待审核', icon: 'success' })
      oralForm.value = { question_en: '', question_cn: '', reference_answer: '', category: '' }
      showOralUpload.value = false
      loadOralQuestions()
    }
  } catch (e) {
    console.error('上传口语题目失败:', e)
  } finally {
    oralUploading.value = false
  }
}

const deleteOralQuestion = (q) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这道题目吗？',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        const res = await interviewApi.deleteOralQuestion(q.id)
        if (res.code === 200) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadOralQuestions()
        }
      } catch (e) {
        console.error('删除失败:', e)
      }
    }
  })
}

const loadResumeTemplates = async () => {
  try {
    const res = await interviewApi.getResumeTemplates()
    if (res.code === 200) {
      systemResumeTemplates.value = res.data.system || []
      userResumeTemplates.value = res.data.user || []
    }
  } catch (e) {
    console.error('加载简历模板失败:', e)
  }
}

const uploadResumeDoc = () => {
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['.doc', '.docx'],
    success: (chooseRes) => {
      const file = chooseRes.tempFiles[0]
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (!['.doc', '.docx'].includes(ext)) {
        uni.showToast({ title: '仅支持Word文档', icon: 'none' })
        return
      }

      uni.showModal({
        title: '填写模板信息',
        editable: true,
        placeholderText: '请输入模板名称',
        success: async (modalRes) => {
          if (!modalRes.confirm) return
          try {
            uni.showLoading({ title: '上传中...' })
            const res = await interviewApi.uploadResumeTemplate(file.path, {
              name: modalRes.content || file.name,
              desc: ''
            })
            uni.hideLoading()
            if (res.code === 200) {
              uni.showToast({ title: '上传成功，等待审核', icon: 'success' })
              loadResumeTemplates()
            }
          } catch (e) {
            uni.hideLoading()
            console.error('上传简历模板失败:', e)
          }
        }
      })
    },
    fail: () => {
      uni.chooseFile({
        count: 1,
        type: 'file',
        extension: ['.doc', '.docx'],
        success: (chooseRes2) => {
          const file = chooseRes2.tempFiles[0]
          uni.showModal({
            title: '填写模板信息',
            editable: true,
            placeholderText: '请输入模板名称',
            success: async (modalRes) => {
              if (!modalRes.confirm) return
              try {
                uni.showLoading({ title: '上传中...' })
                const res = await interviewApi.uploadResumeTemplate(file.path, {
                  name: modalRes.content || file.name,
                  desc: ''
                })
                uni.hideLoading()
                if (res.code === 200) {
                  uni.showToast({ title: '上传成功，等待审核', icon: 'success' })
                  loadResumeTemplates()
                }
              } catch (e) {
                uni.hideLoading()
                console.error('上传简历模板失败:', e)
              }
            }
          })
        }
      })
    }
  })
}

const downloadTemplate = (tpl) => {
  if (tpl.type === 'system') {
    uni.showToast({ title: '功能开发中', icon: 'none' })
    return
  }
  
  const url = `http://127.0.0.1:3000/api/interview/resume-templates/${tpl.id}/download`
  const token = uni.getStorageSync('token')
  
  uni.downloadFile({
    url: url,
    header: { 'Authorization': `Bearer ${token}` },
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          success: () => {},
          fail: () => {
            uni.showToast({ title: '打开文件失败', icon: 'none' })
          }
        })
      } else {
        uni.showToast({ title: '下载失败', icon: 'none' })
      }
    },
    fail: () => {
      uni.showToast({ title: '下载失败', icon: 'none' })
    }
  })
}

const deleteResumeTemplate = (tpl) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个模板吗？',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        const res = await interviewApi.deleteResumeTemplate(tpl.id)
        if (res.code === 200) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadResumeTemplates()
        }
      } catch (e) {
        console.error('删除失败:', e)
      }
    }
  })
}

const loadEmailTemplates = async () => {
  try {
    const res = await interviewApi.getEmailTemplates()
    if (res.code === 200) {
      systemEmailTemplates.value = res.data.system || []
      userEmailTemplates.value = res.data.user || []
    }
  } catch (e) {
    console.error('加载邮件模板失败:', e)
  }
}

const uploadEmailDoc = () => {
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['.doc', '.docx'],
    success: (chooseRes) => {
      const file = chooseRes.tempFiles[0]
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (!['.doc', '.docx'].includes(ext)) {
        uni.showToast({ title: '仅支持Word文档', icon: 'none' })
        return
      }

      uni.showModal({
        title: '填写模板信息',
        editable: true,
        placeholderText: '请输入模板名称',
        success: async (modalRes) => {
          if (!modalRes.confirm) return
          try {
            uni.showLoading({ title: '上传中...' })
            const res = await interviewApi.uploadEmailTemplate(file.path, {
              name: modalRes.content || file.name,
              desc: ''
            })
            uni.hideLoading()
            if (res.code === 200) {
              uni.showToast({ title: '上传成功，等待审核', icon: 'success' })
              loadEmailTemplates()
            }
          } catch (e) {
            uni.hideLoading()
            console.error('上传邮件模板失败:', e)
          }
        }
      })
    },
    fail: () => {
      uni.chooseFile({
        count: 1,
        type: 'file',
        extension: ['.doc', '.docx'],
        success: (chooseRes2) => {
          const file = chooseRes2.tempFiles[0]
          uni.showModal({
            title: '填写模板信息',
            editable: true,
            placeholderText: '请输入模板名称',
            success: async (modalRes) => {
              if (!modalRes.confirm) return
              try {
                uni.showLoading({ title: '上传中...' })
                const res = await interviewApi.uploadEmailTemplate(file.path, {
                  name: modalRes.content || file.name,
                  desc: ''
                })
                uni.hideLoading()
                if (res.code === 200) {
                  uni.showToast({ title: '上传成功，等待审核', icon: 'success' })
                  loadEmailTemplates()
                }
              } catch (e) {
                uni.hideLoading()
                console.error('上传邮件模板失败:', e)
              }
            }
          })
        }
      })
    }
  })
}

const downloadEmailTemplate = (tpl) => {
  const url = `http://127.0.0.1:3000/api/interview/email-templates/${tpl.id}/download`
  const token = uni.getStorageSync('token')
  
  uni.downloadFile({
    url: url,
    header: { 'Authorization': `Bearer ${token}` },
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          success: () => {},
          fail: () => {
            uni.showToast({ title: '打开文件失败', icon: 'none' })
          }
        })
      } else {
        uni.showToast({ title: '下载失败', icon: 'none' })
      }
    },
    fail: () => {
      uni.showToast({ title: '下载失败', icon: 'none' })
    }
  })
}

const deleteEmailTemplateItem = (tpl) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个模板吗？',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        const res = await interviewApi.deleteEmailTemplate(tpl.id)
        if (res.code === 200) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadEmailTemplates()
        }
      } catch (e) {
        console.error('删除失败:', e)
      }
    }
  })
}

const copyAnswer = (q) => {
  uni.setClipboardData({
    data: q.reference_answer,
    success: () => uni.showToast({ title: '已复制', icon: 'success' })
  })
}

const copyEmail = (email) => {
  uni.setClipboardData({
    data: email.content,
    success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
  })
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 24rpx;
}

.tool-card {
  padding: 36rpx 24rpx;
  text-align: center;
}

.tool-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.tool-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.tool-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #fff;
  border-radius: 20rpx;
  width: 88%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  font-size: 36rpx;
  color: #999;
  padding: 10rpx;
}

.oral-modal .oral-list {
  flex: 1;
  overflow-y: auto;
  padding: 20rpx 30rpx;
}

.oral-item {
  padding: 24rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.question-section {
  margin-bottom: 16rpx;
}

.q-label {
  font-size: 26rpx;
  font-weight: bold;
  color: #007AFF;
  margin-right: 8rpx;
}

.q-en {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 6rpx;
}

.q-cn {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.answer-section {
  background: #fff;
  padding: 16rpx;
  border-radius: 8rpx;
  border-left: 4rpx solid #07c160;
  margin-bottom: 12rpx;
}

.a-label {
  font-size: 22rpx;
  color: #07c160;
  font-weight: 500;
  display: block;
  margin-bottom: 8rpx;
}

.a-content {
  font-size: 26rpx;
  color: #444;
  line-height: 1.7;
}

.oral-actions {
  display: flex;
  gap: 16rpx;
}

.copy-btn {
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 24rpx;
  padding: 12rpx 32rpx;
  font-size: 24rpx;
}

.delete-item-btn {
  background: #ff3b30;
  color: #fff;
  border: none;
  border-radius: 24rpx;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
}

.delete-item-btn.small {
  padding: 8rpx 20rpx;
  font-size: 22rpx;
}

.upload-bar {
  padding: 16rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.upload-btn {
  width: 100%;
  height: 72rpx;
  font-size: 28rpx;
  border-radius: 36rpx;
}

.upload-modal {
  max-height: 90vh;
}

.upload-form {
  padding: 24rpx 30rpx;
  flex: 1;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 20rpx;
}

.form-label {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 10rpx;
}

.form-textarea {
  width: 100%;
  height: 120rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 26rpx;
  box-sizing: border-box;
  border: 2rpx solid transparent;
}

.form-textarea.answer-textarea {
  height: 200rpx;
}

.form-input {
  width: 100%;
  height: 70rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  box-sizing: border-box;
  border: 2rpx solid transparent;
}

.submit-btn {
  width: 100%;
  height: 80rpx;
  font-size: 30rpx;
  margin-top: 10rpx;
  border-radius: 40rpx;
}

.submit-btn[disabled] {
  opacity: 0.5;
}

.upload-tip {
  font-size: 22rpx;
  color: #ff9500;
  text-align: center;
  display: block;
  margin-top: 12rpx;
}

.template-scroll {
  flex: 1;
  overflow-y: auto;
}

.template-list {
  padding: 20rpx 30rpx;
}

.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  flex-wrap: wrap;
}

.template-info {
  flex: 1;
  min-width: 0;
}

.template-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}

.user-tag {
  font-size: 20rpx;
  background: #e8f4ff;
  color: #3182ce;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  margin-left: 10rpx;
  font-weight: normal;
}

.template-desc {
  font-size: 22rpx;
  color: #999;
  display: block;
}

.template-uploader {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.template-actions {
  display: flex;
  gap: 12rpx;
  margin-left: 16rpx;
}

.download-tpl-btn {
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  color: #fff;
  border: none;
  border-radius: 24rpx;
  padding: 14rpx 28rpx;
  font-size: 24rpx;
}

.download-tpl-btn.small {
  padding: 8rpx 20rpx;
  font-size: 22rpx;
}

.email-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20rpx 30rpx;
}

.section-label {
  font-size: 26rpx;
  font-weight: bold;
  color: #007AFF;
  padding: 10rpx 0;
  display: block;
}

.email-item {
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.email-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.email-item-actions {
  display: flex;
  gap: 10rpx;
}

.email-scene {
  font-size: 28rpx;
  font-weight: bold;
  color: #007AFF;
  display: block;
  margin-bottom: 10rpx;
}

.email-subject {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.email-body {
  background: #fff;
  padding: 16rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
  max-height: 300rpx;
  overflow-y: auto;
}

.email-content {
  font-size: 24rpx;
  color: #444;
  white-space: pre-wrap;
  line-height: 1.7;
}

.empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>

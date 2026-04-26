<template>
  <view class="page">
    <view class="avatar-section">
      <view class="avatar-wrapper" @click="chooseAvatar">
        <image class="avatar" :src="getAvatarUrl(form.avatar)" mode="aspectFill" />
        <view class="avatar-edit-icon">
          <text class="edit-icon-text">📷</text>
        </view>
      </view>
      <text class="avatar-tip">点击更换头像</text>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">基本信息</text>
      </view>
      <view class="form-card">
        <view class="form-item" @click="editField('nickname')">
          <text class="form-label">昵称</text>
          <view class="form-value-wrap">
            <text class="form-value" :class="{ placeholder: !form.nickname }">{{ form.nickname || '请输入昵称' }}</text>
            <text class="form-arrow">></text>
          </view>
        </view>
        <view class="form-item" @click="editField('college')">
          <text class="form-label">院校</text>
          <view class="form-value-wrap">
            <text class="form-value" :class="{ placeholder: !form.college }">{{ form.college || '请输入院校名称' }}</text>
            <text class="form-arrow">></text>
          </view>
        </view>
        <view class="form-item" @click="editField('major')">
          <text class="form-label">专业</text>
          <view class="form-value-wrap">
            <text class="form-value" :class="{ placeholder: !form.major }">{{ form.major || '请输入专业名称' }}</text>
            <text class="form-arrow">></text>
          </view>
        </view>
        <view class="form-item" @click="editField('student_id')">
          <text class="form-label">学号</text>
          <view class="form-value-wrap">
            <text class="form-value" :class="{ placeholder: !form.student_id }">{{ form.student_id || '请输入学号' }}</text>
            <text class="form-arrow">></text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">考研信息</text>
      </view>
      <view class="form-card">
        <view class="form-item" @click="editField('target_school')">
          <text class="form-label">目标院校</text>
          <view class="form-value-wrap">
            <text class="form-value" :class="{ placeholder: !form.target_school }">{{ form.target_school || '请输入目标院校' }}</text>
            <text class="form-arrow">></text>
          </view>
        </view>
        <view class="form-item" @click="editField('target_major')">
          <text class="form-label">目标专业</text>
          <view class="form-value-wrap">
            <text class="form-value" :class="{ placeholder: !form.target_major }">{{ form.target_major || '请输入目标专业' }}</text>
            <text class="form-arrow">></text>
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">考研年份</text>
          <view class="form-value-wrap">
            <picker mode="selector" :range="yearList" @change="onYearChange">
              <text class="form-value" :class="{ placeholder: !form.exam_year }">{{ form.exam_year || '请选择考研年份' }}</text>
            </picker>
            <text class="form-arrow">></text>
          </view>
        </view>
      </view>
    </view>

    <view class="btn-section">
      <button class="save-btn" :class="{ disabled: saving }" @click="saveProfile">
        {{ saving ? '保存中...' : '保存修改' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userApi } from '@/api/index'
import { getAvatarUrl } from '@/utils/url'
import { getRecentYears } from '@/utils/date'

const form = ref({
  avatar: '',
  nickname: '',
  college: '',
  major: '',
  student_id: '',
  target_school: '',
  target_major: '',
  exam_year: ''
})

const saving = ref(false)

const yearList = computed(() => {
  return getRecentYears(4).map(String)
})

const loadUserInfo = async () => {
  try {
    const res = await userApi.getInfo()
    if (res.code === 200) {
      form.value = {
        avatar: res.data.avatar || '',
        nickname: res.data.nickname || '',
        college: res.data.college || '',
        major: res.data.major || '',
        student_id: res.data.student_id || '',
        target_school: res.data.target_school || '',
        target_major: res.data.target_major || '',
        exam_year: res.data.exam_year || ''
      }
    }
  } catch (e) {
    console.error('加载用户信息失败:', e)
  }
}

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      try {
        const token = uni.getStorageSync('token')
        uni.showLoading({ title: '上传中...' })
        const uploadRes = await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: 'http://127.0.0.1:3000/api/user/avatar',
            filePath: tempFilePath,
            name: 'file',
            header: { Authorization: 'Bearer ' + token },
            success: (res) => {
              try {
                resolve(JSON.parse(res.data))
              } catch (e) {
                reject(e)
              }
            },
            fail: reject
          })
        })
        uni.hideLoading()

        if (uploadRes.code === 200) {
          form.value.avatar = uploadRes.data.url
          uni.showToast({ title: '头像上传成功', icon: 'success' })
        } else {
          uni.showToast({ title: uploadRes.msg || '上传失败', icon: 'none' })
        }
      } catch (e) {
        uni.hideLoading()
        console.error('上传头像失败:', e)
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    }
  })
}

const fieldConfig = {
  nickname: { title: '修改昵称', placeholder: '请输入昵称' },
  college: { title: '修改院校', placeholder: '请输入院校名称' },
  major: { title: '修改专业', placeholder: '请输入专业名称' },
  student_id: { title: '修改学号', placeholder: '请输入学号' },
  target_school: { title: '修改目标院校', placeholder: '请输入目标院校' },
  target_major: { title: '修改目标专业', placeholder: '请输入目标专业' }
}

const editField = (field) => {
  const config = fieldConfig[field]
  uni.showModal({
    title: config.title,
    editable: true,
    placeholderText: config.placeholder,
    content: form.value[field] || '',
    success: (res) => {
      if (res.confirm && res.content !== undefined) {
        form.value[field] = res.content.trim()
      }
    }
  })
}

const onYearChange = (e) => {
  const idx = e.detail.value
  if (idx >= 0 && idx < yearList.value.length) {
    form.value.exam_year = yearList.value[idx]
  }
}

const saveProfile = async () => {
  if (!form.value.nickname.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }

  saving.value = true
  try {
    await userApi.updateProfile({
      avatar: form.value.avatar,
      nickname: form.value.nickname,
      college: form.value.college,
      major: form.value.major,
      student_id: form.value.student_id,
      target_school: form.value.target_school,
      target_major: form.value.target_major,
      exam_year: form.value.exam_year
    })
    uni.showToast({ title: '保存成功', icon: 'success' })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    console.error('保存失败:', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onShow(() => {
  loadUserInfo()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.avatar-section {
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 50rpx;
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.9);
}

.avatar-edit-icon {
  position: absolute;
  right: -6rpx;
  bottom: -6rpx;
  width: 56rpx;
  height: 56rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.edit-icon-text {
  font-size: 28rpx;
}

.avatar-tip {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}

.section {
  margin-top: 24rpx;
}

.section-header {
  padding: 20rpx 30rpx 10rpx;
}

.section-title {
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
}

.form-card {
  background: #fff;
  padding: 0 30rpx;
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  font-size: 30rpx;
  color: #333;
  flex-shrink: 0;
  width: 160rpx;
}

.form-value-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.form-value {
  font-size: 30rpx;
  color: #333;
  text-align: right;
  margin-right: 12rpx;
  max-width: 400rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-value.placeholder {
  color: #ccc;
}

.form-arrow {
  font-size: 28rpx;
  color: #ccc;
}

.btn-section {
  padding: 60rpx 30rpx;
}

.save-btn {
  width: 100%;
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  color: white;
  font-size: 32rpx;
  border-radius: 50rpx;
  padding: 24rpx 0;
  border: none;
  letter-spacing: 4rpx;
}

.save-btn.disabled {
  opacity: 0.6;
}
</style>

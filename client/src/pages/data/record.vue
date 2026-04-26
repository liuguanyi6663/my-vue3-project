<template>
  <view class="page">
    <!-- 顶部提示 -->
    <view class="header-tip">
      <text class="tip-icon">📝</text>
      <view class="tip-content">
        <text class="tip-title">录入/修改我的考研信息</text>
        <text class="tip-desc">{{ isEdit ? '修改后需重新审核' : '请如实填写您的考研信息，提交后需审核' }}</text>
      </view>
    </view>

    <!-- 表单卡片 -->
    <view class="form-card">
      <!-- 基本信息 -->
      <view class="form-section">
        <text class="section-label">基本信息</text>

        <view class="form-item">
          <text class="item-label required">姓名</text>
          <input
            class="item-input"
            v-model="form.name"
            placeholder="请输入真实姓名"
            maxlength="20"
          />
        </view>

        <view class="form-item">
          <text class="item-label required">隶属分院</text>
          <picker mode="selector" :range="collegeOptions" :value="collegeIndex" @change="onCollegeChange">
            <view class="picker-value" :class="{ 'placeholder': !form.college }">
              {{ form.college || '请选择隶属分院' }}
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="item-label required">专业</text>
          <input
            class="item-input"
            v-model="form.major"
            placeholder="请输入您的专业"
            maxlength="50"
          />
        </view>

        <view class="form-item">
          <text class="item-label required">学号</text>
          <input
            class="item-input"
            v-model="form.student_id"
            placeholder="请输入学号"
            maxlength="30"
          />
        </view>

        <view class="form-item">
          <text class="item-label required">考研科目</text>
          <input
            class="item-input"
            v-model="form.exam_subjects"
            placeholder="如：数学一、英语一、政治、专业课"
            maxlength="200"
          />
        </view>

        <view class="form-item">
          <text class="item-label">考研年份</text>
          <picker mode="selector" :range="yearOptions" :value="yearIndex" @change="onYearChange">
            <view class="picker-value">{{ form.exam_year }}年</view>
          </picker>
        </view>
      </view>

      <!-- 考试情况 -->
      <view class="form-section">
        <text class="section-label">考试情况</text>

        <view class="form-item switch-item">
          <text class="item-label">是否跨考</text>
          <switch :checked="form.is_cross_major" @change="form.is_cross_major = $event.detail.value" color="#c53030" />
        </view>

        <view class="form-item switch-item">
          <text class="item-label">是否上岸</text>
          <switch :checked="form.is_admitted" @change="form.is_admitted = $event.detail.value" color="#c53030" />
        </view>

        <view class="form-item switch-item">
          <text class="item-label">是否过专业线</text>
          <switch :checked="form.is_pass_line" @change="form.is_pass_line = $event.detail.value" color="#c53030" />
        </view>
      </view>

      <!-- 各科成绩 -->
      <view class="form-section">
        <text class="section-label">各科成绩</text>

        <view class="form-item">
          <view class="label-row">
            <text class="item-label">数学</text>
            <text class="score-limit">满分150</text>
          </view>
          <input
            class="item-input"
            v-model="form.math_score"
            type="digit"
            placeholder="请输入数学成绩（0-150）"
            maxlength="6"
          />
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="item-label">英语</text>
            <text class="score-limit">满分100</text>
          </view>
          <input
            class="item-input"
            v-model="form.english_score"
            type="digit"
            placeholder="请输入英语成绩（0-100）"
            maxlength="6"
          />
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="item-label">政治</text>
            <text class="score-limit">满分100</text>
          </view>
          <input
            class="item-input"
            v-model="form.politics_score"
            type="digit"
            placeholder="请输入政治成绩（0-100）"
            maxlength="6"
          />
        </view>

        <view class="form-item">
          <view class="label-row">
            <text class="item-label">专业课</text>
            <text class="score-limit">满分150</text>
          </view>
          <input
            class="item-input"
            v-model="form.professional_score"
            type="digit"
            placeholder="请输入专业课成绩（0-150）"
            maxlength="6"
          />
        </view>
      </view>

      <!-- 目标院校 -->
      <view class="form-section">
        <text class="section-label">目标院校</text>

        <view class="form-item">
          <text class="item-label required">目标院校</text>
          <input
            class="item-input"
            v-model="form.target_school"
            placeholder="请输入目标院校"
            maxlength="200"
          />
        </view>

        <view class="form-item">
          <text class="item-label required">院校层次</text>
          <picker mode="selector" :range="schoolLevelOptions" :value="schoolLevelIndex" @change="onSchoolLevelChange">
            <view class="picker-value" :class="{ 'placeholder': !form.school_level }">
              {{ form.school_level || '请选择院校层次' }}
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="item-label">目标专业</text>
          <input
            class="item-input"
            v-model="form.target_major"
            placeholder="请输入目标专业"
            maxlength="100"
          />
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-area">
      <button
        class="submit-btn"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '保存中...' : (isEdit ? '保存修改' : '提交信息') }}
      </button>
      <text class="submit-tip">{{ isEdit ? '修改后需重新审核' : '提交后需管理员审核，审核通过后将纳入数据统计' }}</text>
    </view>

    <view style="height: 60rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { recordApi } from '@/api/index'
import { getRecentYears, getCurrentYear } from '@/utils/date'

const recentYears = getRecentYears(4)
const yearOptions = recentYears.map(y => y + '年')
const yearIndex = ref(recentYears.indexOf(getCurrentYear()))

const schoolLevelOptions = ['985', '211', '双一流', '普通本科高校']
const schoolLevelIndex = ref(0)

const collegeOptions = [
  '语言文学分院',
  '医药与健康分院',
  '建筑工程分院',
  '信息与机电工程分院',
  '纺织服装与艺术设计分院',
  '经济管理分院',
  '马克思主义分院/梁柏台法学院',
  '公共基础教育分院'
]
const collegeIndex = ref(0)

const form = ref({
  name: '',
  major: '',
  student_id: '',
  exam_subjects: '',
  college: '',
  is_cross_major: false,
  is_admitted: false,
  math_score: '',
  english_score: '',
  politics_score: '',
  professional_score: '',
  is_pass_line: false,
  target_school: '',
  target_major: '',
  school_level: '',
  exam_year: getCurrentYear()
})

const submitting = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const onYearChange = (e) => {
  yearIndex.value = e.detail.value
  form.value.exam_year = parseInt(yearOptions[e.detail.value])
}

const onSchoolLevelChange = (e) => {
  schoolLevelIndex.value = e.detail.value
  form.value.school_level = schoolLevelOptions[e.detail.value]
}

const onCollegeChange = (e) => {
  collegeIndex.value = e.detail.value
  form.value.college = collegeOptions[e.detail.value]
}

// 填充表单数据（用于编辑模式）
const fillForm = (data) => {
  form.value = {
    name: data.name || '',
    major: data.major || '',
    student_id: data.student_id || '',
    exam_subjects: data.exam_subjects || '',
    college: data.college || '',
    is_cross_major: !!data.is_cross_major,
    is_admitted: !!data.is_admitted,
    math_score: data.math_score || '',
    english_score: data.english_score || '',
    politics_score: data.politics_score || '',
    professional_score: data.professional_score || '',
    is_pass_line: !!data.is_pass_line,
    target_school: data.target_school || '',
    target_major: data.target_major || '',
    school_level: data.school_level || '',
    exam_year: data.exam_year || getCurrentYear()
  }
  // 设置picker索引
  const yIndex = yearOptions.findIndex(y => parseInt(y) === form.value.exam_year)
  if (yIndex > -1) yearIndex.value = yIndex
  const sIndex = schoolLevelOptions.findIndex(s => s === form.value.school_level)
  if (sIndex > -1) schoolLevelIndex.value = sIndex
  const cIndex = collegeOptions.findIndex(c => c === form.value.college)
  if (cIndex > -1) collegeIndex.value = cIndex
}

const validateScore = (score, maxScore, subjectName) => {
  if (score === '' || score === null || score === undefined) return null
  const numScore = parseFloat(score)
  if (isNaN(numScore)) return `${subjectName}成绩必须是数字`
  if (numScore < 0) return `${subjectName}成绩不能小于0`
  if (numScore > maxScore) return `${subjectName}成绩不能超过${maxScore}分`
  return null
}

const validateForm = () => {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return false
  }
  if (!form.value.major.trim()) {
    uni.showToast({ title: '请输入专业', icon: 'none' })
    return false
  }
  if (!form.value.student_id.trim()) {
    uni.showToast({ title: '请输入学号', icon: 'none' })
    return false
  }
  if (!form.value.exam_subjects.trim()) {
    uni.showToast({ title: '请输入考研科目', icon: 'none' })
    return false
  }
  if (!form.value.college) {
    uni.showToast({ title: '请选择隶属分院', icon: 'none' })
    return false
  }
  if (!form.value.target_school.trim()) {
    uni.showToast({ title: '请输入目标院校', icon: 'none' })
    return false
  }
  if (!form.value.school_level) {
    uni.showToast({ title: '请选择院校层次', icon: 'none' })
    return false
  }

  // 验证成绩范围
  const mathError = validateScore(form.value.math_score, 150, '数学')
  if (mathError) {
    uni.showToast({ title: mathError, icon: 'none' })
    return false
  }

  const englishError = validateScore(form.value.english_score, 100, '英语')
  if (englishError) {
    uni.showToast({ title: englishError, icon: 'none' })
    return false
  }

  const politicsError = validateScore(form.value.politics_score, 100, '政治')
  if (politicsError) {
    uni.showToast({ title: politicsError, icon: 'none' })
    return false
  }

  const professionalError = validateScore(form.value.professional_score, 150, '专业课')
  if (professionalError) {
    uni.showToast({ title: professionalError, icon: 'none' })
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const token = uni.getStorageSync('token')
  if (!token) {
    uni.showModal({
      title: '提示',
      content: '请先登录后再提交',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/login/login' })
        }
      }
    })
    return
  }

  submitting.value = true

    try {
      const submitData = {
        ...form.value,
        is_cross_major: form.value.is_cross_major ? 1 : 0,
        is_admitted: form.value.is_admitted ? 1 : 0,
        is_pass_line: form.value.is_pass_line ? 1 : 0,
        math_score: form.value.math_score ? parseFloat(form.value.math_score) : null,
        english_score: form.value.english_score ? parseFloat(form.value.english_score) : null,
        politics_score: form.value.politics_score ? parseFloat(form.value.politics_score) : null,
        professional_score: form.value.professional_score ? parseFloat(form.value.professional_score) : null
      }

      if (isEdit.value && editId.value) {
        const res = await recordApi.update(editId.value, submitData)
        uni.showToast({ title: res.msg || '修改成功', icon: 'success' })
      } else {
        const res = await recordApi.submit(submitData)
        uni.showToast({ title: res.msg || '提交成功', icon: 'success' })
      }

      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } catch (e) {
      console.error(e)
    } finally {
      submitting.value = false
    }
  }

  // 页面加载时检查是否有传入的编辑数据
  const initPage = () => {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = currentPage.options || {}

    console.log('页面参数:', options)

    if ((options.edit === '1' || options.edit === 1) && options.id) {
      isEdit.value = true
      editId.value = parseInt(options.id)
      console.log('进入编辑模式, id:', editId.value)
      // 尝试从storage获取数据
      const editData = uni.getStorageSync('editRecordData')
      if (editData) {
        fillForm(editData)
        uni.removeStorageSync('editRecordData')
      }
    } else {
      console.log('进入新增模式')
    }
  }

  initPage()
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f8f8f8;
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

.form-card {
  margin: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.form-section {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-section:last-child {
  border-bottom: none;
}

.section-label {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 24rpx;
  padding-left: 16rpx;
  border-left: 8rpx solid #c53030;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.item-label {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.item-label.required::after {
  content: '*';
  color: #c53030;
  margin-left: 4rpx;
}

.item-input {
  width: 100%;
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.picker-value {
  width: 100%;
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 80rpx;
  box-sizing: border-box;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
}

.submit-area {
  margin: 40rpx 20rpx;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  color: #fff;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.submit-btn[disabled] {
  opacity: 0.6;
}

.submit-tip {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  display: block;
  margin-top: 20rpx;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.score-limit {
  font-size: 24rpx;
  color: #999;
}

.placeholder {
  color: #999;
}
</style>

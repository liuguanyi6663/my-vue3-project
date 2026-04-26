<template>
  <view class="page">
    <!-- 日期选择 -->
    <view class="date-picker card">
      <view class="date-header">
        <text class="date-arrow" @click="changeDate(-1)">◀</text>
        <text class="current-date">{{ currentDate }}</text>
        <text class="date-arrow" @click="changeDate(1)" :class="{ disabled: isToday }">▶</text>
      </view>
      <view class="date-actions">
        <button class="btn-outline" style="font-size: 24rpx;" @click="goToday">今天</button>
        <button class="btn-outline" style="font-size: 24rpx; margin-left: 16rpx;" @click="showTemplates = true">应用模板</button>
      </view>
    </view>

    <!-- 模板选择弹窗 -->
    <view v-if="showTemplates" class="modal-mask" @click="showTemplates = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">选择学习模板</text>
        <view class="template-list">
          <view 
            v-for="(tpl, index) in templates" 
            :key="index"
            class="template-item"
            @click="applyTemplate(tpl.type)"
          >
            <text class="template-name">{{ tpl.name }}</text>
            <view class="template-tasks">
              <text v-for="(task, i) in tpl.tasks" :key="i" class="task-tag">
                {{ task.subject }} {{ task.plan_duration }}min
              </text>
            </view>
          </view>
        </view>
        <button class="btn-outline" @click="showTemplates = false">取消</button>
      </view>
    </view>

    <!-- 计划列表 -->
    <view class="plan-section">
      <view class="flex-between mb-20" style="padding: 0 10rpx;">
        <text class="title">今日任务 ({{ plans.length }})</text>
        <text class="text-primary" style="font-size: 26rpx;" @click="showAddForm = true">+ 添加</text>
      </view>

      <!-- 添加表单 -->
      <view v-if="showAddForm" class="card add-form">
        <view class="form-row">
          <text class="form-label">科目</text>
          <input class="form-input" v-model="newPlan.subject" placeholder="如：英语、政治、数学" />
        </view>
        <view class="form-row">
          <text class="form-label">任务</text>
          <input class="form-input" v-model="newPlan.task_name" placeholder="任务名称" />
        </view>
        <view class="form-row">
          <text class="form-label">时长(分钟)</text>
          <input class="form-input" v-model="newPlan.plan_duration" type="number" placeholder="60" />
        </view>
        <view class="form-row">
          <text class="form-label">优先级</text>
          <picker :range="['高', '中', '低']" @change="(e) => newPlan.priority = ['high','medium','low'][e.detail.value]">
            <view class="form-input picker-value">{{ {high:'高', medium:'中', low:'低'}[newPlan.priority] || '请选择' }}</view>
          </picker>
        </view>
        <view class="form-actions">
          <button class="btn-outline" style="font-size: 26rpx;" @click="showAddForm = false">取消</button>
          <button class="btn-primary" style="font-size: 26rpx; margin-left: 16rpx;" @click="addPlan">添加</button>
        </view>
      </view>

      <view v-if="plans.length === 0 && !loading" class="empty-tip card">
        <text>暂无计划，点击添加或使用模板快速创建</text>
      </view>

      <view 
        class="plan-card card" 
        v-for="(item, index) in plans" 
        :key="index"
        :class="{ completed: item.status === 'completed' }"
      >
        <view class="plan-main">
          <view class="check-box" :class="{ checked: item.status === 'completed' }" @click="quickCheckin(item)">
            <text v-if="item.status === 'completed'">✓</text>
          </view>
          <view class="plan-info">
            <view class="plan-top">
              <text class="subject-tag" :class="'tag-' + getSubjectClass(item.subject)">{{ item.subject }}</text>
              <text class="priority-dot" :class="'dot-' + item.priority"></text>
            </view>
            <text class="task-name">{{ item.task_name }}</text>
            <text class="task-duration">预计 {{ item.plan_duration }} 分钟</text>
          </view>
        </view>
        
        <view class="plan-actions" v-if="item.status !== 'completed'">
          <button class="action-btn checkin-btn" @click="doCheckin(item)">打卡完成</button>
          <button class="action-btn edit-btn" @click="editPlan(item)">编辑</button>
          <button class="action-btn delete-btn" @click="deletePlan(item.id)">删除</button>
        </view>
      </view>
    </view>

    <!-- 打卡弹窗 -->
    <view v-if="showCheckinModal" class="modal-mask" @click="showCheckinModal = false">
      <view class="modal-content checkin-modal" @click.stop>
        <text class="modal-title">学习打卡</text>
        <text class="checkin-task">{{ currentTask?.task_name }}</text>
        
        <view class="form-row">
          <text class="form-label">实际时长(分钟)</text>
          <input class="form-input" v-model="checkinData.duration" type="number" :placeholder="String(currentTask?.plan_duration || 60)" />
        </view>
        
        <view class="form-row">
          <text class="form-label">备注（可选）</text>
          <textarea class="form-textarea" v-model="checkinData.remark" placeholder="今天的学习心得..." maxlength="200"></textarea>
        </view>
        
        <view class="form-actions">
          <button class="btn-outline" @click="showCheckinModal = false">取消</button>
          <button class="btn-primary" @click="submitCheckin">确认打卡</button>
        </view>
      </view>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { studyApi } from '@/api/index'
import { getTimeSeed } from '@/utils/date'

const currentDate = ref(getTimeSeed().toISOString().split('T')[0])
const plans = ref([])
const templates = ref([])
const loading = ref(false)
const showAddForm = ref(false)
const showTemplates = ref(false)
const showCheckinModal = ref(false)
const currentTask = ref(null)

const newPlan = ref({
  subject: '',
  task_name: '',
  plan_duration: 60,
  priority: 'medium'
})

const checkinData = ref({
  duration: '',
  remark: ''
})

const isToday = computed(() => {
  return currentDate.value === getTimeSeed().toISOString().split('T')[0]
})

const getSubjectClass = (subject) => {
  const map = { '英语': 'english', '政治': 'politics', '数学': 'math', '综合': 'comprehensive' }
  return map[subject] || subject
}

const loadPlans = async () => {
  loading.value = true
  try {
    const res = await studyApi.getPlans(currentDate.value)
    plans.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadTemplates = async () => {
  try {
    const res = await studyApi.getTemplates()
    templates.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const changeDate = (days) => {
  const date = new Date(currentDate.value)
  date.setDate(date.getDate() + days)
  currentDate.value = date.toISOString().split('T')[0]
}

const goToday = () => {
  currentDate.value = getTimeSeed().toISOString().split('T')[0]
}

const addPlan = async () => {
  if (!newPlan.value.subject || !newPlan.value.task_name) {
    return uni.showToast({ title: '请填写完整', icon: 'none' })
  }
  
  try {
    await studyApi.createPlan({
      ...newPlan.value,
      plan_date: currentDate.value
    })
    
    uni.showToast({ title: '添加成功', icon: 'success' })
    showAddForm.value = false
    newPlan.value = { subject: '', task_name: '', plan_duration: 60, priority: 'medium' }
    loadPlans()
  } catch (e) {
    console.error(e)
  }
}

const applyTemplate = async (type) => {
  try {
    uni.showLoading({ title: '应用中...' })
    await studyApi.applyTemplate({ template_type: type, date: currentDate.value })
    uni.hideLoading()
    showTemplates.value = false
    uni.showToast({ title: '模板已应用', icon: 'success' })
    loadPlans()
  } catch (e) {
    uni.hideLoading()
    console.error(e)
  }
}

const quickCheckin = async (item) => {
  if (item.status === 'completed') return
  
  currentTask.value = item
  checkinData.value = { duration: String(item.plan_duration), remark: '' }
  showCheckinModal.value = true
}

const doCheckin = (item) => {
  currentTask.value = item
  checkinData.value = { duration: String(item.plan_duration), remark: '' }
  showCheckinModal.value = true
}

const submitCheckin = async () => {
  try {
    await studyApi.checkin({
      plan_id: currentTask.value.id,
      subject: currentTask.value.subject,
      task_name: currentTask.value.task_name,
      duration: parseInt(checkinData.value.duration) || currentTask.value?.plan_duration,
      remark: checkinData.value.remark
    })
    
    uni.showToast({ title: '打卡成功！继续加油💪', icon: 'success' })
    showCheckinModal.value = false
    loadPlans()
  } catch (e) {
    console.error(e)
  }
}

const editPlan = async (item) => {
  // 简单实现：直接更新状态或删除后重新添加
  uni.showModal({
    title: '编辑',
    content: `当前任务：${item.task_name}`,
    confirmText: '标记完成',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        try {
          await studyApi.updatePlan(item.id, { status: 'completed' })
          loadPlans()
        } catch (e) {
          console.error(e)
        }
      }
    }
  })
}

const deletePlan = async (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个任务吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await studyApi.deletePlan(id)
          uni.showToast({ title: '已删除', icon: 'success' })
          loadPlans()
        } catch (e) {
          console.error(e)
        }
      }
    }
  })
}

watch(currentDate, () => {
  loadPlans()
})

onMounted(() => {
  loadPlans()
  loadTemplates()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.date-picker {
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-header {
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.current-date {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.date-arrow {
  font-size: 28rpx;
  color: #007AFF;
  padding: 8rpx;
}

.date-arrow.disabled {
  color: #ccc;
}

.date-actions {
  display: flex;
}

.plan-section {
  padding: 20rpx 24rpx;
}

.empty-tip {
  text-align: center;
  padding: 60rpx 30rpx;
  color: #999;
  font-size: 28rpx;
}

.add-form {
  margin-bottom: 20rpx;
  padding: 24rpx;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.form-label {
  width: 140rpx;
  font-size: 26rpx;
  color: #666;
}

.form-input {
  flex: 1;
  height: 70rpx;
  background: #f9f9f9;
  border-radius: 10rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
}

.picker-value {
  line-height: 70rpx;
  color: #666;
}

.form-textarea {
  flex: 1;
  height: 120rpx;
  background: #f9f9f9;
  border-radius: 10rpx;
  padding: 12rpx 16rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 16rpx;
}

.plan-card {
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.plan-card.completed {
  opacity: 0.6;
  background: #f0fff0;
}

.plan-main {
  display: flex;
  align-items: flex-start;
}

.check-box {
  width: 44rpx;
  height: 44rpx;
  border: 3rpx solid #ddd;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
}

.check-box.checked {
  background: #07c160;
  border-color: #07c160;
  color: #fff;
  font-size: 28rpx;
}

.plan-info {
  flex: 1;
}

.plan-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.subject-tag {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  color: #fff;
}

.tag-english { background: #007AFF; }
.tag-politics { background: #ff3b30; }
.tag-math { background: #07c160; }
.tag-comprehensive { background: #ff9500; }

.priority-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
}

.dot-high { background: #ff3b30; }
.dot-medium { background: #ff9500; }
.dot-low { background: #07c160; }

.task-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 6rpx;
}

.task-duration {
  font-size: 24rpx;
  color: #999;
}

.plan-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  height: 64rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  border: none;
}

.checkin-btn {
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: #fff;
}

.edit-btn {
  background: #f0f0f0;
  color: #666;
}

.delete-btn {
  background: #fff0f0;
  color: #ff3b30;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  width: 85%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  display: block;
  margin-bottom: 30rpx;
}

.template-list {
  margin-bottom: 24rpx;
}

.template-item {
  padding: 24rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.template-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.template-tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.task-tag {
  font-size: 22rpx;
  background: #e8f4ff;
  color: #007AFF;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.checkin-modal {
  max-height: 70vh;
}

.checkin-task {
  font-size: 28rpx;
  color: #007AFF;
  text-align: center;
  display: block;
  margin-bottom: 24rpx;
}
</style>

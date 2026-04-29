<template>
  <view class="admin-page">
    <view class="admin-header">
      <text class="admin-title">国家线数据管理</text>
      <text class="admin-desc">管理历年考研国家线数据</text>
    </view>

    <view class="content-section">
      <view class="add-section card">
        <text class="section-title">添加国家线数据</text>

        <view class="form-row">
          <view class="form-group half">
            <text class="form-label">年份</text>
            <input class="form-input" v-model="form.year" type="number" placeholder="如：2026" />
          </view>
          <view class="form-group half">
            <text class="form-label">区域</text>
            <view class="type-selector">
              <view class="type-option" :class="{ active: form.region === 'A' }" @click="form.region = 'A'">
                <text>A区</text>
              </view>
              <view class="type-option" :class="{ active: form.region === 'B' }" @click="form.region = 'B'">
                <text>B区</text>
              </view>
            </view>
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">类别</text>
          <view class="type-selector">
            <view class="type-option" :class="{ active: form.category === 'academic' }" @click="form.category = 'academic'">
              <text>学术型</text>
            </view>
            <view class="type-option" :class="{ active: form.category === 'professional' }" @click="form.category = 'professional'">
              <text>专业型</text>
            </view>
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">学科门类</text>
          <input class="form-input" v-model="form.subject_type" placeholder="如：哲学、经济学、法学" />
        </view>

        <view class="form-row">
          <view class="form-group third">
            <text class="form-label">总分</text>
            <input class="form-input" v-model="form.total_score" type="number" placeholder="总分线" />
          </view>
          <view class="form-group third">
            <text class="form-label">政治</text>
            <input class="form-input" v-model="form.politics_score" type="number" placeholder="政治线" />
          </view>
          <view class="form-group third">
            <text class="form-label">外语</text>
            <input class="form-input" v-model="form.foreign_score" type="number" placeholder="外语线" />
          </view>
        </view>

        <view class="form-row">
          <view class="form-group half">
            <text class="form-label">业务课一</text>
            <input class="form-input" v-model="form.subject1_score" type="number" placeholder="业务课一线" />
          </view>
          <view class="form-group half">
            <text class="form-label">业务课二</text>
            <input class="form-input" v-model="form.subject2_score" type="number" placeholder="业务课二线" />
          </view>
        </view>

        <button class="submit-btn" @click="handleAdd" :disabled="submitting">
          {{ submitting ? '添加中...' : '添加数据' }}
        </button>
      </view>

      <view class="batch-section card">
        <text class="section-title">批量添加（同年份、区域、类别）</text>
        <view class="form-row">
          <view class="form-group third">
            <text class="form-label">年份</text>
            <input class="form-input" v-model="batchForm.year" type="number" placeholder="年份" />
          </view>
          <view class="form-group third">
            <text class="form-label">区域</text>
            <view class="type-selector small">
              <view class="type-option" :class="{ active: batchForm.region === 'A' }" @click="batchForm.region = 'A'">
                <text>A区</text>
              </view>
              <view class="type-option" :class="{ active: batchForm.region === 'B' }" @click="batchForm.region = 'B'">
                <text>B区</text>
              </view>
            </view>
          </view>
          <view class="form-group third">
            <text class="form-label">类别</text>
            <view class="type-selector small">
              <view class="type-option" :class="{ active: batchForm.category === 'academic' }" @click="batchForm.category = 'academic'">
                <text>学术</text>
              </view>
              <view class="type-option" :class="{ active: batchForm.category === 'professional' }" @click="batchForm.category = 'professional'">
                <text>专业</text>
              </view>
            </view>
          </view>
        </view>

        <view v-for="(item, index) in batchItems" :key="index" class="batch-item">
          <view class="batch-item-header">
            <text class="batch-item-index">第{{ index + 1 }}条</text>
            <text class="batch-remove" @click="removeBatchItem(index)">删除</text>
          </view>
          <view class="form-row">
            <view class="form-group half">
              <text class="form-label">学科门类</text>
              <input class="form-input" v-model="item.subject_type" placeholder="学科门类" />
            </view>
            <view class="form-group half">
              <text class="form-label">总分</text>
              <input class="form-input" v-model="item.total_score" type="number" placeholder="总分" />
            </view>
          </view>
          <view class="form-row">
            <view class="form-group third">
              <text class="form-label">政治</text>
              <input class="form-input" v-model="item.politics_score" type="number" placeholder="政治" />
            </view>
            <view class="form-group third">
              <text class="form-label">外语</text>
              <input class="form-input" v-model="item.foreign_score" type="number" placeholder="外语" />
            </view>
            <view class="form-group third">
              <text class="form-label">业务课一</text>
              <input class="form-input" v-model="item.subject1_score" type="number" placeholder="课一" />
            </view>
          </view>
          <view class="form-row">
            <view class="form-group half">
              <text class="form-label">业务课二</text>
              <input class="form-input" v-model="item.subject2_score" type="number" placeholder="业务课二" />
            </view>
          </view>
        </view>

        <view class="batch-actions">
          <text class="add-item-btn" @click="addBatchItem">+ 添加一条</text>
          <button class="submit-btn batch-submit" @click="handleBatchSave" :disabled="submitting">
            {{ submitting ? '保存中...' : '批量保存' }}
          </button>
        </view>
      </view>

      <view class="list-section card">
        <view class="section-header">
          <text class="section-title">已录入数据</text>
          <text class="section-count">共 {{ total }} 条</text>
        </view>

        <view class="filter-row">
          <input class="filter-input" v-model="filterYear" type="number" placeholder="筛选年份" />
          <view class="filter-btns">
            <text class="filter-btn" @click="loadList">查询</text>
            <text class="filter-btn reset" @click="resetFilter">重置</text>
          </view>
        </view>

        <view v-if="loading" class="loading-state">
          <text>加载中...</text>
        </view>
        <view v-else-if="dataList.length === 0" class="empty-state">
          <text class="empty-text">暂无数据</text>
        </view>
        <view v-else class="data-list">
          <view v-for="item in dataList" :key="item.id" class="data-card">
            <view class="data-card-header">
              <view class="data-tags">
                <text class="tag tag-year">{{ item.year }}</text>
                <text class="tag" :class="item.region === 'A' ? 'tag-a' : 'tag-b'">{{ item.region }}区</text>
                <text class="tag" :class="item.category === 'academic' ? 'tag-academic' : 'tag-professional'">
                  {{ item.category === 'academic' ? '学术型' : '专业型' }}
                </text>
              </view>
              <view class="data-actions">
                <text class="action-btn edit" @click="handleEdit(item)">编辑</text>
                <text class="action-btn delete" @click="handleDelete(item)">删除</text>
              </view>
            </view>
            <text class="data-subject">{{ item.subject_type }}</text>
            <view class="data-scores">
              <view class="score-item">
                <text class="score-label">总分</text>
                <text class="score-value highlight">{{ item.total_score }}</text>
              </view>
              <view class="score-item">
                <text class="score-label">政治</text>
                <text class="score-value">{{ item.politics_score || '-' }}</text>
              </view>
              <view class="score-item">
                <text class="score-label">外语</text>
                <text class="score-value">{{ item.foreign_score || '-' }}</text>
              </view>
              <view class="score-item">
                <text class="score-label">业务课一</text>
                <text class="score-value">{{ item.subject1_score || '-' }}</text>
              </view>
              <view class="score-item">
                <text class="score-label">业务课二</text>
                <text class="score-value">{{ item.subject2_score || '-' }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="dataList.length > 0 && dataList.length < total" class="load-more" @click="loadMore">
          <text>{{ loadingMore ? '加载中...' : '加载更多' }}</text>
        </view>
      </view>
    </view>

    <view class="edit-modal" v-if="showEditModal">
      <view class="modal-mask" @click="showEditModal = false"></view>
      <view class="modal-content">
        <text class="modal-title">编辑国家线数据</text>

        <view class="form-row">
          <view class="form-group half">
            <text class="form-label">年份</text>
            <input class="form-input" v-model="editForm.year" type="number" />
          </view>
          <view class="form-group half">
            <text class="form-label">区域</text>
            <view class="type-selector">
              <view class="type-option" :class="{ active: editForm.region === 'A' }" @click="editForm.region = 'A'">
                <text>A区</text>
              </view>
              <view class="type-option" :class="{ active: editForm.region === 'B' }" @click="editForm.region = 'B'">
                <text>B区</text>
              </view>
            </view>
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">类别</text>
          <view class="type-selector">
            <view class="type-option" :class="{ active: editForm.category === 'academic' }" @click="editForm.category = 'academic'">
              <text>学术型</text>
            </view>
            <view class="type-option" :class="{ active: editForm.category === 'professional' }" @click="editForm.category = 'professional'">
              <text>专业型</text>
            </view>
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">学科门类</text>
          <input class="form-input" v-model="editForm.subject_type" />
        </view>

        <view class="form-row">
          <view class="form-group third">
            <text class="form-label">总分</text>
            <input class="form-input" v-model="editForm.total_score" type="number" />
          </view>
          <view class="form-group third">
            <text class="form-label">政治</text>
            <input class="form-input" v-model="editForm.politics_score" type="number" />
          </view>
          <view class="form-group third">
            <text class="form-label">外语</text>
            <input class="form-input" v-model="editForm.foreign_score" type="number" />
          </view>
        </view>

        <view class="form-row">
          <view class="form-group half">
            <text class="form-label">业务课一</text>
            <input class="form-input" v-model="editForm.subject1_score" type="number" />
          </view>
          <view class="form-group half">
            <text class="form-label">业务课二</text>
            <input class="form-input" v-model="editForm.subject2_score" type="number" />
          </view>
        </view>

        <view class="modal-actions">
          <button class="modal-btn cancel" @click="showEditModal = false">取消</button>
          <button class="modal-btn confirm" @click="handleUpdate" :disabled="submitting">保存</button>
        </view>
      </view>
    </view>

    <view style="height: 60rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { nationalLineApi } from '@/api/index.js'

const form = ref({
  year: new Date().getFullYear(),
  region: 'A',
  category: 'academic',
  subject_type: '',
  total_score: '',
  politics_score: '',
  foreign_score: '',
  subject1_score: '',
  subject2_score: ''
})

const batchForm = ref({
  year: new Date().getFullYear(),
  region: 'A',
  category: 'academic'
})

const batchItems = ref([
  { subject_type: '', total_score: '', politics_score: '', foreign_score: '', subject1_score: '', subject2_score: '' }
])

const editForm = ref({})
const showEditModal = ref(false)
const submitting = ref(false)

const dataList = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterYear = ref('')

const loadList = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    page.value = 1
  }
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterYear.value) params.year = filterYear.value

    const res = await nationalLineApi.getAdminList(params)
    if (res.code === 200) {
      const list = res.data?.list || []
      if (isLoadMore) {
        dataList.value = [...dataList.value, ...list]
      } else {
        dataList.value = list
      }
      total.value = res.data?.total || 0
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  loadList(true)
}

const resetFilter = () => {
  filterYear.value = ''
  loadList()
}

const handleAdd = async () => {
  if (!form.value.year || !form.value.subject_type || !form.value.total_score) {
    uni.showToast({ title: '请填写必要字段', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const res = await nationalLineApi.add(form.value)
    if (res.code === 200) {
      uni.showToast({ title: '添加成功', icon: 'success' })
      form.value.subject_type = ''
      form.value.total_score = ''
      form.value.politics_score = ''
      form.value.foreign_score = ''
      form.value.subject1_score = ''
      form.value.subject2_score = ''
      loadList()
    } else {
      uni.showToast({ title: res.msg || '添加失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

const addBatchItem = () => {
  batchItems.value.push({ subject_type: '', total_score: '', politics_score: '', foreign_score: '', subject1_score: '', subject2_score: '' })
}

const removeBatchItem = (index) => {
  if (batchItems.value.length > 1) {
    batchItems.value.splice(index, 1)
  }
}

const handleBatchSave = async () => {
  if (!batchForm.value.year) {
    uni.showToast({ title: '请填写年份', icon: 'none' })
    return
  }

  const validItems = batchItems.value.filter(item => item.subject_type && item.total_score)
  if (validItems.length === 0) {
    uni.showToast({ title: '请至少添加一条有效数据', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const res = await nationalLineApi.batchSave({
      ...batchForm.value,
      items: validItems.map(item => ({
        ...item,
        total_score: parseInt(item.total_score),
        politics_score: item.politics_score ? parseInt(item.politics_score) : null,
        foreign_score: item.foreign_score ? parseInt(item.foreign_score) : null,
        subject1_score: item.subject1_score ? parseInt(item.subject1_score) : null,
        subject2_score: item.subject2_score ? parseInt(item.subject2_score) : null
      }))
    })
    if (res.code === 200) {
      uni.showToast({ title: '批量保存成功', icon: 'success' })
      batchItems.value = [{ subject_type: '', total_score: '', politics_score: '', foreign_score: '', subject1_score: '', subject2_score: '' }]
      loadList()
    } else {
      uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

const handleEdit = (item) => {
  editForm.value = { ...item }
  showEditModal.value = true
}

const handleUpdate = async () => {
  submitting.value = true
  try {
    const res = await nationalLineApi.update(editForm.value.id, editForm.value)
    if (res.code === 200) {
      uni.showToast({ title: '更新成功', icon: 'success' })
      showEditModal.value = false
      loadList()
    } else {
      uni.showToast({ title: res.msg || '更新失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '更新失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

const handleDelete = (item) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除${item.year}年${item.region}区${item.category === 'academic' ? '学术型' : '专业型'}${item.subject_type}的数据吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await nationalLineApi.delete(item.id)
          if (result.code === 200) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            loadList()
          }
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(() => {
  const user = uni.getStorageSync('userInfo')
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    uni.showToast({ title: '权限不足', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return
  }
  loadList()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
}

.admin-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.admin-desc {
  font-size: 24rpx;
  color: rgba(255,255,255,0.85);
}

.content-section {
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-count {
  font-size: 24rpx;
  color: #999;
}

.form-group {
  margin-bottom: 20rpx;
}

.form-group.half {
  flex: 1;
}

.form-group.third {
  flex: 1;
}

.form-label {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 8rpx;
  display: block;
}

.form-input {
  width: 100%;
  height: 72rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: 16rpx;
}

.type-selector {
  display: flex;
  gap: 12rpx;
}

.type-selector.small .type-option {
  padding: 8rpx 16rpx;
  font-size: 24rpx;
}

.type-option {
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  border: 1rpx solid #e0e0e0;
  font-size: 26rpx;
  color: #666;
}

.type-option.active {
  background: #4CAF50;
  color: #fff;
  border-color: #4CAF50;
}

.submit-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin-top: 16rpx;
}

.submit-btn[disabled] {
  opacity: 0.6;
}

.batch-section {
  border-top: 4rpx solid #4CAF50;
}

.batch-item {
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.batch-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.batch-item-index {
  font-size: 26rpx;
  font-weight: bold;
  color: #4CAF50;
}

.batch-remove {
  font-size: 24rpx;
  color: #ff4d4f;
  padding: 4rpx 12rpx;
  border: 1rpx solid #ff4d4f;
  border-radius: 6rpx;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 16rpx;
}

.add-item-btn {
  font-size: 26rpx;
  color: #4CAF50;
  padding: 16rpx 24rpx;
  border: 1rpx dashed #4CAF50;
  border-radius: 10rpx;
  flex-shrink: 0;
}

.batch-submit {
  flex: 1;
}

.filter-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.filter-input {
  flex: 1;
  height: 64rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
}

.filter-btns {
  display: flex;
  gap: 12rpx;
}

.filter-btn {
  padding: 0 24rpx;
  height: 64rpx;
  line-height: 64rpx;
  background: #4CAF50;
  color: #fff;
  border-radius: 10rpx;
  font-size: 26rpx;
}

.filter-btn.reset {
  background: #999;
}

.loading-state {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}

.empty-state {
  padding: 80rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.data-card {
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 20rpx;
}

.data-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.data-tags {
  display: flex;
  gap: 8rpx;
  align-items: center;
}

.tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  color: #fff;
}

.tag-year {
  background: #1890ff;
}

.tag-a {
  background: #4CAF50;
}

.tag-b {
  background: #ff9800;
}

.tag-academic {
  background: #9c27b0;
}

.tag-professional {
  background: #e91e63;
}

.data-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 6rpx;
  border: 1rpx solid;
}

.action-btn.edit {
  color: #4CAF50;
  border-color: #4CAF50;
}

.action-btn.delete {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.data-subject {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
  display: block;
}

.data-scores {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.score-item {
  background: #fff;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100rpx;
}

.score-label {
  font-size: 20rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.score-value {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}

.score-value.highlight {
  color: #ff6b6b;
}

.load-more {
  text-align: center;
  padding: 30rpx 0;
  color: #4CAF50;
  font-size: 26rpx;
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
}

.modal-content {
  position: relative;
  width: 90%;
  max-height: 80vh;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  overflow-y: auto;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 24rpx;
  display: block;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 24rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #fff;
}

.modal-btn[disabled] {
  opacity: 0.6;
}
</style>

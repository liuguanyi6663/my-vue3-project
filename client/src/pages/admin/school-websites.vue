<template>
  <view class="admin-page">
    <view class="page-header">
      <text class="page-title">学校官网管理</text>
    </view>

    <view class="search-bar card">
      <view class="search-input-wrapper">
        <input class="search-input" v-model="keyword" placeholder="搜索学校名称" confirm-type="search" @confirm="handleSearch" />
        <button v-if="keyword" class="clear-btn" @click="clearSearch">✕</button>
      </view>
      <button class="search-btn" @click="handleSearch">搜索</button>
    </view>

    <view class="action-bar card">
      <button class="add-btn" @click="showAddModal = true">添加学校</button>
    </view>

    <view class="list-section">
      <view v-if="loading && schools.length === 0" class="loading-state">
        <text>加载中...</text>
      </view>

      <view v-else-if="schools.length === 0" class="empty-state">
        <text class="empty-text">暂无学校信息</text>
      </view>

      <view v-else class="school-list">
        <view v-for="school in schools" :key="school.id" class="school-item card">
          <view class="school-info">
            <text class="school-name">{{ school.name }}</text>
            <text class="school-url">{{ school.website }}</text>
            <view class="school-meta">
              <text v-if="school.type" class="meta-tag">{{ school.type }}</text>
              <text v-if="school.region" class="meta-tag">{{ school.region }}</text>
              <text class="meta-count">点击 {{ school.click_count || 0 }}</text>
            </view>
          </view>
          <view class="school-actions">
            <button class="edit-btn" @click="editSchool(school)">编辑</button>
            <button class="delete-btn" @click="confirmDelete(school.id)">删除</button>
          </view>
        </view>
      </view>

      <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
        <text>加载更多</text>
      </view>
    </view>

    <view v-if="showAddModal || showEditModal" class="modal-mask" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ showEditModal ? '编辑学校' : '添加学校' }}</text>
          <text class="close-btn" @click="closeModal">✕</text>
        </view>

        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">学校名称 *</text>
            <input class="form-input" v-model="form.name" placeholder="请输入学校名称" />
          </view>

          <view class="form-item">
            <text class="form-label">官网地址 *</text>
            <input class="form-input" v-model="form.website" placeholder="请输入官网地址" />
          </view>

          <view class="form-item">
            <text class="form-label">学校类型</text>
            <picker :range="typeOptions" @change="onTypeChange">
              <view class="picker-value">{{ form.type || '请选择' }}</view>
            </picker>
          </view>

          <view class="form-item">
            <text class="form-label">地区</text>
            <input class="form-input" v-model="form.region" placeholder="请输入地区" />
          </view>

          <view class="form-item">
            <text class="form-label">排序</text>
            <input class="form-input" type="number" v-model="form.sort_order" placeholder="数字越大越靠前" />
          </view>

          <view class="form-item" v-if="showEditModal">
            <text class="form-label">状态</text>
            <picker :range="statusLabels" @change="onStatusChange">
              <view class="picker-value">{{ form.status === 1 ? '启用' : '禁用' }}</view>
            </picker>
          </view>
        </view>

        <view class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="submitForm" :disabled="submitting">
            {{ submitting ? '提交中...' : '确定' }}
          </button>
        </view>
      </view>
    </view>

    <view style="height: 80rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { schoolWebsitesApi } from '@/api/index'

const loading = ref(false)
const submitting = ref(false)
const schools = ref([])
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const showAddModal = ref(false)
const showEditModal = ref(false)
const keyword = ref('')

const typeOptions = ['985', '211', '双一流', '普通']
const statusLabels = ['禁用', '启用']

const form = ref({
  id: null,
  name: '',
  website: '',
  type: '',
  region: '',
  logo_url: '',
  sort_order: 0,
  status: 1
})

const loadSchools = async (reset = false) => {
  if (reset) {
    page.value = 1
    schools.value = []
    hasMore.value = true
  }

  loading.value = true
  try {
    const res = await schoolWebsitesApi.getAdminList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    })
    if (res.code === 200) {
      const newList = res.data.list || []
      if (reset) {
        schools.value = newList
      } else {
        schools.value = schools.value.concat(newList)
      }
      hasMore.value = newList.length >= pageSize.value
    }
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadSchools(true)
}

const clearSearch = () => {
  keyword.value = ''
  loadSchools(true)
}

const loadMore = () => {
  page.value++
  loadSchools()
}

const editSchool = (school) => {
  form.value = {
    id: school.id,
    name: school.name,
    website: school.website,
    type: school.type || '',
    region: school.region || '',
    logo_url: school.logo_url || '',
    sort_order: school.sort_order || 0,
    status: school.status
  }
  showEditModal.value = true
}

const onTypeChange = (e) => {
  form.value.type = typeOptions[e.detail.value]
}

const onStatusChange = (e) => {
  form.value.status = e.detail.value === 1 ? 1 : 0
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  resetForm()
}

const resetForm = () => {
  form.value = {
    id: null,
    name: '',
    website: '',
    type: '',
    region: '',
    logo_url: '',
    sort_order: 0,
    status: 1
  }
}

const submitForm = async () => {
  if (!form.value.name || !form.value.website) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    let res
    if (showEditModal.value) {
      res = await schoolWebsitesApi.update(form.value.id, form.value)
    } else {
      res = await schoolWebsitesApi.create(form.value)
    }

    if (res.code === 200) {
      uni.showToast({ title: showEditModal.value ? '修改成功' : '添加成功', icon: 'success' })
      closeModal()
      loadSchools(true)
    } else {
      uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个学校吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const res = await schoolWebsitesApi.delete(id)
          if (res.code === 200) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            loadSchools(true)
          } else {
            uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(() => {
  loadSchools(true)
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  padding: 80rpx 40rpx 60rpx;
  text-align: center;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  display: block;
}

.card {
  margin: 20rpx 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.search-bar {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f7f8fa;
  border-radius: 24rpx;
  padding: 0 20rpx;
  height: 72rpx;
}

.search-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #333;
}

.clear-btn {
  font-size: 28rpx;
  color: #999;
  background: transparent;
  border: none;
  padding: 0 10rpx;
  line-height: 1;
}

.search-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 24rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
}

.add-btn {
  background: linear-gradient(135deg, #c53030, #9b2c2c);
  color: #fff;
  border: none;
  border-radius: 24rpx;
  padding: 16rpx 40rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.list-section {
  margin-top: 10rpx;
}

.school-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.school-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.school-info {
  flex: 1;
  margin-right: 20rpx;
}

.school-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.school-url {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.school-meta {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 22rpx;
  color: #fff;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
}

.meta-count {
  font-size: 22rpx;
  color: #999;
}

.school-actions {
  display: flex;
  gap: 12rpx;
  flex-shrink: 0;
}

.edit-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 20rpx;
  padding: 12rpx 28rpx;
  font-size: 24rpx;
}

.delete-btn {
  background: linear-gradient(135deg, #ff4d4f, #d9363e);
  color: #fff;
  border: none;
  border-radius: 20rpx;
  padding: 12rpx 28rpx;
  font-size: 24rpx;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #fff;
  border-radius: 20rpx;
  width: 85%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  font-size: 36rpx;
  color: #999;
  padding: 10rpx;
}

.modal-body {
  padding: 30rpx;
  flex: 1;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 28rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 72rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
  border: 2rpx solid transparent;
}

.picker-value {
  height: 72rpx;
  line-height: 72rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.cancel-btn {
  flex: 1;
  height: 88rpx;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.confirm-btn {
  flex: 1;
  height: 88rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.confirm-btn[disabled] {
  opacity: 0.5;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

.empty-text {
  font-weight: bold;
  color: #666;
  display: block;
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 26rpx;
}
</style>

<template>
  <view class="admin-page">
    <view class="admin-header">
      <text class="admin-title">用户列表</text>
      <text class="admin-desc">管理所有用户信息与角色</text>
    </view>

    <view class="content-section card">
      <view class="filter-bar">
        <view class="search-box">
          <input class="search-input" v-model="keyword" placeholder="搜索昵称/学号/手机号" confirm-type="search" @confirm="onSearch" />
        </view>
        <view class="filter-row">
          <view class="filter-item">
            <text class="filter-label">角色：</text>
            <picker mode="selector" :range="roleOptions" :value="roleIndex" @change="onRoleChange">
              <view class="picker">{{ roleOptions[roleIndex] }}</view>
            </picker>
          </view>
          <button class="btn-search" @click="onSearch">搜索</button>
        </view>
      </view>

      <view class="stats-bar">
        <view class="stat-item">
          <text class="stat-num">{{ totalUsers }}</text>
          <text class="stat-label">总用户</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ adminCount }}</text>
          <text class="stat-label">管理员</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ studentCount }}</text>
          <text class="stat-label">学生</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ bannedCount }}</text>
          <text class="stat-label">已禁言</text>
        </view>
      </view>

      <view class="empty-state" v-if="users.length === 0">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无用户数据</text>
      </view>

      <view class="user-list" v-else>
        <view class="user-item" v-for="item in users" :key="item.id">
          <view class="user-top">
            <image class="user-avatar" :src="avatarUrl(item.avatar)" mode="aspectFill" />
            <view class="user-basic">
              <view class="user-name-row">
                <text class="user-nickname">{{ item.nickname || '未设置' }}</text>
                <text class="role-tag" :class="item.role">{{ item.role === 'admin' ? '管理员' : '学生' }}</text>
                <text class="status-tag" :class="{ banned: item.is_banned === 1, disabled: item.status === 0 }">
                  {{ item.status === 0 ? '已禁用' : item.is_banned === 1 ? '已禁言' : '正常' }}
                </text>
              </view>
              <text class="user-id">ID: {{ item.id }}</text>
            </view>
          </view>

          <view class="user-info-grid">
            <view class="info-cell">
              <text class="cell-label">学号</text>
              <text class="cell-value">{{ item.student_id || '-' }}</text>
            </view>
            <view class="info-cell">
              <text class="cell-label">手机号</text>
              <text class="cell-value">{{ item.phone || '-' }}</text>
            </view>
            <view class="info-cell">
              <text class="cell-label">学院</text>
              <text class="cell-value">{{ item.college || '-' }}</text>
            </view>
            <view class="info-cell">
              <text class="cell-label">专业</text>
              <text class="cell-value">{{ item.major || '-' }}</text>
            </view>
            <view class="info-cell">
              <text class="cell-label">目标院校</text>
              <text class="cell-value">{{ item.target_school || '-' }}</text>
            </view>
            <view class="info-cell">
              <text class="cell-label">目标专业</text>
              <text class="cell-value">{{ item.target_major || '-' }}</text>
            </view>
            <view class="info-cell" v-if="item.exam_year">
              <text class="cell-label">考研年份</text>
              <text class="cell-value">{{ item.exam_year }}</text>
            </view>
            <view class="info-cell">
              <text class="cell-label">注册时间</text>
              <text class="cell-value">{{ formatDate(item.created_at) }}</text>
            </view>
          </view>

          <view class="user-actions">
            <button class="btn-sm btn-primary" @click="openEditModal(item)">编辑信息</button>
            <button class="btn-sm btn-role" :class="{ 'btn-remove-admin': item.role === 'admin' }" @click="toggleRole(item)">
              {{ item.role === 'admin' ? '取消管理员' : '设为管理员' }}
            </button>
            <button class="btn-sm" :class="item.is_banned === 1 ? 'btn-success' : 'btn-warning'" @click="toggleBan(item)">
              {{ item.is_banned === 1 ? '解除禁言' : '禁言' }}
            </button>
            <button class="btn-sm" :class="item.status === 0 ? 'btn-success' : 'btn-danger'" @click="toggleStatus(item)">
              {{ item.status === 0 ? '启用账号' : '禁用账号' }}
            </button>
            <button class="btn-sm btn-delete" @click="deleteUser(item)">删除账号</button>
          </view>
        </view>
      </view>

      <view class="pagination" v-if="users.length > 0">
        <button class="btn-sm" :disabled="page === 1" @click="prevPage">上一页</button>
        <text class="page-info">第 {{ page }} / {{ totalPages }} 页</text>
        <button class="btn-sm" :disabled="page >= totalPages" @click="nextPage">下一页</button>
      </view>
    </view>

    <view class="modal-mask" v-if="showEditModal" @click="showEditModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">编辑用户信息</text>
          <text class="modal-close" @click="showEditModal = false">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">昵称</text>
            <input class="form-input" v-model="editForm.nickname" placeholder="请输入昵称" />
          </view>
          <view class="form-item">
            <text class="form-label">学号</text>
            <input class="form-input" v-model="editForm.student_id" placeholder="请输入学号" />
          </view>
          <view class="form-item">
            <text class="form-label">手机号</text>
            <input class="form-input" v-model="editForm.phone" placeholder="请输入手机号" />
          </view>
          <view class="form-item">
            <text class="form-label">学院</text>
            <input class="form-input" v-model="editForm.college" placeholder="请输入学院" />
          </view>
          <view class="form-item">
            <text class="form-label">专业</text>
            <input class="form-input" v-model="editForm.major" placeholder="请输入专业" />
          </view>
          <view class="form-item">
            <text class="form-label">目标院校</text>
            <input class="form-input" v-model="editForm.target_school" placeholder="请输入目标院校" />
          </view>
          <view class="form-item">
            <text class="form-label">目标专业</text>
            <input class="form-input" v-model="editForm.target_major" placeholder="请输入目标专业" />
          </view>
          <view class="form-item">
            <text class="form-label">考研年份</text>
            <input class="form-input" v-model="editForm.exam_year" :placeholder="'如 ' + currentYear" type="number" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="showEditModal = false">取消</button>
          <button class="btn-confirm" @click="saveEdit">保存</button>
        </view>
      </view>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/index'
import { getCurrentYear, formatDate as formatDateUtil } from '@/utils/date'

const currentYear = getCurrentYear()

const users = ref([])
const page = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const totalUsers = ref(0)
const adminCount = ref(0)
const studentCount = ref(0)
const bannedCount = ref(0)
const keyword = ref('')
const roleIndex = ref(0)
const roleOptions = ['全部', '学生', '管理员']
const roleMap = { 0: null, 1: 'student', 2: 'admin' }

const showEditModal = ref(false)
const editForm = ref({})
const editingUserId = ref(null)

const currentUser = ref(null)

const loadCurrentUser = () => {
  const user = uni.getStorageSync('userInfo')
  currentUser.value = user
}

const avatarUrl = (avatar) => {
  if (!avatar) return '/static/logo.png'
  if (avatar.startsWith('http')) return avatar
  return 'http://127.0.0.1:3000' + avatar
}

const loadUsers = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    const role = roleMap[roleIndex.value]
    if (role) params.role = role

    const res = await adminApi.getUsers(params)
    if (res.code === 200) {
      users.value = res.data.list || []
      totalUsers.value = res.data.total || 0
      totalPages.value = res.data.totalPages || Math.ceil(res.data.total / pageSize.value) || 1
    }
  } catch (e) {
    console.error(e)
  }
}

const loadCounts = async () => {
  try {
    const allRes = await adminApi.getUsers({ page: 1, pageSize: 1 })
    if (allRes.code === 200) totalUsers.value = allRes.data.total || 0

    const adminRes = await adminApi.getUsers({ role: 'admin', page: 1, pageSize: 1 })
    if (adminRes.code === 200) adminCount.value = adminRes.data.total || 0

    const studentRes = await adminApi.getUsers({ role: 'student', page: 1, pageSize: 1 })
    if (studentRes.code === 200) studentCount.value = studentRes.data.total || 0

    const bannedRes = await adminApi.getUsers({ page: 1, pageSize: 1 })
    if (bannedRes.code === 200) {
      const bannedListRes = await adminApi.getUsers({ page: 1, pageSize: 1000 })
      if (bannedListRes.code === 200) {
        bannedCount.value = (bannedListRes.data.list || []).filter(u => u.is_banned === 1).length
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const onSearch = () => {
  page.value = 1
  loadUsers()
}

const onRoleChange = (e) => {
  roleIndex.value = e.detail.value
  page.value = 1
  loadUsers()
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadUsers()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadUsers()
  }
}

const openEditModal = (user) => {
  editingUserId.value = user.id
  editForm.value = {
    nickname: user.nickname || '',
    student_id: user.student_id || '',
    phone: user.phone || '',
    college: user.college || '',
    major: user.major || '',
    target_school: user.target_school || '',
    target_major: user.target_major || '',
    exam_year: user.exam_year || ''
  }
  showEditModal.value = true
}

const saveEdit = async () => {
  try {
    const data = {}
    const fields = ['nickname', 'student_id', 'phone', 'college', 'major', 'target_school', 'target_major', 'exam_year']
    for (const key of fields) {
      if (editForm.value[key] !== undefined && editForm.value[key] !== '') {
        data[key] = editForm.value[key]
      } else {
        data[key] = null
      }
    }
    await adminApi.updateUser(editingUserId.value, data)
    uni.showToast({ title: '保存成功', icon: 'success' })
    showEditModal.value = false
    loadUsers()
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

const toggleRole = (user) => {
  if (currentUser.value && user.id === currentUser.value.id) {
    uni.showToast({ title: '不能修改自己的角色', icon: 'none' })
    return
  }
  const newRole = user.role === 'admin' ? 'student' : 'admin'
  const label = newRole === 'admin' ? '设为管理员' : '取消管理员'
  uni.showModal({
    title: '确认操作',
    content: `确定要${label}用户"${user.nickname || user.id}"吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await adminApi.updateUserStatus(user.id, { role: newRole })
        uni.showToast({ title: '操作成功', icon: 'success' })
        loadUsers()
        loadCounts()
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  })
}

const toggleBan = (user) => {
  const newBanned = user.is_banned === 1 ? 0 : 1
  const label = newBanned === 1 ? '禁言' : '解除禁言'
  uni.showModal({
    title: '确认操作',
    content: `确定要${label}用户"${user.nickname || user.id}"吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await adminApi.updateUserStatus(user.id, { is_banned: newBanned })
        uni.showToast({ title: '操作成功', icon: 'success' })
        loadUsers()
        loadCounts()
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  })
}

const toggleStatus = (user) => {
  if (currentUser.value && user.id === currentUser.value.id) {
    uni.showToast({ title: '不能禁用自己的账号', icon: 'none' })
    return
  }
  const newStatus = user.status === 0 ? 1 : 0
  const label = newStatus === 0 ? '禁用' : '启用'
  uni.showModal({
    title: '确认操作',
    content: `确定要${label}用户"${user.nickname || user.id}"的账号吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await adminApi.updateUserStatus(user.id, { status: newStatus })
        uni.showToast({ title: '操作成功', icon: 'success' })
        loadUsers()
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  })
}

const deleteUser = (user) => {
  if (currentUser.value && user.id === currentUser.value.id) {
    uni.showToast({ title: '不能删除自己的账号', icon: 'none' })
    return
  }
  uni.showModal({
    title: '危险操作',
    content: `确定要删除用户"${user.nickname || user.id}"吗？该用户的所有信息（帖子、评论、资料、学习记录等）将被永久删除，此操作不可恢复！`,
    confirmColor: '#f44336',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await adminApi.deleteUser(user.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        loadUsers()
        loadCounts()
      } catch (e) {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}

const formatDate = (dateString) => formatDateUtil(dateString)

onMounted(() => {
  loadCurrentUser()
  loadUsers()
  loadCounts()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: linear-gradient(135deg, #4a90d9, #357abd);
  padding: 80rpx 40rpx 40rpx;
  text-align: center;
}

.admin-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.admin-desc {
  font-size: 26rpx;
  color: rgba(255,255,255,0.85);
}

.content-section {
  margin: -30rpx 24rpx 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.filter-bar {
  margin-bottom: 20rpx;
}

.search-box {
  margin-bottom: 16rpx;
}

.search-input {
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 26rpx;
  background: #f8f8f8;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.filter-item {
  flex: 1;
}

.filter-label {
  font-size: 26rpx;
  color: #666;
  margin-right: 10rpx;
}

.picker {
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 26rpx;
  background: #f8f8f8;
  min-height: 60rpx;
  display: flex;
  align-items: center;
}

.btn-search {
  padding: 16rpx 28rpx;
  font-size: 26rpx;
  border-radius: 8rpx;
  background: #357abd;
  color: #fff;
  border: none;
  white-space: nowrap;
}

.stats-bar {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 8rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
}

.stat-num {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.stat-label {
  font-size: 20rpx;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
}

.user-list {
  gap: 20rpx;
}

.user-item {
  padding: 24rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  background: #fff;
}

.user-top {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.user-basic {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 6rpx;
  flex-wrap: wrap;
}

.user-nickname {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.role-tag {
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
  color: #fff;
}

.role-tag.admin {
  background: #ff9500;
}

.role-tag.student {
  background: #4a90d9;
}

.status-tag {
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
  background: #e8f5e9;
  color: #4CAF50;
}

.status-tag.banned {
  background: #fff3e0;
  color: #ff9500;
}

.status-tag.disabled {
  background: #ffebee;
  color: #f44336;
}

.user-id {
  font-size: 22rpx;
  color: #999;
}

.user-info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx 24rpx;
  margin-bottom: 20rpx;
  padding: 16rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
}

.info-cell {
  min-width: 45%;
  display: flex;
  align-items: center;
  margin-bottom: 4rpx;
}

.cell-label {
  font-size: 24rpx;
  color: #999;
  min-width: 120rpx;
  flex-shrink: 0;
}

.cell-value {
  font-size: 24rpx;
  color: #333;
  flex: 1;
}

.user-actions {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-sm {
  padding: 12rpx 20rpx;
  font-size: 22rpx;
  border-radius: 8rpx;
  border: 2rpx solid #e0e0e0;
  background: #f8f8f8;
}

.btn-primary {
  background: #4a90d9;
  color: #fff;
  border-color: #4a90d9;
}

.btn-role {
  background: #ff9500;
  color: #fff;
  border-color: #ff9500;
}

.btn-remove-admin {
  background: #f5f5f5;
  color: #999;
  border-color: #e0e0e0;
}

.btn-success {
  background: #4CAF50;
  color: #fff;
  border-color: #4CAF50;
}

.btn-warning {
  background: #fff3e0;
  color: #ff9500;
  border-color: #ff9500;
}

.btn-danger {
  background: #ffebee;
  color: #f44336;
  border-color: #f44336;
}

.btn-delete {
  background: #f44336;
  color: #fff;
  border-color: #f44336;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  margin-top: 30rpx;
}

.page-info {
  font-size: 28rpx;
  color: #666;
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
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 85%;
  max-height: 80vh;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 36rpx;
  color: #999;
  padding: 10rpx;
}

.modal-body {
  padding: 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  display: block;
}

.form-input {
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 28rpx;
  background: #f8f8f8;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx 30rpx;
  border-top: 2rpx solid #f0f0f0;
}

.btn-cancel {
  flex: 1;
  padding: 20rpx;
  font-size: 28rpx;
  border-radius: 8rpx;
  border: 2rpx solid #e0e0e0;
  background: #f8f8f8;
  color: #666;
}

.btn-confirm {
  flex: 1;
  padding: 20rpx;
  font-size: 28rpx;
  border-radius: 8rpx;
  border: none;
  background: #357abd;
  color: #fff;
}
</style>

import { get, post, put, del } from './request'

export const userApi = {
  login: (data) => post('/user/login', data),
  getInfo: () => get('/user/info'),
  updateProfile: (data) => put('/user/profile', data),
  getPublicInfo: (id) => get(`/user/public/${id}`)
}

export const homeApi = {
  getTimeline: () => get('/home/timeline'),
  getQuote: () => get('/home/quote'),
  getAds: (position) => get('/home/ads', { position }),
  getScreens: () => get('/home/screens'),
  trackAdClick: (id) => post(`/home/ads/${id}/click`),
  getNotifications: (page, pageSize) => get('/home/notifications', { page, pageSize }),
  getNotificationDetail: (id) => get(`/home/notifications/${id}`),
  markAllRead: () => post('/home/notifications/read-all'),
  subscribeTimeline: (data) => post('/home/timeline/subscribe', data),
  getSubscriptions: () => get('/home/timeline/subscribe')
}

export const studyApi = {
  getPlans: (date) => get('/study/plans', { date }),
  createPlan: (data) => post('/study/plans', data),
  updatePlan: (id, data) => put(`/study/plans/${id}`, data),
  deletePlan: (id) => del(`/study/plans/${id}`),
  checkin: (data) => post('/study/checkin', data),
  deleteCheckin: (date) => del('/study/checkin', { date }),
  updateMood: (data) => put('/study/checkin/mood', data),
  getCheckins: (year, month) => get('/study/checkins', { year, month }),
  getHeatmap: () => get('/study/heatmap'),
  getMoodTrend: () => get('/study/mood-trend'),
  getTemplates: () => get('/study/templates'),
  applyTemplate: (data) => post('/study/apply-template', data)
}

export const materialApi = {
  getCategories: (type) => get('/material/categories', { type }),
  getList: (params) => get('/material/list', params),
  getDetail: (id) => get(`/material/detail/${id}`),
  upload: (formData) => {
    const token = uni.getStorageSync('token')
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: 'http://127.0.0.1:3000/api/material/upload',
        filePath: formData.filePath,
        name: 'file',
        header: { 'Authorization': `Bearer ${token}` },
        formData: formData.data,
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data)
          } else {
            uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
            reject(data)
          }
        },
        fail: (err) => {
          uni.showToast({ title: '上传失败，请检查网络', icon: 'none' })
          reject(err)
        }
      })
    })
  },
  download: (id) => get(`/material/download/${id}`),
  review: (id, data) => post(`/material/${id}/review`, data),
  likeReview: (reviewId) => post(`/material/reviews/${reviewId}/like`),
  reportReview: (reviewId, data) => post(`/material/reviews/${reviewId}/report`, data),
  deleteReview: (reviewId) => del(`/material/reviews/${reviewId}`),
  toggleFavorite: (id) => post(`/material/${id}/favorite`),
  toggleLike: (id) => post(`/material/${id}/like`),
  deleteMaterial: (id) => del(`/material/${id}`),
  getFavorites: (params) => get('/material/favorites', params),
  getFolders: () => get('/material/folders'),
  createFolder: (name) => post('/material/folders', { name }),
  getMyUploads: (params) => get('/material/my-uploads', params),
  getMaterialsForAdmin: (params) => get('/admin/materials/pending', params),
  updateAuditStatus: (id, status) => put(`/admin/materials/${id}/audit`, { audit_status: status })
}

export const forumApi = {
  getPosts: (params) => get('/forum/posts', params),
  getPostDetail: (id) => get(`/forum/posts/${id}`),
  createPost: (data) => post('/forum/posts', data),
  deletePost: (id) => del(`/forum/posts/${id}`),
  getMyPosts: (params) => get('/forum/my-posts', params),
  uploadImage: (filePath) => {
    const token = uni.getStorageSync('token')
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: 'http://127.0.0.1:3000/api/forum/upload-image',
        filePath: filePath,
        name: 'image',
        header: { 'Authorization': `Bearer ${token}` },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data)
          } else {
            uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
            reject(data)
          }
        },
        fail: (err) => {
          uni.showToast({ title: '上传失败，请检查网络', icon: 'none' })
          reject(err)
        }
      })
    })
  },
  toggleLike: (id) => post(`/forum/posts/${id}/like`),
  toggleFavorite: (id) => post(`/forum/posts/${id}/favorite`),
  addComment: (postId, data) => post(`/forum/posts/${postId}/comments`, data),
  likeComment: (id) => post(`/forum/comments/${id}/like`),
  reportComment: (commentId, data) => post(`/forum/comments/${commentId}/report`, data),
  deleteComment: (commentId) => del(`/forum/comments/${commentId}`),
  getFavorites: (params) => get('/forum/favorites', params),
  report: (data) => post('/forum/report', data)
}

export const adminApi = {
  getUsers: (params) => get('/admin/users', params),
  updateUser: (id, data) => put(`/admin/users/${id}`, data),
  deleteUser: (id) => del(`/admin/users/${id}`),
  updateUserStatus: (id, data) => put(`/admin/users/${id}/status`, data),
  getPendingMaterials: (params) => get('/admin/materials/pending', params),
  auditMaterial: (id, data) => put(`/admin/materials/${id}/audit`, data),
  getPendingPosts: (params) => get('/admin/forum/pending', params),
  auditPost: (id, data) => put(`/admin/forum/posts/${id}/audit`, data),
  updatePostTop: (id, data) => put(`/admin/forum/posts/${id}/top`, data),
  getAds: () => get('/admin/ads'),
  createAd: (data) => post('/admin/ads', data),
  updateAd: (id, data) => put(`/admin/ads/${id}`, data),
  updateAdStatus: (id, data) => put(`/admin/ads/${id}/status`, data),
  deleteAd: (id) => del(`/admin/ads/${id}`),
  getScreens: () => get('/admin/screens'),
  createScreen: (data) => post('/admin/screens', data),
  updateScreen: (id, data) => put(`/admin/screens/${id}`, data),
  updateScreenStatus: (id, data) => put(`/admin/screens/${id}/status`, data),
  deleteScreen: (id) => del(`/admin/screens/${id}`),
  getReports: (params) => get('/admin/reports', params),
  handleReport: (id, data) => put(`/admin/reports/${id}/handle`, data),
  getKaoyanData: (params) => get('/admin/kaoyan-data', params),
  getNotifications: (params) => get('/admin/notifications', params),
  createNotification: (data) => post('/admin/notifications', data),
  updateNotification: (id, data) => put(`/admin/notifications/${id}`, data),
  deleteNotification: (id) => del(`/admin/notifications/${id}`),
  getInterviewAuditList: (params) => get('/admin/interview-audit/list', params),
  getInterviewAuditStats: () => get('/admin/interview-audit/stats'),
  auditInterviewItem: (type, id, data) => put(`/admin/interview-audit/${type}/${id}`, data),
  exportKaoyanData: (sortType) => {
    const token = uni.getStorageSync('token')
    const BASE_URL = 'http://127.0.0.1:3000/api'
    return new Promise((resolve, reject) => {
      uni.downloadFile({
        url: `${BASE_URL}/admin/kaoyan-export?sort=${sortType}`,
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res)
          } else {
            uni.showToast({ title: '导出失败', icon: 'none' })
            reject(res)
          }
        },
        fail: (err) => {
          uni.showToast({ title: '网络错误，导出失败', icon: 'none' })
          reject(err)
        }
      })
    })
  }
}

export const recordApi = {
  submit: (data) => post('/record/submit', data),
  getMyRecords: () => get('/record/my'),
  update: (id, data) => put(`/record/update/${id}`, data),
  getList: (params) => get('/record/list', params),
  audit: (id, data) => put(`/record/audit/${id}`, data),
  batchAudit: (data) => post('/record/batch-audit', data),
  getPublicSummary: (params) => get('/record/public/summary', params)
}

export const messageApi = {
  getConversations: () => get('/message/conversations'),
  getHistory: (userId) => get(`/message/history/${userId}`),
  send: (data) => post('/message/send', data),
  getUnreadCount: () => get('/message/unread-count'),
  blockUser: (blocked_user_id) => post('/message/block', { blocked_user_id }),
  unblockUser: (blocked_user_id) => post('/message/unblock', { blocked_user_id }),
  checkBlock: (userId) => get(`/message/check-block/${userId}`)
}

export const nationalLineApi = {
  getList: (params) => get('/national-line/list', params),
  getYears: () => get('/national-line/years'),
  getAdminList: (params) => get('/national-line/admin/list', params),
  add: (data) => post('/national-line/admin/add', data),
  update: (id, data) => put(`/national-line/admin/update/${id}`, data),
  delete: (id) => del(`/national-line/admin/delete/${id}`),
  batchSave: (data) => post('/national-line/admin/batch', data),
  batchDeleteByYear: (year, params) => del(`/national-line/admin/batch-by-year/${year}`, params),
  crawl: (data) => post('/national-line/admin/crawl', data),
  getCrawlUrls: () => get('/national-line/admin/crawl-urls')
}

export const interviewApi = {
  getOralQuestions: () => get('/interview/oral-questions'),
  getMyUploads: () => get('/interview/my-uploads'),
  uploadOralQuestion: (data) => post('/interview/oral-questions', data),
  deleteOralQuestion: (id) => del(`/interview/oral-questions/${id}`),
  getResumeTemplates: () => get('/interview/resume-templates'),
  uploadResumeTemplate: (filePath, formData) => {
    const token = uni.getStorageSync('token')
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: 'http://127.0.0.1:3000/api/interview/resume-templates',
        filePath: filePath,
        name: 'file',
        header: { 'Authorization': `Bearer ${token}` },
        formData: formData || {},
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data)
          } else {
            uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
            reject(data)
          }
        },
        fail: (err) => {
          uni.showToast({ title: '上传失败，请检查网络', icon: 'none' })
          reject(err)
        }
      })
    })
  },
  deleteResumeTemplate: (id) => del(`/interview/resume-templates/${id}`),
  downloadResumeTemplate: (id) => get(`/interview/resume-templates/${id}/download`),
  getEmailTemplates: () => get('/interview/email-templates'),
  uploadEmailTemplate: (filePath, formData) => {
    const token = uni.getStorageSync('token')
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: 'http://127.0.0.1:3000/api/interview/email-templates',
        filePath: filePath,
        name: 'file',
        header: { 'Authorization': `Bearer ${token}` },
        formData: formData || {},
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data)
          } else {
            uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
            reject(data)
          }
        },
        fail: (err) => {
          uni.showToast({ title: '上传失败，请检查网络', icon: 'none' })
          reject(err)
        }
      })
    })
  },
  deleteEmailTemplate: (id) => del(`/interview/email-templates/${id}`),
  downloadEmailTemplate: (id) => get(`/interview/email-templates/${id}/download`)
}

export const feedbackApi = {
  submit: (data) => post('/feedback/submit', data),
  getMyList: (params) => get('/feedback/my', params),
  getList: (params) => get('/feedback/list', params),
  handle: (id, data) => post(`/feedback/${id}/handle`, data),
  getStats: () => get('/feedback/stats'),
  delete: (id) => del(`/feedback/${id}`)
}

export const scoreEstimatorApi = {
  getOptions: () => get('/score-estimator/options'),
  estimate: (data) => post('/score-estimator/estimate', data)
}

export const titleCertApi = {
  apply: (filePath, formData) => {
    const token = uni.getStorageSync('token')
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: 'http://127.0.0.1:3000/api/title-certification/apply',
        filePath: filePath,
        name: 'screenshot',
        header: { 'Authorization': `Bearer ${token}` },
        formData: formData || {},
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data)
          } else {
            uni.showToast({ title: data.msg || '提交失败', icon: 'none' })
            reject(data)
          }
        },
        fail: (err) => {
          uni.showToast({ title: '提交失败，请检查网络', icon: 'none' })
          reject(err)
        }
      })
    })
  },
  getMyRecords: () => get('/title-certification/my'),
  getStatus: () => get('/title-certification/status'),
  getAdminList: (params) => get('/title-certification/list', params),
  getAdminStats: () => get('/title-certification/stats'),
  audit: (id, data) => put(`/title-certification/audit/${id}`, data),
  revoke: (userId) => put(`/title-certification/revoke/${userId}`)
}

export const schoolWebsitesApi = {
  getList: (params) => get('/school-websites', params),
  getRegions: () => get('/school-websites/regions'),
  trackClick: (id) => post(`/school-websites/${id}/click`),
  getAdminList: (params) => get('/school-websites/admin/list', params),
  create: (data) => post('/school-websites/admin/create', data),
  update: (id, data) => put(`/school-websites/admin/${id}`, data),
  delete: (id) => del(`/school-websites/admin/${id}`)
}

export function getCurrentUser() {
  try {
    return JSON.parse(uni.getStorageSync('user') || '{}')
  } catch (e) {
    return {}
  }
}

export function setCurrentUser(user) {
  try {
    uni.setStorageSync('user', user)
  } catch (e) {
    console.error('保存用户信息失败:', e)
  }
}

export function clearCurrentUser() {
  try {
    uni.removeStorageSync('user')
  } catch (e) {
    console.error('清除用户信息失败:', e)
  }
}

export function isLoggedIn() {
  const user = getCurrentUser()
  return !!(user && user.id)
}

export function isAdmin() {
  const user = getCurrentUser()
  return user.role === 'admin' || user.role === 'super_admin'
}

export function getToken() {
  try {
    return uni.getStorageSync('token') || ''
  } catch (e) {
    return ''
  }
}

export function setToken(token) {
  try {
    uni.setStorageSync('token', token)
  } catch (e) {
    console.error('保存token失败:', e)
  }
}

export function clearToken() {
  try {
    uni.removeStorageSync('token')
  } catch (e) {
    console.error('清除token失败:', e)
  }
}

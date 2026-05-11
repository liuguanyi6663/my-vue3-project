export function getCurrentUser() {
  try {
    const user = uni.getStorageSync('user') || uni.getStorageSync('userInfo') || '{}'
    return typeof user === 'string' ? JSON.parse(user || '{}') : user
  } catch (e) {
    return {}
  }
}

export function setCurrentUser(user) {
  try {
    uni.setStorageSync('user', user)
    uni.setStorageSync('userInfo', user)
  } catch (e) {
    console.error('保存用户信息失败:', e)
  }
}

export function clearCurrentUser() {
  try {
    uni.removeStorageSync('user')
    uni.removeStorageSync('userInfo')
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
    return uni.getStorageSync('accessToken') || ''
  } catch (e) {
    return ''
  }
}

export function getRefreshToken() {
  try {
    return uni.getStorageSync('refreshToken') || ''
  } catch (e) {
    return ''
  }
}

export function setTokens(accessToken, refreshToken) {
  try {
    uni.setStorageSync('accessToken', accessToken)
    uni.setStorageSync('refreshToken', refreshToken)
  } catch (e) {
    console.error('保存token失败:', e)
  }
}

export function clearTokens() {
  try {
    uni.removeStorageSync('accessToken')
    uni.removeStorageSync('refreshToken')
  } catch (e) {
    console.error('清除token失败:', e)
  }
}

export function clearAllAuth() {
  clearTokens()
  clearCurrentUser()
}

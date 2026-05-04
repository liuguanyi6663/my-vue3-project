// 全局加载状态管理
let loadingState = {
  visible: false
}

// 监听加载状态变化的回调
let listeners = []

/**
 * 添加加载状态监听
 * @param {Function} callback 回调函数
 */
export function addLoadingListener(callback) {
  listeners.push(callback)
}

/**
 * 移除加载状态监听
 * @param {Function} callback 回调函数
 */
export function removeLoadingListener(callback) {
  const index = listeners.indexOf(callback)
  if (index > -1) {
    listeners.splice(index, 1)
  }
}

/**
 * 显示加载动画
 */
export function showLoading() {
  loadingState.visible = true
  listeners.forEach(callback => callback(true))
}

/**
 * 隐藏加载动画
 */
export function hideLoading() {
  loadingState.visible = false
  listeners.forEach(callback => callback(false))
}

/**
 * 普通页面跳转（不带加载动画）
 * @param {Object} options uni.navigateTo选项
 */
export function navigateTo(options) {
  uni.navigateTo(options)
}

/**
 * 普通tab切换（不带加载动画）
 * @param {Object} options uni.switchTab选项
 */
export function switchTab(options) {
  uni.switchTab(options)
}

/**
 * 普通重定向（不带加载动画）
 * @param {Object} options uni.redirectTo选项
 */
export function redirectTo(options) {
  uni.redirectTo(options)
}

/**
 * 检测网络状态
 * @returns {Promise<boolean>} 是否为弱网
 */
export function checkNetworkStatus() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        const networkType = res.networkType
        // 2G、3G、unknown视为弱网
        const isWeakNetwork = ['2g', '3g', 'unknown'].includes(networkType.toLowerCase())
        resolve(isWeakNetwork)
      },
      fail: () => {
        resolve(true) // 获取失败时默认视为弱网
      }
    })
  })
}

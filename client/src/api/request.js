const BASE_URL = 'http://127.0.0.1:3000/api'

// 全局加载状态
let loadingListeners = []

// 触发加载状态变化
function triggerLoadingChange(visible) {
  loadingListeners.forEach(callback => callback(visible))
}

// 添加监听器
export function addRequestLoadingListener(callback) {
  loadingListeners.push(callback)
}

// 移除监听器
export function removeRequestLoadingListener(callback) {
  const index = loadingListeners.indexOf(callback)
  if (index > -1) {
    loadingListeners.splice(index, 1)
  }
}

// 检测网络状态
function checkNetworkStatus() {
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

const request = async (options) => {
  let showLoadingFlag = false
  let loadingTimeout = null
  
  try {
    // 检测网络状态
    const isWeakNetwork = await checkNetworkStatus()
    
    // 如果是弱网，显示加载动画
    if (isWeakNetwork) {
      showLoadingFlag = true
      triggerLoadingChange(true)
    } else {
      // 即使网络好，也设置一个超时时间，超过500ms自动显示加载
      loadingTimeout = setTimeout(() => {
        showLoadingFlag = true
        triggerLoadingChange(true)
      }, 500)
    }
    
    return new Promise((resolve, reject) => {
      const token = uni.getStorageSync('token')
      
      let fullUrl = BASE_URL + options.url
      let requestData = options.data
      
      // 处理 GET 请求的参数，拼接到 URL 上
      if ((options.method === 'GET' || options.method === 'DELETE') && requestData && Object.keys(requestData).length > 0) {
        const queryString = Object.keys(requestData)
          .filter(key => requestData[key] !== undefined && requestData[key] !== null && requestData[key] !== '')
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(requestData[key])}`)
          .join('&')
        if (queryString) {
          fullUrl = `${fullUrl}?${queryString}`
        }
        requestData = {}
      }
      
      console.log('发送请求:', {
        url: fullUrl,
        method: options.method || 'GET',
        data: requestData
      })
      
      uni.request({
        url: fullUrl,
        method: options.method || 'GET',
        data: requestData,
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          console.log('收到响应:', res)
          if (res.statusCode === 200) {
            if (res.data.code === 200) {
              resolve(res.data)
            } else if (res.data.code === 401) {
              uni.removeStorageSync('token')
              uni.removeStorageSync('userInfo')
              uni.navigateTo({ url: '/pages/login/login' })
              reject(res.data)
            } else {
              // 不自动显示Toast，让调用方处理
              reject(res.data)
            }
          } else {
            uni.showToast({ title: '网络错误', icon: 'none' })
            reject(res)
          }
        },
        fail: (err) => {
          console.error('请求失败:', err)
          uni.showToast({ title: '网络连接失败', icon: 'none' })
          reject(err)
        },
        complete: () => {
          // 清除超时定时器
          if (loadingTimeout) {
            clearTimeout(loadingTimeout)
          }
          // 隐藏加载动画
          if (showLoadingFlag) {
            triggerLoadingChange(false)
          }
        }
      })
    })
  } catch (error) {
    // 清除超时定时器
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
    }
    // 隐藏加载动画
    if (showLoadingFlag) {
      triggerLoadingChange(false)
    }
    throw error
  }
}

export const get = (url, data = {}) => request({ url, method: 'GET', data })
export const post = (url, data = {}) => request({ url, method: 'POST', data })
export const put = (url, data = {}) => request({ url, method: 'PUT', data })
export const del = (url, data = {}) => request({ url, method: 'DELETE', data })

export default { get, post, put, del }

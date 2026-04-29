const BASE_URL = 'http://127.0.0.1:3000/api'

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    
    let fullUrl = BASE_URL + options.url
    let requestData = options.data
    
    // 处理 GET 请求的参数，拼接到 URL 上
    if (options.method === 'GET' && requestData && Object.keys(requestData).length > 0) {
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
            uni.showToast({ title: res.data.msg || '请求失败', icon: 'none' })
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
      }
    })
  })
}

export const get = (url, data = {}) => request({ url, method: 'GET', data })
export const post = (url, data = {}) => request({ url, method: 'POST', data })
export const put = (url, data = {}) => request({ url, method: 'PUT', data })
export const del = (url, data = {}) => request({ url, method: 'DELETE', data })

export default { get, post, put, del }

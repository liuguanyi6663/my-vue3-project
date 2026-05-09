export const BASE_URL = 'http://127.0.0.1:3000/api'

let loadingListeners = []

function triggerLoadingChange(visible) {
  loadingListeners.forEach(callback => callback(visible))
}

export function addRequestLoadingListener(callback) {
  loadingListeners.push(callback)
}

export function removeRequestLoadingListener(callback) {
  const index = loadingListeners.indexOf(callback)
  if (index > -1) {
    loadingListeners.splice(index, 1)
  }
}

function checkNetworkStatus() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        const networkType = res.networkType
        const isWeakNetwork = ['2g', '3g', 'unknown'].includes(networkType.toLowerCase())
        resolve(isWeakNetwork)
      },
      fail: () => {
        resolve(true)
      }
    })
  })
}

let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback)
}

function getAccessToken() {
  return uni.getStorageSync('accessToken')
}

function getRefreshToken() {
  return uni.getStorageSync('refreshToken')
}

function setTokens(data) {
  uni.setStorageSync('accessToken', data.accessToken)
  uni.setStorageSync('refreshToken', data.refreshToken)
}

function clearTokens() {
  uni.removeStorageSync('accessToken')
  uni.removeStorageSync('refreshToken')
}

async function tryRefreshToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearTokens()
    uni.removeStorageSync('userInfo')
    return null
  }

  try {
    const res = await new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + '/user/refresh',
        method: 'POST',
        data: { refreshToken },
        header: { 'Content-Type': 'application/json' },
        success: (r) => {
          if (r.statusCode === 200 && r.data.code === 200) {
            resolve(r.data)
          } else {
            reject(r.data)
          }
        },
        fail: (err) => reject(err)
      })
    })
    setTokens(res.data)
    return res.data.accessToken
  } catch (err) {
    clearTokens()
    uni.removeStorageSync('userInfo')
    return null
  }
}

const request = async (options) => {
  let showLoadingFlag = false
  let loadingTimeout = null

  try {
    const isWeakNetwork = await checkNetworkStatus()

    if (isWeakNetwork) {
      showLoadingFlag = true
      triggerLoadingChange(true)
    } else {
      loadingTimeout = setTimeout(() => {
        showLoadingFlag = true
        triggerLoadingChange(true)
      }, 500)
    }

    const executeRequest = (token) => {
      return new Promise((resolve, reject) => {
        let fullUrl = BASE_URL + options.url
        let requestData = options.data

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

        uni.request({
          url: fullUrl,
          method: options.method || 'GET',
          data: requestData,
          header: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          success: (res) => {
            if (res.statusCode === 200) {
              if (res.data.code === 200) {
                resolve(res.data)
              } else if (res.data.code === 401) {
                reject({ ...res.data, _needRefresh: res.data.subCode === 'TOKEN_EXPIRED' })
              } else if (res.data.code === 403) {
                reject(res.data)
              } else {
                reject(res.data)
              }
            } else {
              uni.showToast({ title: '网络错误', icon: 'none' })
              reject(res)
            }
          },
          fail: (err) => {
            uni.showToast({ title: '网络连接失败', icon: 'none' })
            reject(err)
          },
          complete: () => {
            if (loadingTimeout) {
              clearTimeout(loadingTimeout)
            }
            if (showLoadingFlag) {
              triggerLoadingChange(false)
            }
          }
        })
      })
    }

    const token = getAccessToken()
    const result = await executeRequest(token)
    return result
  } catch (error) {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
    }
    if (showLoadingFlag) {
      triggerLoadingChange(false)
    }

    if (error && error._needRefresh) {
      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await tryRefreshToken()
        isRefreshing = false

        if (newToken) {
          onRefreshed(newToken)
          return request(options)
        } else {
          uni.navigateTo({ url: '/pages/login/login' })
          throw { code: 401, msg: '请重新登录' }
        }
      } else {
        return new Promise((resolve) => {
          addRefreshSubscriber(async (newToken) => {
            resolve(request(options))
          })
        })
      }
    }

    throw error
  }
}

export const get = (url, data = {}) => request({ url, method: 'GET', data })
export const post = (url, data = {}) => request({ url, method: 'POST', data })
export const put = (url, data = {}) => request({ url, method: 'PUT', data })
export const del = (url, data = {}) => request({ url, method: 'DELETE', data })

export default { get, post, put, del }

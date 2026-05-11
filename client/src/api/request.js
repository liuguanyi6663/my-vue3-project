import { getToken, getRefreshToken, setTokens as authSetTokens, clearTokens, clearAllAuth } from '@/utils/auth'

export const BASE_URL = 'http://127.0.0.1:3000/api'

let loadingListeners = []
let requestCount = 0

function showLoading() {
  requestCount++
  if (requestCount === 1) {
    loadingListeners.forEach(cb => cb(true))
  }
}

function hideLoading() {
  if (requestCount > 0) {
    requestCount--
  }
  if (requestCount === 0) {
    loadingListeners.forEach(cb => cb(false))
  }
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
        const isWeakNetwork = ['2g', '3g', 'unknown'].includes(res.networkType.toLowerCase())
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

async function tryRefreshToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearAllAuth()
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
    authSetTokens(res.data.accessToken, res.data.refreshToken)
    return res.data.accessToken
  } catch (err) {
    clearAllAuth()
    return null
  }
}

const request = async (options) => {
  let loadingTimer = null

  try {
    const isWeakNetwork = await checkNetworkStatus()

    if (isWeakNetwork) {
      showLoading()
    } else {
      loadingTimer = setTimeout(() => showLoading(), 500)
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
            if (loadingTimer) {
              clearTimeout(loadingTimer)
            }
            hideLoading()
          }
        })
      })
    }

    const token = getToken()
    const result = await executeRequest(token)
    return result
  } catch (error) {
    if (loadingTimer) {
      clearTimeout(loadingTimer)
    }
    hideLoading()

    if (error && error._needRefresh) {
      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await tryRefreshToken()
        isRefreshing = false

        if (newToken) {
          onRefreshed(newToken)
          return request(options)
        } else {
          uni.showToast({ title: '登录已过期，请重新登录', icon: 'none', duration: 2000 })
          setTimeout(() => {
            uni.navigateTo({ url: '/pages/login/login' })
          }, 2000)
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
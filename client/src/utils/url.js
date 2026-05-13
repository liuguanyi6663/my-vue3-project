import API_BASE_URL from '@/config'

const BASE_URL = API_BASE_URL

export const getAvatarUrl = (url) => {
  if (!url) return '/static/default-avatar.png'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return BASE_URL + (url.startsWith('/') ? url : '/' + url)
}

export const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return BASE_URL + (url.startsWith('/') ? url : '/' + url)
}

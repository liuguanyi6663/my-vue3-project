const getTimeSeed = () => new Date()

const getCurrentYear = () => getTimeSeed().getFullYear()

const getRecentYears = (n = 4) => {
  const current = getCurrentYear()
  const years = []
  for (let i = 1; i >= -(n - 2); i--) {
    years.push(current + i)
  }
  return years
}

const getKaoyanYear = () => {
  const now = getTimeSeed()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()
  if (month === 11 && day > 26) {
    return year + 2
  }
  return year + 1
}

const getKaoyanTargetDate = () => {
  const kaoyanYear = getKaoyanYear()
  return new Date(`${kaoyanYear - 1}-12-26T08:30:00`)
}

const formatDate = (input) => {
  if (!input) return ''
  const date = input instanceof Date ? input : new Date(input)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatRelativeTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = getTimeSeed()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatShortDate = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}-${date.getDate()}`
}

const formatChatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = getTimeSeed()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  if (isToday) return time
  if (isYesterday) return `昨天 ${time}`
  return `${date.getMonth() + 1}月${date.getDate()}日 ${time}`
}

const formatMessageTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = getTimeSeed()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${date.getMonth() + 1}-${date.getDate()}`
}

export {
  getTimeSeed,
  getCurrentYear,
  getRecentYears,
  getKaoyanYear,
  getKaoyanTargetDate,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatShortDate,
  formatChatTime,
  formatMessageTime
}

const getTimeSeed = () => new Date()

const formatLocalDate = (date = getTimeSeed()) => {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

const getTodayStr = () => formatLocalDate()

module.exports = {
  getTimeSeed,
  formatLocalDate,
  getCurrentYear,
  getRecentYears,
  getKaoyanYear,
  getKaoyanTargetDate,
  getTodayStr
}

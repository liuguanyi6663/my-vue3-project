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

const getTodayStr = () => getTimeSeed().toISOString().split('T')[0]

module.exports = {
  getTimeSeed,
  getCurrentYear,
  getRecentYears,
  getKaoyanYear,
  getKaoyanTargetDate,
  getTodayStr
}

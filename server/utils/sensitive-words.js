const db = require('./db')

const defaultSensitiveWords = [
  // 广告相关
  '广告', 'qq', 'QQ', '微信', '加群', '代写', '代考', '作弊',
  '刷单', '兼职', '赚钱', '赚钱', '兼职', '日赚',
  // 敏感政治相关
  '政治敏感', '反动', '颠覆',
  // 色情相关
  '色情', '黄色', '淫秽', '裸聊',
  // 赌博相关
  '赌博', '博彩', '彩票', '六合彩',
  // 暴力相关
  '暴力', '凶杀', '杀人',
  // 诈骗相关
  '诈骗', '骗子', '欺诈',
  // 其他违禁词
  '法轮功', '邪教', '毒品', '海洛因',
  // 联系方式
  '加我', '联系我', '微信号', '手机号', '电话',
  // 营销相关
  '免费', '限时', '秒杀', '优惠', '抢购',
  // 其他
  '傻逼', '妈的', '操你', '艹', '他妈', 'fuck', 'shit'
]

let sensitiveWordCache = null
let lastUpdateTime = 0
const CACHE_TTL = 30 * 60 * 1000 // 30分钟

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const loadSensitiveWords = async () => {
  const now = Date.now()
  if (sensitiveWordCache && (now - lastUpdateTime) < CACHE_TTL) {
    return sensitiveWordCache
  }

  try {
    const result = await db.query('SELECT word FROM sensitive_words WHERE status = 1')
    sensitiveWordCache = result.map(row => row.word)
    lastUpdateTime = now
    console.log('✅ 敏感词库已加载，共', sensitiveWordCache.length, '个词')
    return sensitiveWordCache
  } catch (err) {
    console.error('❌ 加载敏感词库失败:', err.message)
    return defaultSensitiveWords
  }
}

const filterSensitiveWords = async (text) => {
  if (!text) return { filtered: text, hasSensitive: false }

  const words = await loadSensitiveWords()
  let filtered = text
  let hasSensitive = false

  for (const word of words) {
    if (filtered.toLowerCase().includes(word.toLowerCase())) {
      hasSensitive = true
      const escapedWord = escapeRegExp(word)
      const regex = new RegExp(escapedWord, 'gi')
      filtered = filtered.replace(regex, '*'.repeat(word.length))
    }
  }

  return { filtered, hasSensitive }
}

const containsSensitiveWords = async (text) => {
  if (!text) return false

  const words = await loadSensitiveWords()
  const lowerText = text.toLowerCase()

  for (const word of words) {
    if (lowerText.includes(word.toLowerCase())) {
      return true
    }
  }
  return false
}

const initSensitiveWords = async () => {
  try {
    const countResult = await db.query('SELECT COUNT(*) as cnt FROM sensitive_words')
    if (countResult[0].cnt < 20) {
      const placeholders = defaultSensitiveWords.map(() => '(?)').join(',')
      await db.query(
        'INSERT IGNORE INTO sensitive_words (word) VALUES ' + placeholders,
        defaultSensitiveWords
      )
      console.log('✅ 敏感词库已初始化')
    }
    await loadSensitiveWords()
  } catch (err) {
    console.error('❌ 初始化敏感词库失败:', err.message)
  }
}

const addSensitiveWord = async (word) => {
  try {
    await db.query('INSERT IGNORE INTO sensitive_words (word) VALUES (?)', [word])
    sensitiveWordCache = null
    lastUpdateTime = 0
    return true
  } catch (err) {
    console.error('❌ 添加敏感词失败:', err.message)
    return false
  }
}

const removeSensitiveWord = async (word) => {
  try {
    await db.query('DELETE FROM sensitive_words WHERE word = ?', [word])
    sensitiveWordCache = null
    lastUpdateTime = 0
    return true
  } catch (err) {
    console.error('❌ 删除敏感词失败:', err.message)
    return false
  }
}

module.exports = {
  filterSensitiveWords,
  containsSensitiveWords,
  initSensitiveWords,
  addSensitiveWord,
  removeSensitiveWord,
  loadSensitiveWords
}
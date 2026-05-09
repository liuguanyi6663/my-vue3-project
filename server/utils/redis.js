const Redis = require('ioredis')
const config = require('../config/index')

let redis = null
let redisAvailable = false

function createClient() {
  try {
    const client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db || 0,
      keyPrefix: config.redis.keyPrefix || 'kaoyan:',
      retryStrategy: (times) => {
        if (times > 3) {
          return null
        }
        return Math.min(times * 200, 2000)
      },
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableReadyCheck: true
    })

    client.on('error', (err) => {
      if (redisAvailable) {
        console.warn('[Redis] 连接错误，降级为内存缓存:', err.message)
        redisAvailable = false
      }
    })

    client.on('ready', () => {
      console.log('[Redis] 连接成功')
      redisAvailable = true
    })

    client.on('close', () => {
      redisAvailable = false
    })

    return client
  } catch (err) {
    console.warn('[Redis] 初始化失败，将使用内存缓存:', err.message)
    return null
  }
}

async function initRedis() {
  try {
    if (!config.redis.enabled) {
      console.log('[Redis] 未启用，使用内存缓存')
      return
    }

    redis = createClient()
    if (redis) {
      await redis.connect()
    }
  } catch (err) {
    console.warn('[Redis] 连接失败，降级为内存缓存:', err.message)
    redisAvailable = false
  }
}

function getRedis() {
  return redis
}

function isRedisAvailable() {
  return redisAvailable && redis !== null
}

async function redisGet(key) {
  if (!isRedisAvailable()) return null
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (err) {
    console.warn('[Redis] GET 失败:', err.message)
    return null
  }
}

async function redisSet(key, data, ttl = 1800) {
  if (!isRedisAvailable()) return false
  try {
    const value = JSON.stringify(data)
    if (ttl > 0) {
      await redis.set(key, value, 'EX', ttl)
    } else {
      await redis.set(key, value)
    }
    return true
  } catch (err) {
    console.warn('[Redis] SET 失败:', err.message)
    return false
  }
}

async function redisDelete(key) {
  if (!isRedisAvailable()) return false
  try {
    await redis.del(key)
    return true
  } catch (err) {
    console.warn('[Redis] DEL 失败:', err.message)
    return false
  }
}

async function redisDeletePattern(pattern) {
  if (!isRedisAvailable()) return []
  try {
    const fullPattern = config.redis.keyPrefix + pattern
    const keys = []
    let cursor = '0'
    do {
      const result = await redis.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100)
      cursor = result[0]
      keys.push(...result[1])
    } while (cursor !== '0')

    if (keys.length > 0) {
      await redis.del(...keys)
    }
    return keys
  } catch (err) {
    console.warn('[Redis] DEL PATTERN 失败:', err.message)
    return []
  }
}

async function redisFlush() {
  if (!isRedisAvailable()) return false
  try {
    const fullPattern = config.redis.keyPrefix + '*'
    const keys = []
    let cursor = '0'
    do {
      const result = await redis.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100)
      cursor = result[0]
      keys.push(...result[1])
    } while (cursor !== '0')

    if (keys.length > 0) {
      await redis.del(...keys)
    }
    return true
  } catch (err) {
    return false
  }
}

module.exports = {
  initRedis,
  getRedis,
  isRedisAvailable,
  redisGet,
  redisSet,
  redisDelete,
  redisDeletePattern,
  redisFlush
}

const { isRedisAvailable, redisGet, redisSet, redisDelete, redisDeletePattern } = require('../utils/redis')

const cacheStore = new Map()

const CACHE_TTL = {
  SHORT: 5 * 60,          // 5分钟 (秒)
  MEDIUM: 30 * 60,        // 30分钟
  LONG: 2 * 60 * 60       // 2小时
}

const memoryCache = {
  get: (key) => {
    const entry = cacheStore.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) {
      cacheStore.delete(key)
      return null
    }
    return entry.data
  },

  set: (key, data, ttlSec = CACHE_TTL.MEDIUM) => {
    cacheStore.set(key, {
      data,
      expires: Date.now() + ttlSec * 1000
    })
  },

  delete: (key) => {
    cacheStore.delete(key)
  },

  deletePattern: (pattern) => {
    const regex = new RegExp(pattern)
    for (const key of cacheStore.keys()) {
      if (regex.test(key)) {
        cacheStore.delete(key)
      }
    }
  },

  clear: () => {
    cacheStore.clear()
  },

  stats: () => ({
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys()),
    type: 'memory'
  })
}

const cache = {
  get: async (key) => {
    if (isRedisAvailable()) {
      const data = await redisGet(key)
      if (data !== null) return data
    }
    return memoryCache.get(key)
  },

  set: async (key, data, ttl = CACHE_TTL.MEDIUM) => {
    if (isRedisAvailable()) {
      await redisSet(key, data, ttl)
    }
    memoryCache.set(key, data, ttl)
  },

  delete: async (key) => {
    if (isRedisAvailable()) {
      await redisDelete(key)
    }
    memoryCache.delete(key)
  },

  deletePattern: async (pattern) => {
    if (isRedisAvailable()) {
      await redisDeletePattern(pattern)
    }
    memoryCache.deletePattern(pattern)
  },

  clear: async () => {
    if (isRedisAvailable()) {
      const { redisFlush } = require('../utils/redis')
      await redisFlush()
    }
    memoryCache.clear()
  },

  stats: () => {
    if (isRedisAvailable()) {
      return { type: 'redis', memoryFallback: memoryCache.stats() }
    }
    return memoryCache.stats()
  }
}

const cacheMiddleware = (options = {}) => {
  const {
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    ttl = CACHE_TTL.MEDIUM,
    skipCache = () => false
  } = options

  return async (req, res, next) => {
    if (skipCache(req)) {
      return next()
    }

    if (req.method !== 'GET') {
      return next()
    }

    const key = keyGenerator(req)
    const cached = await cache.get(key)

    if (cached) {
      return res.json(cached)
    }

    const originalJson = res.json
    res.json = function (data) {
      if (res.statusCode === 200 && data && data.code === 200) {
        cache.set(key, data, ttl)
      }
      return originalJson.call(this, data)
    }

    next()
  }
}

const invalidateCache = async (patterns) => {
  if (Array.isArray(patterns)) {
    for (const p of patterns) {
      await cache.deletePattern(p)
    }
  } else {
    await cache.deletePattern(patterns)
  }
}

const clearCache = async () => {
  await cache.clear()
}

module.exports = {
  cache,
  cacheMiddleware,
  invalidateCache,
  clearCache,
  CACHE_TTL
}

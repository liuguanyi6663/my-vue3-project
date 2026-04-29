const cacheStore = new Map()
const CACHE_TTL = {
  SHORT: 5 * 60 * 1000, // 5分钟
  MEDIUM: 30 * 60 * 1000, // 30分钟
  LONG: 2 * 60 * 60 * 1000 // 2小时
}

const cache = {
  get: (key) => {
    const entry = cacheStore.get(key)
    if (!entry) return null

    if (Date.now() > entry.expires) {
      cacheStore.delete(key)
      return null
    }

    return entry.data
  },

  set: (key, data, ttl = CACHE_TTL.MEDIUM) => {
    cacheStore.set(key, {
      data,
      expires: Date.now() + ttl
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

  stats: () => {
    return {
      size: cacheStore.size,
      keys: Array.from(cacheStore.keys())
    }
  }
}

const cacheMiddleware = (options = {}) => {
  const {
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    ttl = CACHE_TTL.MEDIUM,
    skipCache = () => false
  } = options

  return (req, res, next) => {
    if (skipCache(req)) {
      return next()
    }

    if (req.method !== 'GET') {
      return next()
    }

    const key = keyGenerator(req)
    const cached = cache.get(key)

    if (cached) {
      console.log(`✅ 缓存命中: ${key}`)
      return res.json(cached)
    }

    const originalJson = res.json
    res.json = function (data) {
      if (res.statusCode === 200 && data.code === 200) {
        cache.set(key, data, ttl)
        console.log(`💾 已缓存: ${key}`)
      }
      return originalJson.call(this, data)
    }

    next()
  }
}

const invalidateCache = (patterns) => {
  if (Array.isArray(patterns)) {
    patterns.forEach(p => cache.deletePattern(p))
  } else {
    cache.deletePattern(patterns)
  }
}

module.exports = {
  cache,
  cacheMiddleware,
  invalidateCache,
  CACHE_TTL
}

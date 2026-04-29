class LazyLoad {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      placeholder: null,
      errorPlaceholder: null,
      ...options
    }
    this.images = new Map()
    this.observer = null
    this.init()
  }

  init() {
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersect(entries),
        {
          rootMargin: this.options.rootMargin,
          threshold: this.options.threshold
        }
      )
    }
  }

  handleIntersect(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target
        this.loadImage(img)
      }
    })
  }

  loadImage(img) {
    const src = img.dataset.src
    if (!src) return

    const imageInfo = this.images.get(img)
    if (!imageInfo) return

    const tempImg = new Image()
    
    tempImg.onload = () => {
      img.src = src
      img.classList.add('loaded')
      img.classList.remove('loading', 'error')
      if (imageInfo.onLoad) {
        imageInfo.onLoad()
      }
      this.unobserve(img)
    }

    tempImg.onerror = () => {
      img.classList.add('error')
      img.classList.remove('loading')
      if (this.options.errorPlaceholder) {
        img.src = this.options.errorPlaceholder
      }
      if (imageInfo.onError) {
        imageInfo.onError()
      }
      this.unobserve(img)
    }

    tempImg.src = src
  }

  observe(img, callbacks = {}) {
    if (!img) return

    img.classList.add('lazy-image', 'loading')
    if (this.options.placeholder && !img.src) {
      img.src = this.options.placeholder
    }

    this.images.set(img, callbacks)

    if (this.observer) {
      this.observer.observe(img)
    } else {
      this.loadImage(img)
    }
  }

  unobserve(img) {
    if (this.observer && img) {
      this.observer.unobserve(img)
    }
    this.images.delete(img)
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
    this.images.clear()
  }
}

const imageCache = new Map()
const MAX_CACHE_SIZE = 50

const imageUtils = {
  preload: (src) => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(src)) {
        resolve(imageCache.get(src))
        return
      }
      const img = new Image()
      img.onload = () => {
        imageCache.set(src, true)
        if (imageCache.size > MAX_CACHE_SIZE) {
          const firstKey = imageCache.keys().next().value
          imageCache.delete(firstKey)
        }
        resolve(true)
      }
      img.onerror = () => reject(false)
      img.src = src
    })
  },

  preloadImages: (sources) => {
    return Promise.allSettled(sources.map(src => imageUtils.preload(src)))
  }
}

const debounce = (fn, delay) => {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

const throttle = (fn, delay) => {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= delay) {
      fn.apply(this, args)
      last = now
    }
  }
}

export {
  LazyLoad,
  imageUtils,
  debounce,
  throttle
}

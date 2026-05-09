const SCOPE_MAP = {
  camera: 'scope.camera',
  writePhotosAlbum: 'scope.writePhotosAlbum',
  record: 'scope.record',
  userLocation: 'scope.userLocation',
  userFuzzyLocation: 'scope.userFuzzyLocation',
  chooseImage: null,
  chooseMessageFile: null
}

const SCOPE_TIPS = {
  'scope.camera': '需要使用您的摄像头进行拍照',
  'scope.writePhotosAlbum': '需要保存图片到您的相册',
  'scope.record': '需要使用录音功能',
  'scope.userLocation': '需要获取您的位置信息',
  'scope.userFuzzyLocation': '需要获取您的模糊位置信息'
}

function getScopeKey(scope) {
  if (SCOPE_MAP.hasOwnProperty(scope)) {
    return SCOPE_MAP[scope]
  }
  return scope
}

function getScopeTip(scope) {
  return SCOPE_TIPS[scope] || '需要获取相关权限'
}

export function checkAuthorize(scope) {
  const scopeKey = getScopeKey(scope)

  if (scopeKey === null) {
    return Promise.resolve({ authorized: true, denied: false, noScope: true })
  }

  return new Promise((resolve) => {
    uni.getSetting({
      success: (res) => {
        const auth = res.authSetting[scopeKey]
        if (auth === true) {
          resolve({ authorized: true, denied: false })
        } else if (auth === false) {
          resolve({ authorized: false, denied: true })
        } else {
          resolve({ authorized: false, denied: false })
        }
      },
      fail: (err) => {
        console.warn('getSetting fail:', err)
        resolve({ authorized: false, denied: false, error: err })
      }
    })
  })
}

export function requestAuthorize(scope) {
  const scopeKey = getScopeKey(scope)

  if (scopeKey === null) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    uni.authorize({
      scope: scopeKey,
      success: () => resolve(true),
      fail: (err) => {
        console.warn('authorize fail:', err)
        resolve(false)
      }
    })
  })
}

export function openAuthorizeSetting() {
  return new Promise((resolve) => {
    uni.openSetting({
      success: (res) => resolve(res.authSetting)
    })
  })
}

export async function ensureAuthorize(scope) {
  const scopeKey = getScopeKey(scope)

  if (scopeKey === null) {
    return true
  }

  const { authorized, denied } = await checkAuthorize(scope)

  if (authorized) {
    return true
  }

  if (!denied) {
    const granted = await requestAuthorize(scope)
    if (granted) return true
  }

  const tip = getScopeTip(scopeKey)
  const res = await new Promise((resolve) => {
    uni.showModal({
      title: '权限申请',
      content: `${tip}，请前往设置开启权限`,
      confirmText: '去设置',
      cancelText: '取消',
      success: (modalRes) => resolve(modalRes.confirm)
    })
  })

  if (res) {
    const authSetting = await openAuthorizeSetting()
    return !!authSetting[scopeKey]
  }

  return false
}

export function showAuthTip(scope) {
  const scopeKey = getScopeKey(scope)
  const tip = getScopeTip(scopeKey)
  uni.showToast({ title: `未授权：${tip}`, icon: 'none' })
}
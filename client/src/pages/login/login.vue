<template>
  <view class="login-page">
    <view class="login-header">
      <view class="logo-area">
        <text class="logo-text">📚</text>
        <text class="app-name">校内考研助手</text>
        <text class="app-desc">助力考研，一研为定</text>
      </view>
    </view>

    <view class="login-form card">
      <view class="form-item">
        <text class="form-label">手机号</text>
        <input 
          class="form-input" 
          v-model="phone" 
          type="number"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </view>

      <button 
        class="btn-primary login-btn" 
        :disabled="!isPhoneValid || loading"
        @click="handleLogin"
      >
        {{ loading ? '登录中...' : '手机号登录' }}
      </button>

      <view class="divider">
        <view class="line"></view>
        <text class="divider-text">或</text>
        <view class="line"></view>
      </view>

      <!-- #ifdef MP-WEIXIN -->
      <button 
        open-type="getPhoneNumber"
        class="phone-btn"
        @getphonenumber="handleGetPhoneNumber"
      >
        <text class="phone-icon">📱</text>
        获取手机号快速登录
      </button>

      <view class="divider">
        <view class="line"></view>
        <text class="divider-text">或</text>
        <view class="line"></view>
      </view>
      <!-- #endif -->

      <button 
        class="wechat-btn"
        @click="handleWechatLogin"
      >
        <text class="wechat-icon">💬</text>
        微信一键登录
      </button>

      <view class="agreement">
        <checkbox :checked="agreed" @click="agreed = !agreed" color="#007AFF" style="transform: scale(0.8);" />
        <text class="agree-text">我已阅读并同意</text>
        <text class="agree-link" @click="showAgreement('privacy')">《隐私政策》</text>
        <text class="agree-text">和</text>
        <text class="agree-link" @click="showAgreement('user')">《用户协议》</text>
      </view>
    </view>


  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { userApi } from '@/api/index'

const phone = ref('')
const loading = ref(false)
const agreed = ref(true)

const isPhoneValid = computed(() => {
  return /^1[3-9]\d{9}$/.test(phone.value)
})

const handleLogin = async () => {
  if (!agreed.value) {
    return uni.showToast({ title: '请先同意用户协议', icon: 'none' })
  }
  
  if (!isPhoneValid.value) {
    return uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
  }
  
  loading.value = true
  
  try {
    const res = await userApi.login({ phone: phone.value })
    
    uni.setStorageSync('token', res.data.token)
    uni.setStorageSync('userInfo', res.data.userInfo)
    
    uni.showToast({ title: '登录成功', icon: 'success' })
    
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.switchTab({ url: '/pages/index/index' })
      }
    }, 1500)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleGetPhoneNumber = async (e) => {
  if (!agreed.value) {
    return uni.showToast({ title: '请先同意用户协议', icon: 'none' })
  }
  
  // #ifdef MP-WEIXIN
  if (e.detail.errMsg === 'getPhoneNumber:ok' && e.detail.code) {
    try {
      uni.showLoading({ title: '登录中...' })
      
      // 先用微信登录获取 code
      const loginRes = await new Promise((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: reject
        })
      })
      
      // 获取用户昵称和头像
      let userInfoData = {}
      
      try {
        const profileRes = await new Promise((resolve, reject) => {
          uni.getUserProfile({
            desc: '用于完善用户资料',
            success: resolve,
            fail: (err) => {
              console.log('获取用户信息失败:', err)
              resolve(null)
            }
          })
        })
        
        if (profileRes && profileRes.userInfo) {
          userInfoData = {
            nickname: profileRes.userInfo.nickName,
            avatar: profileRes.userInfo.avatarUrl
          }
        }
      } catch (e) {
        console.log('跳过获取用户信息:', e)
      }
      
      // 发送到后端，后端用手机号加密数据去获取真实手机号
      const res = await userApi.login({
        code: loginRes.code,
        encryptedPhoneCode: e.detail.code,
        ...userInfoData
      })
      
      uni.setStorageSync('token', res.data.token)
      uni.setStorageSync('userInfo', res.data.userInfo)
      
      uni.hideLoading()
      uni.showToast({ title: '登录成功', icon: 'success' })
      
      setTimeout(() => {
        uni.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (error) {
      uni.hideLoading()
      console.error('获取手机号登录失败:', error)
      uni.showToast({ title: '获取手机号失败，请重试', icon: 'none' })
    }
  } else {
    uni.showToast({ title: '您已拒绝获取手机号', icon: 'none' })
  }
  // #endif
}

const handleWechatLogin = async () => {
  if (!agreed.value) {
    return uni.showToast({ title: '请先同意用户协议', icon: 'none' })
  }

  // #ifdef MP-WEIXIN
  try {
    uni.showLoading({ title: '登录中...' })

    const loginRes = await new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: (err) => {
          console.error('微信登录失败:', err)
          reject(new Error(err.errMsg || '微信登录调用失败'))
        }
      })
    })

    // 获取微信用户头像和昵称
    let userInfoData = {}
    
    try {
      const profileRes = await new Promise((resolve, reject) => {
        uni.getUserProfile({
          desc: '用于完善用户资料',
          success: resolve,
          fail: (err) => {
            console.log('获取用户信息失败，将使用默认值:', err)
            resolve(null)
          }
        })
      })
      
      if (profileRes && profileRes.userInfo) {
        userInfoData = {
          nickname: profileRes.userInfo.nickName,
          avatar: profileRes.userInfo.avatarUrl
        }
      }
    } catch (e) {
      console.log('跳过获取用户信息:', e)
    }

    const res = await userApi.login({
      code: loginRes.code,
      ...userInfoData
    })

    uni.setStorageSync('token', res.data.token)
    uni.setStorageSync('userInfo', res.data.userInfo)

    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })

    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  } catch (e) {
    uni.hideLoading()
    const msg = e?.message || ''
    if (msg.includes('deny') || msg.includes('cancel') || msg.includes('fail')) {
      uni.showModal({
        title: '登录失败',
        content: '微信登录失败，您可以使用手机号登录',
        showCancel: false,
        confirmText: '我知道了'
      })
    } else if (msg.includes('timeout') || msg.includes('网络')) {
      uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
    } else {
      uni.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
    console.error(e)
  }
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({ title: '请在微信小程序中使用微信登录', icon: 'none' })
  // #endif
}

const showAgreement = (type) => {
  const titles = { privacy: '隐私政策', user: '用户协议' }
  const contents = {
    privacy: `【隐私政策】\n\n我们重视您的隐私保护。本应用收集的信息包括：\n\n1. 手机号码：用于账号注册和身份验证\n2. 学号信息（可选）：用于数据统计和个性化推荐\n3. 使用记录：用于提供学习数据分析功能\n\n我们承诺：\n- 不会向第三方出售您的个人信息\n- 采用加密技术保护您的数据安全\n- 您有权随时删除自己的账户和数据`,
    user: `【用户协议】\n\n欢迎使用校内考研助手！在使用本服务前，请仔细阅读以下条款：\n\n1. 服务内容：本应用为在校考研学生提供学习资料共享、学习打卡、社区交流等服务。\n\n2. 用户义务：\n   - 请勿上传盗版、侵权资料\n   - 请勿发布违法、违规言论\n   - 尊重他人，文明交流\n\n3. 知识产权：用户上传的内容版权归原作者所有，但授权本平台在服务范围内使用。\n\n4. 免责声明：本平台不对因使用本服务造成的任何损失承担责任。`
  }
  
  uni.showModal({
    title: titles[type],
    content: contents[type],
    showCancel: false,
    confirmText: '我知道了'
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #007AFF 0%, #f5f5f5 40%);
}

.login-header {
  padding: 120rpx 40rpx 60rpx;
}

.logo-area {
  text-align: center;
}

.logo-text {
  font-size: 100rpx;
  display: block;
  margin-bottom: 20rpx;
}

.app-name {
  font-size: 44rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 12rpx;
}

.app-desc {
  font-size: 28rpx;
  color: rgba(255,255,255,0.85);
}

.login-form {
  margin: -30rpx 30rpx 30rpx;
  padding: 40rpx 30rpx;
  border-radius: 20rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 90rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
  border: 2rpx solid transparent;
}

.form-input:focus {
  border-color: #007AFF;
  background: #fff;
}

.login-btn {
  width: 100%;
  height: 90rpx;
  font-size: 32rpx;
  margin-top: 20rpx;
}

.login-btn[disabled] {
  opacity: 0.6;
}

.divider {
  display: flex;
  align-items: center;
  margin: 36rpx 0;
}

.line {
  flex: 1;
  height: 1rpx;
  background: #e0e0e0;
}

.divider-text {
  padding: 0 24rpx;
  font-size: 24rpx;
  color: #999;
}

.wechat-btn {
  width: 100%;
  height: 90rpx;
  background: #07c160;
  color: #fff;
  border-radius: 45rpx;
  font-size: 30rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
}

.wechat-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

.phone-btn {
  width: 100%;
  height: 90rpx;
  background: #1890ff;
  color: #fff;
  border-radius: 45rpx;
  font-size: 30rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
}

.phone-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 30rpx;
  flex-wrap: wrap;
}

.agree-text {
  font-size: 24rpx;
  color: #999;
}

.agree-link {
  font-size: 24rpx;
  color: #007AFF;
}


</style>

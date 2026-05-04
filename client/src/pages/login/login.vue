<template>
  <view class="login-page">
    <!-- 背景图 -->
    <image class="bg-image" src="/static/images/login-bg.png" mode="aspectFill"></image>
    
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-placeholder"></view>
      <view class="nav-placeholder"></view>
      <view class="nav-placeholder"></view>
    </view>
    
    <!-- 品牌区 -->
    <view class="brand-area">
      <image class="school-logo" src="/static/images/school-logo.png" mode="aspectFit"></image>
      <text class="school-name">绍兴理工学院</text>
      <text class="app-name">校内考研助手</text>
      <text class="app-slogan">— 官方校园服务平台 —</text>
    </view>
    
    <!-- 登录卡片区 -->
    <view class="login-card">
      <!-- 微信登录按钮 -->
      <button 
        class="wechat-btn" 
        open-type="getPhoneNumber"
        @getphonenumber="handleGetPhoneNumber"
      >
        <text class="wechat-icon">💬</text>
        微信一键登录
      </button>
      
      <!-- 分隔文字 -->
      <view class="divider">
        <text class="divider-text">或使用手机号登录</text>
      </view>
      
      <!-- 手机号输入框 -->
      <view class="input-wrapper">
        <text class="input-icon">📱</text>
        <input 
          class="phone-input" 
          v-model="phone" 
          type="number"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </view>
      
      <!-- 手机号登录按钮 -->
      <button 
        class="phone-login-btn" 
        :class="{ 'btn-disabled': !agreed || !isPhoneValid }"
        :disabled="!agreed || !isPhoneValid"
        @click="handleLogin"
      >
        {{ loading ? '登录中...' : '手机号验证登录' }}
      </button>
      

      <!-- 协议勾选 -->
      <view class="agreement-area">
        <checkbox :checked="agreed" @click="agreed = !agreed" color="#e64340" style="transform: scale(0.85);" />
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
const agreed = ref(false)
const wechatData = ref({ openid: null, nickname: null, avatar: null })

const isPhoneValid = computed(() => {
  return /^1[3-9]\d{9}$/.test(phone.value)
})

// 完成登录后的处理
const completeLogin = async (loginParams) => {
  try {
    const res = await userApi.login(loginParams)
    
    uni.setStorageSync('token', res.data.token)
    uni.setStorageSync('userInfo', res.data.userInfo)
    uni.setStorageSync('user', res.data.userInfo)
    
    uni.hideLoading()
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
    uni.hideLoading()
    console.error(e)
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  }
}

// 微信手机号授权回调
const handleGetPhoneNumber = async (e) => {
  if (!agreed.value) {
    return uni.showToast({ title: '请先同意用户协议', icon: 'none' })
  }

  // #ifdef MP-WEIXIN
  if (e.detail.errMsg === 'getPhoneNumber:ok' && e.detail.code) {
    try {
      uni.showLoading({ title: '登录中...' })

      // 1. 先获取微信登录code
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

      // 2. 获取微信session信息（openid）
      const sessionRes = await userApi.wechatSession(loginRes.code)
      wechatData.value.openid = sessionRes.data.openid

      // 3. 获取微信手机号
      const phoneRes = await userApi.wechatPhone(e.detail.code)
      const phoneNumber = phoneRes.data.phone_number

      // 4. 尝试获取用户昵称头像
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

      // 5. 调用登录接口
      await completeLogin({
        openid: wechatData.value.openid,
        phone: phoneNumber,
        ...userInfoData
      })

    } catch (err) {
      uni.hideLoading()
      console.error('微信手机号登录失败:', err)
      uni.showToast({ title: '微信登录失败，请使用手机号登录', icon: 'none' })
    }
  } else {
    uni.showToast({ title: '您已拒绝授权手机号', icon: 'none' })
  }
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({ title: '请在微信小程序中使用微信登录', icon: 'none' })
  // #endif
}

const handleLogin = async () => {
  if (!agreed.value) {
    return uni.showToast({ title: '请先同意用户协议', icon: 'none' })
  }
  
  if (!isPhoneValid.value) {
    return uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
  }
  
  loading.value = true
  uni.showLoading({ title: '登录中...' })
  
  try {
    await completeLogin({ phone: phone.value })
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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
  position: relative;
  background-color: #f5f5f5;
  overflow: hidden;
}

.bg-image {
  position: absolute;
  top: -300rpx;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.3;
  z-index: 0;
}

.nav-bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding-top: var(--status-bar-height);
  box-sizing: content-box;
}



.nav-placeholder {
  width: 88rpx;
}

.brand-area {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60rpx;
  padding-bottom: 40rpx;
}

.school-logo {
  width: 180rpx;
  height: 180rpx;
  margin-bottom: 24rpx;
}

.school-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
  letter-spacing: 2rpx;
}

.app-name {
  font-size: 32rpx;
  color: #555;
  margin-bottom: 20rpx;
}

.app-slogan {
  font-size: 24rpx;
  color: #999;
  letter-spacing: 4rpx;
}

.login-card {
  position: relative;
  z-index: 1;
  background: #fff;
  margin: 0 40rpx;
  padding: 50rpx 40rpx;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.wechat-btn {
  width: 100%;
  height: 96rpx;
  background: #07c160;
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  line-height: 1;
  padding: 0;
}

.wechat-btn::after {
  border: none;
}

.wechat-icon {
  margin-right: 12rpx;
  font-size: 36rpx;
}

.divider {
  text-align: center;
  margin: 40rpx 0;
}

.divider-text {
  font-size: 26rpx;
  color: #999;
}

.input-wrapper {
  display: flex;
  align-items: center;
  height: 96rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 28rpx;
  border: 2rpx solid #e8e8e8;
  margin-bottom: 32rpx;
}

.input-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.phone-input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  height: 100%;
}

.phone-login-btn {
  width: 100%;
  height: 96rpx;
  background: #e64340;
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  line-height: 1;
  padding: 0;
}

.phone-login-btn::after {
  border: none;
}

.phone-login-btn.btn-disabled {
  background: #ccc;
  color: #fff;
}



.agreement-area {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding-top: 10rpx;
}

.agree-text {
  font-size: 24rpx;
  color: #666;
}

.agree-link {
  font-size: 24rpx;
  color: #e64340;
}
</style>

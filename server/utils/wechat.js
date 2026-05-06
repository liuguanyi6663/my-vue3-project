const axios = require('axios')
const db = require('./db')
const config = require('../config/index')

class WeChatManager {
  constructor() {
    this.appId = config.wechat.appId
    this.appSecret = config.wechat.appSecret
    this.notificationTemplate = config.wechat.notificationTemplate
    this.messageTemplate = config.wechat.messageTemplate
    this.accessToken = null
    this.tokenExpireTime = 0
  }

  async getAccessToken() {
    const now = Date.now()
    if (this.accessToken && now < this.tokenExpireTime) {
      return this.accessToken
    }

    try {
      const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
        params: {
          grant_type: 'client_credential',
          appid: this.appId,
          secret: this.appSecret
        }
      })

      if (response.data.errcode) {
        console.error('获取access_token失败:', response.data)
        return null
      }

      this.accessToken = response.data.access_token
      this.tokenExpireTime = now + (response.data.expires_in - 300) * 1000
      return this.accessToken
    } catch (error) {
      console.error('获取access_token异常:', error.message)
      return null
    }
  }

  /**
   * 微信登录：用 code 换取 session_key 和 openid
   */
  async code2Session(code) {
    try {
      const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: this.appId,
          secret: this.appSecret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      })

      if (response.data.errcode) {
        console.error('微信登录失败:', response.data)
        return null
      }

      return {
        openid: response.data.openid,
        unionid: response.data.unionid,
        session_key: response.data.session_key
      }
    } catch (error) {
      console.error('微信登录异常:', error.message)
      return null
    }
  }

  /**
   * 获取手机号：用手机号授权 code 换取真实手机号
   */
  async getPhoneNumber(code) {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      console.error('无法获取access_token，无法获取手机号')
      return null
    }

    try {
      const response = await axios.post(
        `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
        {
          code: code
        }
      )

      if (response.data.errcode !== 0) {
        console.error('获取手机号失败:', response.data)
        return null
      }

      return {
        phoneNumber: response.data.phone_info.phoneNumber,
        purePhoneNumber: response.data.phone_info.purePhoneNumber,
        countryCode: response.data.phone_info.countryCode
      }
    } catch (error) {
      console.error('获取手机号异常:', error.message)
      return null
    }
  }

  async sendSubscribeMessage(openid, templateId, data, page = '') {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      console.error('无法获取access_token')
      return false
    }

    try {
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
        {
          touser: openid,
          template_id: templateId,
          page: page,
          data: data
        }
      )

      if (response.data.errcode === 0) {
        console.log('订阅消息发送成功:', openid)
        return true
      } else {
        console.error('订阅消息发送失败:', response.data)
        if (response.data.errcode === 43101 || response.data.errcode === 40037) {
          await this.removeUserSubscription(openid, templateId)
        }
        return false
      }
    } catch (error) {
      console.error('发送订阅消息异常:', error.message)
      return false
    }
  }

  async addUserSubscription(userId, openid, templateId, scene = 'default') {
    try {
      await db.query(
        `INSERT INTO user_subscriptions (user_id, openid, template_id, scene, created_at) 
         VALUES (?, ?, ?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [userId, openid, templateId, scene]
      )
      return true
    } catch (error) {
      console.error('保存用户订阅失败:', error)
      return false
    }
  }

  async removeUserSubscription(openid, templateId) {
    try {
      await db.query(
        'DELETE FROM user_subscriptions WHERE openid = ? AND template_id = ?',
        [openid, templateId]
      )
      return true
    } catch (error) {
      console.error('删除用户订阅失败:', error)
      return false
    }
  }

  async getUserSubscriptions(userId) {
    try {
      const result = await db.query(
        'SELECT * FROM user_subscriptions WHERE user_id = ?',
        [userId]
      )
      return result
    } catch (error) {
      console.error('获取用户订阅失败:', error)
      return []
    }
  }

  async sendNotificationToSubscribedUsers(title, content, type = 'notice') {
    try {
      const templateId = this.notificationTemplate
      if (!templateId) {
        console.error('未配置通知消息模板ID')
        return []
      }

      const subscriptions = await db.query(
        `SELECT DISTINCT us.openid, us.user_id 
         FROM user_subscriptions us 
         INNER JOIN users u ON us.user_id = u.id 
         WHERE us.template_id = ? AND u.status = 1`,
        [templateId]
      )

      const results = []
      for (const sub of subscriptions) {
        const success = await this.sendSubscribeMessage(
          sub.openid,
          templateId,
          {
            thing1: { value: title },
            thing2: { value: content.substring(0, 20) },
            thing3: { value: type === 'urgent' ? '紧急通知' : (type === 'announcement' ? '公告' : '通知') }
          },
          'pages/notifications/index'
        )
        results.push({ userId: sub.user_id, success })
      }

      return results
    } catch (error) {
      console.error('批量发送通知失败:', error)
      return []
    }
  }

  async sendMessageNotification(senderNickname, receiverId, messageContent) {
    try {
      const templateId = this.messageTemplate
      if (!templateId) {
        console.error('未配置消息提醒模板ID')
        return false
      }

      const receiver = await db.query(
        'SELECT openid FROM users WHERE id = ?',
        [receiverId]
      )
      if (!receiver || receiver.length === 0 || !receiver[0].openid) {
        return false
      }

      const subscription = await db.query(
        'SELECT * FROM user_subscriptions WHERE openid = ? AND template_id = ?',
        [receiver[0].openid, templateId]
      )
      if (subscription.length === 0) {
        return false
      }

      return await this.sendSubscribeMessage(
        receiver[0].openid,
        templateId,
        {
          thing1: { value: senderNickname },
          thing2: { value: messageContent.substring(0, 20) },
          date3: { value: new Date().toLocaleString('zh-CN') }
        },
        'pages/mine/messages'
      )
    } catch (error) {
      console.error('发送消息提醒失败:', error)
      return false
    }
  }
}

module.exports = new WeChatManager()

const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const db = require('../utils/db')
const { success, error } = require('../utils/response')
const config = require('../config/index')
const { auth } = require('../middleware/auth')
const upload = require('../middleware/upload')
const weixin = require('../utils/wechat')

router.post('/login', async (req, res) => {
  try {
    const { code, phone, username, password, nickname, avatar, openid, encryptedPhoneCode } = req.body
    if (!code && !phone && !username && !openid) {
      return res.json(error('请提供登录凭证'))
    }
    
    let finalPhone = phone
    
    // 如果有加密手机号，尝试解析（实际项目需要调用微信接口）
    // 这里暂时不做真实解析，后续需要在服务端调用微信 phonenumber.getPhoneNumber 接口
    // 为了演示，这里直接使用一个默认逻辑
    
    let user
    if (username && password) {
      // 用户名密码登录（仅用于测试）
      const users = await db.query('SELECT * FROM users WHERE nickname = ?', [username])
      if (users.length > 0) {
        user = users[0]
      } else {
        return res.json(error('用户不存在'))
      }
    } else if (finalPhone) {
      const users = await db.query('SELECT * FROM users WHERE phone = ?', [finalPhone])
      if (users.length > 0) {
        user = users[0]
        // 如果传入了新的昵称或头像，更新用户信息
        if (nickname || avatar) {
          const updateData = {}
          if (nickname) updateData.nickname = nickname
          if (avatar) updateData.avatar = avatar
          if (Object.keys(updateData).length > 0) {
            const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ')
            const values = Object.values(updateData)
            await db.query(`UPDATE users SET ${setClauses} WHERE id = ?`, [...values, user.id])
            Object.assign(user, updateData)
          }
        }
      } else {
        const result = await db.query(
          'INSERT INTO users (phone, nickname, avatar) VALUES (?, ?, ?)',
          [finalPhone, nickname || '用户' + finalPhone.slice(-4), avatar || null]
        )
        user = { 
          id: result.insertId, 
          phone: finalPhone, 
          nickname: nickname || '用户' + finalPhone.slice(-4), 
          avatar, 
          role: 'student', 
          status: 1 
        }
      }
    } else {
      // 微信登录
      const finalOpenid = openid || 'wx_' + uuidv4().slice(0, 8)
      const users = await db.query('SELECT * FROM users WHERE openid = ?', [finalOpenid])
      
      // 如果有加密手机号，可以在这里调用微信接口获取真实手机号
      let decryptedPhone = null
      
      // 这里需要调用微信接口获取手机号，由于需要配置 appid 和 secret，暂时留空
      // 实际项目需要在这里调用 weixin.phonenumber.getPhoneNumber 接口
      
      if (users.length > 0) {
        user = users[0]
        // 如果传入了新的昵称、头像或手机号，更新用户信息
        if (nickname || avatar || decryptedPhone) {
          const updateData = {}
          if (nickname) updateData.nickname = nickname
          if (avatar) updateData.avatar = avatar
          if (decryptedPhone) updateData.phone = decryptedPhone
          if (Object.keys(updateData).length > 0) {
            const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ')
            const values = Object.values(updateData)
            await db.query(`UPDATE users SET ${setClauses} WHERE id = ?`, [...values, user.id])
            Object.assign(user, updateData)
          }
        }
      } else {
        const result = await db.query(
          'INSERT INTO users (openid, nickname, avatar, phone) VALUES (?, ?, ?, ?)',
          [finalOpenid, nickname || '微信用户', avatar || null, decryptedPhone || null]
        )
        user = { 
          id: result.insertId, 
          openid: finalOpenid, 
          nickname: nickname || '微信用户', 
          avatar, 
          phone: decryptedPhone, 
          role: 'student', 
          status: 1 
        }
      }
    }
    
    if (user.status === 0) {
      return res.json(error('账号已被禁用', 403))
    }
    
    // 如果用户在注销冷静期内重新登录，自动取消注销
    if (user.is_deleting === 1) {
      await db.query(
        'UPDATE users SET is_deleting = 0, delete_request_at = NULL WHERE id = ?',
        [user.id]
      )
      user.is_deleting = 0
      user.delete_request_at = null
    }
    
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
    
    res.json(success({
      token,
      userInfo: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        college: user.college,
        major: user.major,
        student_id: user.student_id,
        role: user.role,
        is_banned: user.is_banned || 0,
        is_landed: user.is_landed || 0
      }
    }, '登录成功'))
  } catch (err) {
    console.error(err)
    res.json(error('登录失败'))
  }
})

router.get('/info', auth, async (req, res) => {
  try {
    res.json(success(req.user))
  } catch (err) {
    res.json(error('获取用户信息失败'))
  }
})

router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname, avatar, phone, college, major, student_id, target_school, target_major, exam_year } = req.body
    await db.query(
      'UPDATE users SET nickname=?, avatar=?, phone=?, college=?, major=?, student_id=?, target_school=?, target_major=?, exam_year=? WHERE id=?',
      [nickname, avatar, phone || null, college, major, student_id, target_school || null, target_major || null, exam_year || null, req.user.id]
    )
    res.json(success(null, '更新成功'))
  } catch (err) {
    res.json(error('更新失败'))
  }
})

router.post('/avatar', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json(error('请选择图片'))
    }
    const avatarUrl = '/uploads/' + req.file.filename
    await db.query('UPDATE users SET avatar=? WHERE id=?', [avatarUrl, req.user.id])
    res.json(success({ url: avatarUrl }, '头像上传成功'))
  } catch (err) {
    console.error(err)
    res.json(error('头像上传失败'))
  }
})

router.get('/public/:id', async (req, res) => {
  try {
    console.log('获取用户公共信息，用户ID:', req.params.id)
    const users = await db.query(
      'SELECT id, nickname, avatar, college, major, target_school, target_major, exam_year, is_landed, created_at FROM users WHERE id=? AND status=1 AND is_deleting=0',
      [req.params.id]
    )
    console.log('查询到的用户:', users)
    if (users.length === 0) {
      return res.json(error('用户不存在'))
    }
    res.json(success(users[0]))
  } catch (err) {
    console.error('获取用户公共信息错误:', err)
    res.json(error('获取用户信息失败'))
  }
})

// 注销账号 - 发起注销请求
router.post('/delete-request', auth, async (req, res) => {
  try {
    const userId = req.user.id
    
    // 检查用户是否已经在注销中
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId])
    if (users.length === 0) {
      return res.json(error('用户不存在'))
    }
    
    const user = users[0]
    if (user.is_deleting === 1) {
      const deleteRequestAt = new Date(user.delete_request_at)
      const now = new Date()
      const daysLeft = Math.ceil((3 * 24 * 60 * 60 * 1000 - (now - deleteRequestAt)) / (24 * 60 * 60 * 1000))
      return res.json(success({ 
        is_deleting: true, 
        delete_request_at: user.delete_request_at,
        days_left: daysLeft > 0 ? daysLeft : 0
      }, '账号已在注销冷静期中'))
    }
    
    // 更新用户状态为注销中
    await db.query(
      'UPDATE users SET is_deleting = 1, delete_request_at = NOW() WHERE id = ?',
      [userId]
    )
    
    res.json(success({ is_deleting: true, delete_request_at: new Date(), days_left: 3 }, '注销申请已提交，3天冷静期后将彻底删除账号'))
  } catch (err) {
    console.error(err)
    res.json(error('提交注销申请失败'))
  }
})

// 取消注销账号
router.post('/cancel-delete', auth, async (req, res) => {
  try {
    const userId = req.user.id
    
    // 更新用户状态为正常
    await db.query(
      'UPDATE users SET is_deleting = 0, delete_request_at = NULL WHERE id = ?',
      [userId]
    )
    
    res.json(success(null, '注销申请已取消'))
  } catch (err) {
    console.error(err)
    res.json(error('取消注销申请失败'))
  }
})

// 获取注销状态
router.get('/delete-status', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const users = await db.query('SELECT is_deleting, delete_request_at FROM users WHERE id = ?', [userId])
    
    if (users.length === 0) {
      return res.json(error('用户不存在'))
    }
    
    const user = users[0]
    let daysLeft = 0
    
    if (user.is_deleting === 1 && user.delete_request_at) {
      const deleteRequestAt = new Date(user.delete_request_at)
      const now = new Date()
      daysLeft = Math.ceil((3 * 24 * 60 * 60 * 1000 - (now - deleteRequestAt)) / (24 * 60 * 60 * 1000))
      daysLeft = daysLeft > 0 ? daysLeft : 0
    }
    
    res.json(success({
      is_deleting: user.is_deleting === 1,
      delete_request_at: user.delete_request_at,
      days_left: daysLeft
    }))
  } catch (err) {
    console.error(err)
    res.json(error('获取注销状态失败'))
  }
})

// 微信登录：获取微信session（openid, unionid等）
router.post('/wechat/session', async (req, res) => {
  try {
    const { code } = req.body
    if (!code) {
      return res.json(error('缺少微信登录code'))
    }

    // 检查是否配置了微信小程序信息
    if (weixin.appId === 'touristappid' || !weixin.appSecret) {
      console.warn('微信小程序未配置，返回模拟数据用于测试')
      return res.json(success({
        openid: 'test_openid_' + Date.now(),
        unionid: 'test_unionid_' + Date.now(),
        session_key: 'test_session_key_' + Date.now()
      }, '获取微信登录信息成功（测试模式）'))
    }

    const session = await weixin.code2Session(code)
    if (!session) {
      return res.json(error('获取微信登录信息失败，请检查微信配置'))
    }

    res.json(success({
      openid: session.openid,
      unionid: session.unionid,
      session_key: session.session_key
    }, '获取微信登录信息成功'))
  } catch (err) {
    console.error(err)
    res.json(error('获取微信登录信息失败: ' + (err.message || '未知错误')))
  }
})

// 微信登录：获取手机号
router.post('/wechat/phone', async (req, res) => {
  try {
    const { code } = req.body
    if (!code) {
      return res.json(error('缺少手机号授权code'))
    }

    // 检查是否配置了微信小程序信息
    if (weixin.appId === 'touristappid' || !weixin.appSecret) {
      console.warn('微信小程序未配置，返回模拟手机号用于测试')
      return res.json(success({
        phone_number: '1380000' + String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      }, '获取手机号成功（测试模式）'))
    }

    const phoneInfo = await weixin.getPhoneNumber(code)
    if (!phoneInfo || !phoneInfo.phoneNumber) {
      return res.json(error('获取手机号失败，请检查微信配置或确认是企业认证小程序'))
    }

    res.json(success({
      phone_number: phoneInfo.phoneNumber
    }, '获取手机号成功'))
  } catch (err) {
    console.error(err)
    res.json(error('获取手机号失败: ' + (err.message || '未知错误')))
  }
})

module.exports = router

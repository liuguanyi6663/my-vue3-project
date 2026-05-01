const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const db = require('../utils/db')
const { success, error } = require('../utils/response')
const config = require('../config/index')
const { auth } = require('../middleware/auth')
const upload = require('../middleware/upload')

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
    const users = await db.query(
      'SELECT id, nickname, avatar, college, major, target_school, target_major, exam_year, is_landed, created_at FROM users WHERE id=? AND status=1',
      [req.params.id]
    )
    if (users.length === 0) {
      return res.json(error('用户不存在'))
    }
    res.json(success(users[0]))
  } catch (err) {
    res.json(error('获取用户信息失败'))
  }
})

module.exports = router

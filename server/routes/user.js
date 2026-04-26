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
    const { code, phone, username, password } = req.body
    if (!code && !phone && !username) {
      return res.json(error('请提供登录凭证'))
    }
    
    let user
    if (username && password) {
      // 用户名密码登录（仅用于测试）
      const users = await db.query('SELECT * FROM users WHERE nickname = ?', [username])
      if (users.length > 0) {
        user = users[0]
      } else {
        return res.json(error('用户不存在'))
      }
    } else if (phone) {
      const users = await db.query('SELECT * FROM users WHERE phone = ?', [phone])
      if (users.length > 0) {
        user = users[0]
      } else {
        const result = await db.query(
          'INSERT INTO users (phone, nickname) VALUES (?, ?)',
          [phone, '用户' + phone.slice(-4)]
        )
        user = { id: result.insertId, phone, nickname: '用户' + phone.slice(-4), role: 'student', status: 1 }
      }
    } else {
      const openid = 'demo_' + uuidv4().slice(0, 8)
      const users = await db.query('SELECT * FROM users WHERE openid = ?', [openid])
      if (users.length > 0) {
        user = users[0]
      } else {
        const result = await db.query(
          'INSERT INTO users (openid, nickname) VALUES (?, ?)',
          [openid, '微信用户']
        )
        user = { id: result.insertId, openid, nickname: '微信用户', role: 'student', status: 1 }
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
        college: user.college,
        major: user.major,
        student_id: user.student_id,
        role: user.role
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
    const { nickname, avatar, college, major, student_id, target_school, target_major, exam_year } = req.body
    await db.query(
      'UPDATE users SET nickname=?, avatar=?, college=?, major=?, student_id=?, target_school=?, target_major=?, exam_year=? WHERE id=?',
      [nickname, avatar, college, major, student_id, target_school || null, target_major || null, exam_year || null, req.user.id]
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
      'SELECT id, nickname, avatar, college, major, target_school, target_major, exam_year, created_at FROM users WHERE id=? AND status=1',
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

const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')
const db = require('../utils/db')
const { success, error } = require('../utils/response')
const config = require('../config/index')
const { auth, optionalAuth } = require('../middleware/auth')
const upload = require('../middleware/upload')
const weixin = require('../utils/wechat')

/**
 * @swagger
 * tags:
 *   name: 用户模块
 *   description: 用户登录、注册、资料管理
 *
 * components:
 *   schemas:
 *     UserInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nickname:
 *           type: string
 *           example: 张三
 *         avatar:
 *           type: string
 *           example: https://example.com/avatar.png
 *         student_id:
 *           type: string
 *           example: "20210001"
 *         college:
 *           type: string
 *           example: 计算机学院
 *         major:
 *           type: string
 *           example: 软件工程
 *         target_school:
 *           type: string
 *           example: 清华大学
 *         target_major:
 *           type: string
 *           example: 计算机科学与技术
 *         exam_year:
 *           type: string
 *           example: "2026"
 *         role:
 *           type: string
 *           enum: [student, admin, super_admin]
 *         status:
 *           type: integer
 *           example: 1
 */

const REFRESH_TOKEN_BYTES = 48

function generateRefreshToken() {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex')
}

function generateTokenFamily() {
  return crypto.randomBytes(16).toString('hex')
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function issueTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiresIn }
  )

  const refreshToken = generateRefreshToken()
  const family = generateTokenFamily()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token, family, expires_at) VALUES (?, ?, ?, ?)',
    [userId, refreshToken, family, expiresAt]
  )

  return { accessToken, refreshToken, expiresIn: 15 * 60 }
}

async function rotateRefreshToken(oldRefreshToken) {
  const rows = await db.query(
    'SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0',
    [oldRefreshToken]
  )

  if (rows.length === 0) {
    return null
  }

  const existing = rows[0]

  if (new Date(existing.expires_at) < new Date()) {
    await db.query('UPDATE refresh_tokens SET revoked = 1 WHERE family = ?', [existing.family])
    return null
  }

  await db.query('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [existing.id])

  const newRefreshToken = generateRefreshToken()
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token, family, expires_at) VALUES (?, ?, ?, ?)',
    [existing.user_id, newRefreshToken, existing.family, newExpiresAt]
  )

  const accessToken = jwt.sign(
    { userId: existing.user_id },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiresIn }
  )

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: 15 * 60,
    userId: existing.user_id
  }
}

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags: [用户模块]
 *     summary: 用户登录
 *     description: 支持微信授权登录和手机号登录，返回 access_token 和 refresh_token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: 微信登录 code
 *               phone:
 *                 type: string
 *                 description: 手机号（开发模式快速登录）
 *               avatar:
 *                 type: string
 *                 description: 头像URL
 *               nickname:
 *                 type: string
 *                 description: 昵称
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
 *                       example: 900
 *                     userInfo:
 *                       $ref: '#/components/schemas/UserInfo'
 */
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
      const users = await db.query('SELECT * FROM users WHERE username = ?', [username])
      if (users.length > 0) {
        const foundUser = users[0]
        if (foundUser.password !== hashPassword(password)) {
          return res.json(error('密码错误'))
        }
        user = foundUser
      } else {
        return res.json(error('用户不存在'))
      }
    } else if (finalPhone) {
      // 手机号登录（优先级最高，因为手机号是唯一标识）
      const users = await db.query('SELECT * FROM users WHERE phone = ?', [finalPhone])
      if (users.length > 0) {
        user = users[0]
        // 如果传入了新的昵称、头像或 openid，更新用户信息
        const updateData = {}
        if (nickname) updateData.nickname = nickname
        if (avatar) updateData.avatar = avatar
        if (openid && !user.openid) updateData.openid = openid
        if (Object.keys(updateData).length > 0) {
          const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ')
          const values = Object.values(updateData)
          await db.query(`UPDATE users SET ${setClauses} WHERE id = ?`, [...values, user.id])
          Object.assign(user, updateData)
        }
      } else {
        // 手机号未匹配，检查openid是否匹配已有用户（防止跨设备创建重复账号）
        let openidMatched = false
        if (openid) {
          const openidUsers = await db.query('SELECT * FROM users WHERE openid = ?', [openid])
          if (openidUsers.length > 0) {
            user = openidUsers[0]
            openidMatched = true
            await db.query('UPDATE users SET phone = ? WHERE id = ?', [finalPhone, user.id])
            user.phone = finalPhone
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
        }
        if (!openidMatched) {
          const result = await db.query(
            'INSERT INTO users (phone, nickname, avatar, openid) VALUES (?, ?, ?, ?)',
            [finalPhone, nickname || '用户' + finalPhone.slice(-4), avatar || null, openid || null]
          )
          user = {
            id: result.insertId,
            phone: finalPhone,
            nickname: nickname || '用户' + finalPhone.slice(-4),
            avatar,
            openid: openid || null,
            role: 'student',
            status: 1
          }
        }
      }
    } else {
      // 微信登录（无手机号时）
      const finalOpenid = openid || 'wx_' + uuidv4().slice(0, 8)
      
      // 先按 openid 查询
      let users = await db.query('SELECT * FROM users WHERE openid = ?', [finalOpenid])
      
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
        // 没有找到 openid，检查手机号是否匹配已有用户（防止跨设备创建重复账号）
        let phoneMatched = false
        if (phone) {
          const phoneUsers = await db.query('SELECT * FROM users WHERE phone = ?', [phone])
          if (phoneUsers.length > 0) {
            user = phoneUsers[0]
            phoneMatched = true
            await db.query('UPDATE users SET openid = ? WHERE id = ?', [finalOpenid, user.id])
            user.openid = finalOpenid
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
          }
        }
        if (!phoneMatched) {
          const result = await db.query(
            'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
            [finalOpenid, nickname || '微信用户', avatar || null]
          )
          user = {
            id: result.insertId,
            openid: finalOpenid,
            nickname: nickname || '微信用户',
            avatar,
            role: 'student',
            status: 1
          }
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
    
    const tokenData = await issueTokens(user.id)

    res.json(success({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
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

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     tags: [用户模块]
 *     summary: 刷新 access_token
 *     description: 使用 refresh_token 获取新的 access_token，旧 token 将被轮转
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 刷新令牌
 *     responses:
 *       200:
 *         description: 刷新成功
 *       401:
 *         description: refresh_token 无效或已过期
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.json({ code: 401, msg: '缺少refresh_token', data: null, subCode: 'NO_REFRESH_TOKEN' })
    }

    const result = await rotateRefreshToken(refreshToken)
    if (!result) {
      return res.json({ code: 401, msg: 'refresh_token无效或已过期，请重新登录', data: null, subCode: 'REFRESH_INVALID' })
    }

    res.json(success({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn
    }, '令牌刷新成功'))
  } catch (err) {
    console.error('刷新token失败:', err)
    res.json(error('刷新token失败'))
  }
})

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     tags: [用户模块]
 *     summary: 登出
 *     description: 撤销当前用户的所有 refresh_token
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 */
router.post('/logout', auth, async (req, res) => {
  try {
    await db.query(
      'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND revoked = 0',
      [req.user.id]
    )
    res.json(success(null, '已登出'))
  } catch (err) {
    console.error('登出失败:', err)
    res.json(error('登出失败'))
  }
})

module.exports = router

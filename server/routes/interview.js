const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error } = require('../utils/response')
const { auth, adminAuth } = require('../middleware/auth')
const upload = require('../middleware/upload')
const path = require('path')
const fs = require('fs')

router.get('/oral-questions', async (req, res) => {
  try {
    const systemQuestions = await db.query(
      'SELECT id, question_en, question_cn, reference_answer, category FROM oral_questions ORDER BY sort_order ASC, id ASC'
    )

    const userQuestions = await db.query(
      `SELECT oq.*, u.nickname as uploader_name 
       FROM oral_questions_user oq 
       LEFT JOIN users u ON oq.user_id=u.id 
       WHERE oq.audit_status='approved' 
       ORDER BY oq.created_at DESC`
    )

    res.json(success({
      system: systemQuestions,
      user: userQuestions
    }))
  } catch (err) {
    console.error('获取口语题库失败:', err)
    res.json(error('获取口语题库失败'))
  }
})

router.post('/oral-questions', auth, async (req, res) => {
  try {
    const { question_en, question_cn, reference_answer, category } = req.body
    if (!question_en || !question_en.trim()) {
      return res.json(error('英文问题不能为空'))
    }
    if (!reference_answer || !reference_answer.trim()) {
      return res.json(error('参考回答不能为空'))
    }

    const result = await db.query(
      'INSERT INTO oral_questions_user (user_id, question_en, question_cn, reference_answer, category) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, question_en.trim(), (question_cn || '').trim(), reference_answer.trim(), category || '通用']
    )
    res.json(success({ id: result.insertId }, '提交成功，等待管理员审批'))
  } catch (err) {
    console.error('上传口语题目失败:', err)
    res.json(error('上传失败'))
  }
})

router.delete('/oral-questions/:id', auth, async (req, res) => {
  try {
    const question = await db.query('SELECT * FROM oral_questions_user WHERE id=?', [req.params.id])
    if (question.length === 0) {
      return res.json(error('题目不存在'))
    }

    if (req.user.role !== 'admin' && question[0].user_id !== req.user.id) {
      return res.json(error('无权删除'))
    }

    await db.query('DELETE FROM oral_questions_user WHERE id=?', [req.params.id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('删除口语题目失败:', err)
    res.json(error('删除失败'))
  }
})

router.get('/resume-templates', async (req, res) => {
  try {
    const systemTemplates = [
      { id: 'sys_1', name: '学术型简历模板', desc: '突出科研成果和学术能力，适合学术导向的申请', type: 'system' },
      { id: 'sys_2', name: '综合型简历模板', desc: '平衡展示学习、科研和实践能力，通用性强', type: 'system' },
      { id: 'sys_3', name: '实践型简历模板', desc: '强调实习、项目和竞赛经验，适合专硕申请', type: 'system' }
    ]

    const userTemplates = await db.query(
      `SELECT rt.*, u.nickname as uploader_name 
       FROM resume_templates_user rt 
       LEFT JOIN users u ON rt.user_id=u.id 
       WHERE rt.audit_status='approved' 
       ORDER BY rt.created_at DESC`
    )

    res.json(success({
      system: systemTemplates,
      user: userTemplates.map(t => ({ ...t, type: 'user' }))
    }))
  } catch (err) {
    console.error('获取简历模板失败:', err)
    res.json(error('获取简历模板失败'))
  }
})

router.post('/resume-templates', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json(error('请上传Word文档'))
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase()
    if (!['.doc', '.docx'].includes(ext)) {
      if (req.file.path) fs.unlinkSync(req.file.path)
      return res.json(error('仅支持上传Word文档（.doc/.docx）'))
    }

    const { name, desc } = req.body
    const result = await db.query(
      'INSERT INTO resume_templates_user (user_id, name, `desc`, file_name, file_path, file_size) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, name || req.file.originalname, desc || '', req.file.originalname || 'document.docx', '/uploads/' + req.file.filename, req.file.size]
    )
    res.json(success({ id: result.insertId }, '上传成功，等待管理员审批'))
  } catch (err) {
    console.error('上传简历模板失败:', err)
    res.json(error('上传失败'))
  }
})

router.delete('/resume-templates/:id', auth, async (req, res) => {
  try {
    const template = await db.query('SELECT * FROM resume_templates_user WHERE id=?', [req.params.id])
    if (template.length === 0) {
      return res.json(error('模板不存在'))
    }

    if (req.user.role !== 'admin' && template[0].user_id !== req.user.id) {
      return res.json(error('无权删除'))
    }

    const filePath = path.join(__dirname, '..', template[0].file_path)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await db.query('DELETE FROM resume_templates_user WHERE id=?', [req.params.id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('删除简历模板失败:', err)
    res.json(error('删除失败'))
  }
})

router.get('/resume-templates/:id/download', auth, async (req, res) => {
  try {
    const template = await db.query('SELECT * FROM resume_templates_user WHERE id=?', [req.params.id])
    if (template.length === 0) {
      return res.json(error('模板不存在'))
    }

    if (template[0].audit_status !== 'approved') {
      return res.json(error('模板未通过审核'))
    }

    await db.query('UPDATE resume_templates_user SET download_count=download_count+1 WHERE id=?', [req.params.id])

    const filePath = path.join(__dirname, '..', template[0].file_path)
    if (!fs.existsSync(filePath)) {
      return res.json(error('文件不存在'))
    }

    res.download(filePath, template[0].file_name)
  } catch (err) {
    console.error('下载简历模板失败:', err)
    res.json(error('下载失败'))
  }
})

router.get('/email-templates', async (req, res) => {
  try {
    const systemTemplates = [
      {
        id: 'sys_1',
        scene: '初次联系',
        subject: '关于报考硕士研究生事宜 - [姓名]',
        content: `尊敬的[导师姓名]教授：\n\n您好！\n\n我是[本科学校][专业]的[姓名]同学，今年准备报考贵校[学院/专业]的硕士研究生。\n\n通过阅读您的相关论文，我对您在[研究方向]领域的研究工作非常感兴趣。特别是您关于[某篇论文/研究成果]的工作让我深受启发。\n\n我本科期间学习成绩优异（GPA: X.X/4.0），曾获得[奖项名称]。在[某课程/项目]的学习中，我对[相关方向]产生了浓厚兴趣，并完成了[相关成果]。\n\n冒昧致信，希望能有机会得到您的指导。如蒙赐教，不胜感激！\n\n随信附上我的个人简历，恳请拨冗审阅。\n\n此致\n敬礼！\n\n学生：[姓名]\n[日期]\n[联系方式]`,
        type: 'system'
      },
      {
        id: 'sys_2',
        scene: '成绩出来后',
        subject: '汇报初试成绩及调剂意向 - [姓名]',
        content: `尊敬的[导师姓名]教授：\n\n您好！我是之前与您联系过的[姓名]同学。\n\n非常高兴地告诉您，我在今年的研究生入学考试中取得了以下成绩：\n- 总分：XXX\n- 政治：XX\n- 英语：XX\n- 专业课一：XX\n- 专业课二：XX\n\n我对您的研究方向仍然充满热情，希望能有机会加入您的团队攻读硕士学位。如果符合要求，我非常愿意参加复试并进一步交流。\n\n期待您的回复！\n\n祝您工作顺利！\n\n学生：[姓名]\n[日期]`,
        type: 'system'
      },
      {
        id: 'sys_3',
        scene: '复试后感谢',
        subject: '感谢面试机会 - [姓名]',
        content: `尊敬的[导师姓名]教授：\n\n您好！\n\n非常感谢您在百忙之中抽出时间参加我的复试面试。通过与您的交流，我受益匪浅，对您的研究方向有了更深入的理解，也更加坚定了跟随您学习的决心。\n\n无论最终录取结果如何，这次面试经历都让我收获颇丰。如果能有幸成为您的学生，我将倍加珍惜这个学习机会，努力钻研，不负您的期望。\n\n再次感谢您的时间和指导！\n\n祝您身体健康，工作顺利！\n\n学生：[姓名]\n[日期]`,
        type: 'system'
      }
    ]

    const userTemplates = await db.query(
      `SELECT et.*, u.nickname as uploader_name 
       FROM email_templates_user et 
       LEFT JOIN users u ON et.user_id=u.id 
       WHERE et.audit_status='approved' 
       ORDER BY et.created_at DESC`
    )

    res.json(success({
      system: systemTemplates,
      user: userTemplates.map(t => ({ ...t, type: 'user' }))
    }))
  } catch (err) {
    console.error('获取邮件模板失败:', err)
    res.json(error('获取邮件模板失败'))
  }
})

router.post('/email-templates', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json(error('请上传Word文档'))
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase()
    if (!['.doc', '.docx'].includes(ext)) {
      if (req.file.path) fs.unlinkSync(req.file.path)
      return res.json(error('仅支持上传Word文档（.doc/.docx）'))
    }

    const { name, desc } = req.body
    const result = await db.query(
      'INSERT INTO email_templates_user (user_id, name, `desc`, file_name, file_path, file_size) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, name || req.file.originalname, desc || '', req.file.originalname || 'document.docx', '/uploads/' + req.file.filename, req.file.size]
    )
    res.json(success({ id: result.insertId }, '上传成功，等待管理员审批'))
  } catch (err) {
    console.error('上传邮件模板失败:', err)
    res.json(error('上传失败'))
  }
})

router.delete('/email-templates/:id', auth, async (req, res) => {
  try {
    const template = await db.query('SELECT * FROM email_templates_user WHERE id=?', [req.params.id])
    if (template.length === 0) {
      return res.json(error('模板不存在'))
    }

    if (req.user.role !== 'admin' && template[0].user_id !== req.user.id) {
      return res.json(error('无权删除'))
    }

    const filePath = path.join(__dirname, '..', template[0].file_path)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await db.query('DELETE FROM email_templates_user WHERE id=?', [req.params.id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('删除邮件模板失败:', err)
    res.json(error('删除失败'))
  }
})

router.get('/email-templates/:id/download', auth, async (req, res) => {
  try {
    const template = await db.query('SELECT * FROM email_templates_user WHERE id=?', [req.params.id])
    if (template.length === 0) {
      return res.json(error('模板不存在'))
    }

    if (template[0].audit_status !== 'approved') {
      return res.json(error('模板未通过审核'))
    }

    await db.query('UPDATE email_templates_user SET download_count=download_count+1 WHERE id=?', [req.params.id])

    const filePath = path.join(__dirname, '..', template[0].file_path)
    if (!fs.existsSync(filePath)) {
      return res.json(error('文件不存在'))
    }

    res.download(filePath, template[0].file_name)
  } catch (err) {
    console.error('下载邮件模板失败:', err)
    res.json(error('下载失败'))
  }
})

module.exports = router

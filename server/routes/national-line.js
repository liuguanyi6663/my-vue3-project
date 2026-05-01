const express = require('express')
const router = express.Router()
const https = require('https')
const db = require('../utils/db')
const { success, error, pageSuccess } = require('../utils/response')
const { adminAuth } = require('../middleware/auth')

const CRAWL_URLS = {
  2026: ['https://yz.chsi.com.cn/kyzx/kp/202602/20260228/2293449093.html'],
  2025: ['https://yz.chsi.com.cn/kyzx/kp/202502/20250224/2293352975.html'],
  2024: ['https://yz.chsi.com.cn/kyzx/kp/202403/20240312/2293269492.html'],
  2023: [
    'https://yz.chsi.com.cn/kyzx/kp/202303/20230310/2265487759.html',
    'https://yz.chsi.com.cn/kyzx/kp/202303/20230310/2265487779.html'
  ],
  2022: [
    'https://yz.chsi.com.cn/kyzx/kp/202203/20220311/2172246782.html',
    'https://yz.chsi.com.cn/kyzx/kp/202203/20220311/2172246781.html'
  ]
}

const discoverUrls = async (year) => {
  const currentYear = new Date().getFullYear()
  const discovered = {}

  for (let y = currentYear + 1; y >= 2021; y--) {
    const lnfsxUrl = `https://yz.chsi.com.cn/kyzx/zt/lnfsx${y}.shtml`
    try {
      const html = await fetchPage(lnfsxUrl)
      if (!html || (html.includes('404') && html.includes('出错了') && html.length < 5000)) continue

      const yearListMatch = html.match(/var yearList\s*=\s*\[([\s\S]*?)\];/)
      if (!yearListMatch) continue

      const items = yearListMatch[1].match(/\{[^}]+\}/g)
      if (!items) continue

      for (const item of items) {
        const ym = item.match(/year:\s*'(\d+)'/)
        const um = item.match(/url:\s*'([^']+)'/)
        if (!ym || !um) continue

        const itemYear = parseInt(ym[1])
        const kydtUrl = um[1]

        try {
          const kydtHtml = await fetchPage(kydtUrl)
          if (!kydtHtml) continue

          const kpLinks = []
          const re = /href="((?:https?:\/\/yz\.chsi\.com\.cn)?\/kyzx\/kp\/[^"]+\.html)"/g
          let m
          while ((m = re.exec(kydtHtml)) !== null) {
            const fullUrl = m[1].startsWith('http') ? m[1] : 'https://yz.chsi.com.cn' + m[1]
            if (!kpLinks.includes(fullUrl)) kpLinks.push(fullUrl)
          }

          if (kpLinks.length > 0) {
            discovered[itemYear] = kpLinks
          } else {
            const bodyText = kydtHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
            if (bodyText.includes('学科门类') && (bodyText.includes('专业学位类别') || bodyText.includes('专业学位名称'))) {
              discovered[itemYear] = [kydtUrl]
            }
          }
        } catch (e) {
          console.log(`  discoverUrls: 访问快讯页失败 ${kydtUrl}: ${e.message}`)
        }
      }
      break
    } catch (e) {
      continue
    }
  }

  return discovered
}

const fetchPage = (url) => {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'identity',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 15000
    }
    const req = https.get(url, options, (resp) => {
      if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
        const redirectUrl = resp.headers.location.startsWith('http') ? resp.headers.location : new URL(resp.headers.location, url).href
        return fetchPage(redirectUrl).then(resolve).catch(reject)
      }
      let data = ''
      resp.setEncoding('utf-8')
      resp.on('data', chunk => data += chunk)
      resp.on('end', () => resolve(data))
      resp.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')) })
  })
}

const PROFESSIONAL_SHARED = {
  '经济学': ['金融', '应用统计', '税务', '国际商务', '保险', '资产评估'],
  '法学': ['法律', '社会工作', '警务'],
  '文学': ['翻译', '新闻与传播', '出版'],
  '历史学': ['文物与博物馆'],
  '工学': ['建筑学', '城市规划', '电子信息', '机械', '材料与化工', '资源与环境', '能源动力', '土木水利', '生物与医药', '交通运输'],
  '农学': ['农业', '兽医', '风景园林', '林业'],
  '医学': ['临床医学', '口腔医学', '公共卫生', '护理', '药学', '中药学'],
  '军事学': ['军事'],
  '艺术学': ['艺术']
}

const is300Subject = (subject) => ['教育学', '历史学', '医学', '体育学', '应用心理', '体育', '临床医学', '口腔医学', '公共卫生', '护理', '药学', '中药学', '中医', '中医类照顾专业', '针灸'].includes(subject)
const isMbaSubject = (subject) => ['工商管理', '旅游管理', '公共管理', '工程管理'].includes(subject)

const makeRows = (subject, category, year, aTotal, aSmall, aBig, bTotal, bSmall, bBig) => {
  const rows = []
  if (isMbaSubject(subject)) {
    rows.push({ year, region: 'A', category, subject_type: subject, total_score: aTotal, politics_score: aSmall, foreign_score: aSmall, subject1_score: aBig, subject2_score: 0 })
    rows.push({ year, region: 'B', category, subject_type: subject, total_score: bTotal, politics_score: bSmall, foreign_score: bSmall, subject1_score: bBig, subject2_score: 0 })
  } else if (is300Subject(subject)) {
    rows.push({ year, region: 'A', category, subject_type: subject, total_score: aTotal, politics_score: aSmall, foreign_score: aSmall, subject1_score: aBig, subject2_score: 0 })
    rows.push({ year, region: 'B', category, subject_type: subject, total_score: bTotal, politics_score: bSmall, foreign_score: bSmall, subject1_score: bBig, subject2_score: 0 })
  } else {
    rows.push({ year, region: 'A', category, subject_type: subject, total_score: aTotal, politics_score: aSmall, foreign_score: aSmall, subject1_score: aBig, subject2_score: aBig })
    rows.push({ year, region: 'B', category, subject_type: subject, total_score: bTotal, politics_score: bSmall, foreign_score: bSmall, subject1_score: bBig, subject2_score: bBig })
  }
  return rows
}

const extractFromMatch = (match, subject, category, year) => {
  if (!match) return null
  return makeRows(subject, category, year, parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseInt(match[4]), parseInt(match[5]), parseInt(match[6]))
}

const parseNewFormat = (text, year) => {
  const results = []

  const simpleAcademic = [
    { subject: '哲学', code: '01' },
    { subject: '经济学', code: '02' },
    { subject: '法学', code: '03' },
    { subject: '文学', code: '05' },
    { subject: '历史学', code: '06' },
    { subject: '理学', code: '07' },
    { subject: '农学', code: '09' },
    { subject: '军事学', code: '11' },
    { subject: '艺术学', code: '13' },
    { subject: '交叉学科', code: '14' }
  ]

  const subEntryAcademic = [
    { subject: '教育学', code: '04' },
    { subject: '工学', code: '08' },
    { subject: '医学', code: '10' },
    { subject: '管理学', code: '12' }
  ]

  const specialAcademic = [
    { subject: '体育学', re: /体育学\[0403\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '工学照顾专业', re: /工学照顾专业.*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '中医类照顾专业', re: /中医学\[1005\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ }
  ]

  const professionalWithCode = [
    { subject: '体育', re: /体育\[0452\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '教育', re: /教育\[0451\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '国际中文教育', re: /国际中文教育\[0453\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '汉语国际教育', re: /汉语国际教育\[0453\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '中医', re: /中医\[1057\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '针灸', re: /针灸\[1059\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '工商管理', re: /工商管理\[1251\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '旅游管理', re: /旅游管理\[1254\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '公共管理', re: /公共管理\[1252\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '会计', re: /会计\[1253\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '审计', re: /审计\[1257\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '图书情报', re: /图书情报\[1255\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '工程管理', re: /工程管理\[1256\].*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ }
  ]

  const extractBlock = (subject, code) => {
    const startRe = new RegExp(subject + '\\[' + code + '\\]')
    const startMatch = startRe.exec(text)
    if (!startMatch) return null
    const startIdx = startMatch.index
    const nextBlock = text.substring(startIdx + startMatch[0].length).match(/[^\d]\[\d{2}\]/)
    const endIdx = nextBlock ? startIdx + startMatch[0].length + nextBlock.index + 1 : text.length
    return text.substring(startIdx, endIdx)
  }

  for (const cat of simpleAcademic) {
    const block = extractBlock(cat.subject, cat.code)
    if (block) {
      const match = block.match(/各学科专业.*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/)
      if (match) {
        const [_, aTotal, aSmall, aBig, bTotal, bSmall, bBig] = match.map(Number)
        results.push(...makeRows(cat.subject, 'academic', year, aTotal, aSmall, aBig, bTotal, bSmall, bBig))

        if (PROFESSIONAL_SHARED[cat.subject]) {
          for (const profSubject of PROFESSIONAL_SHARED[cat.subject]) {
            results.push(...makeRows(profSubject, 'professional', year, aTotal, aSmall, aBig, bTotal, bSmall, bBig))
          }
        }
      }
    }
  }

  for (const cat of subEntryAcademic) {
    const block = extractBlock(cat.subject, cat.code)
    if (block) {
      let match = block.match(/其他学科专业.*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/)
      if (!match) {
        match = block.match(/各学科专业.*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/)
      }
      if (match) {
        const [_, aTotal, aSmall, aBig, bTotal, bSmall, bBig] = match.map(Number)
        results.push(...makeRows(cat.subject, 'academic', year, aTotal, aSmall, aBig, bTotal, bSmall, bBig))

        if (PROFESSIONAL_SHARED[cat.subject]) {
          for (const profSubject of PROFESSIONAL_SHARED[cat.subject]) {
            results.push(...makeRows(profSubject, 'professional', year, aTotal, aSmall, aBig, bTotal, bSmall, bBig))
          }
        }
      }
    }
  }

  for (const p of specialAcademic) {
    const match = text.match(p.re)
    if (match) {
      const [_, aTotal, aSmall, aBig, bTotal, bSmall, bBig] = match.map(Number)
      results.push(...makeRows(p.subject, 'academic', year, aTotal, aSmall, aBig, bTotal, bSmall, bBig))
    } else if (p.subject === '中医类照顾专业') {
      const medBlock = extractBlock('医学', '10')
      if (medBlock) {
        const medMatch = medBlock.match(/各学科专业.*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/)
        if (medMatch) {
          const [_, aTotal, aSmall, aBig, bTotal, bSmall, bBig] = medMatch.map(Number)
          results.push(...makeRows('中医类照顾专业', 'academic', year, aTotal, aSmall, aBig, bTotal, bSmall, bBig))
        }
      }
    }
  }

  for (const p of professionalWithCode) {
    const match = text.match(p.re)
    if (match) {
      const [_, aTotal, aSmall, aBig, bTotal, bSmall, bBig] = match.map(Number)
      results.push(...makeRows(p.subject, 'professional', year, aTotal, aSmall, aBig, bTotal, bSmall, bBig))
    }
  }

  return results
}

const cleanText = (text) => {
  return text
    .replace(/[（(][^)）]*[)）]/g, '')
    .replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, '')
}

const parseOldFormat = (text, year, pageType) => {
  const results = []
  const category = pageType
  text = cleanText(text)

  const academicSubjects = [
    { subject: '哲学', re: /哲学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '经济学', re: /经济学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '法学', re: /法学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '教育学', re: /教育学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '文学', re: /文学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '历史学', re: /历史学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '理学', re: /理学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '工学', re: /工学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '农学', re: /农学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '医学', re: /医学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '军事学', re: /军事学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '管理学', re: /管理学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '艺术学', re: /艺术学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '交叉学科', re: /交叉学科[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '体育学', re: /体育学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '工学照顾专业', re: /工学照顾专业[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '中医类照顾专业', re: /中医类照顾专业[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ }
  ]

  const professionalSubjects = [
    { subject: '金融', re: /金融[、，][^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '审计', re: /审计[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '法律', re: /法律[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '社会工作', re: /社会工作[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '教育', re: /教育[、，][^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '体育', re: /体育[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '汉语国际教育', re: /汉语国际教育[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '应用心理', re: /应用心理[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '翻译', re: /翻译[、，][^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '新闻与传播', re: /新闻与传播[、，][^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '出版', re: /出版[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '文物与博物馆', re: /文物与博物馆[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '建筑学', re: /建筑学[、，][^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '电子信息', re: /电子信息[、，][^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '农业', re: /农业[、，][^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '临床医学', re: /临床医学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '口腔医学', re: /口腔医学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '公共卫生', re: /公共卫生[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '护理', re: /护理[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '药学', re: /药学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '中药学', re: /中药学[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '中医', re: /中医[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '军事', re: /军事[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '工商管理', re: /工商管理[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '公共管理', re: /公共管理[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '会计', re: /会计[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '旅游管理', re: /旅游管理[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '图书情报', re: /图书情报[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '工程管理', re: /工程管理[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ },
    { subject: '艺术', re: /艺术[^\d]*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/ }
  ]

  const patterns = category === 'academic' ? academicSubjects : professionalSubjects

  for (const p of patterns) {
    const match = text.match(p.re)
    const rows = extractFromMatch(match, p.subject, category, year)
    if (rows) results.push(...rows)
  }

  return results
}

const detectPageType = (html) => {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const titleText = title ? title[1] : ''
  const bodyText = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')

  if (titleText.includes('专业学位') || bodyText.includes('专业学位名称')) {
    return 'professional'
  }
  if (titleText.includes('学术学位') || bodyText.includes('学科门类(专业)名称') || bodyText.includes('学科门类一级学科')) {
    return 'academic'
  }
  if (bodyText.includes('学科门类') && bodyText.includes('专业学位类别')) {
    return 'combined'
  }
  return 'academic'
}

const parseNationalLine = (html, year) => {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
  const pageType = detectPageType(html)

  if (pageType === 'combined') {
    return parseNewFormat(text, year)
  }

  return parseOldFormat(text, year, pageType)
}

router.post('/admin/crawl', adminAuth, async (req, res) => {
  try {
    const { year, url } = req.body
    const targetYear = parseInt(year)

    if (!targetYear) {
      return res.json(error('请指定年份'))
    }

    let urls = []
    if (url && url.trim()) {
      urls = [url.trim()]
    } else {
      console.log(`🔍 自动发现 ${targetYear} 年国家线URL...`)
      try {
        const discovered = await discoverUrls(targetYear)
        if (discovered[targetYear] && discovered[targetYear].length > 0) {
          urls = discovered[targetYear]
          console.log(`  ✅ 自动发现 ${targetYear} 年URL: ${urls.join(', ')}`)
        }
      } catch (e) {
        console.log(`  ⚠️ 自动发现失败: ${e.message}`)
      }

      if (urls.length === 0 && CRAWL_URLS[targetYear]) {
        urls = CRAWL_URLS[targetYear]
        console.log(`  📋 使用预设URL: ${urls.join(', ')}`)
      }
    }

    if (urls.length === 0) {
      return res.json(error('未找到该年份的爬取地址，请手动输入学信网国家线页面URL'))
    }

    console.log(`🕷️ 开始爬取 ${targetYear} 年国家线数据，共 ${urls.length} 个页面`)

    let allParsed = []
    const crawledUrls = []

    for (const crawlUrl of urls) {
      try {
        console.log(`  📄 爬取: ${crawlUrl}`)
        const html = await fetchPage(crawlUrl)
        if (!html || html.length < 100) {
          console.log(`  ⚠️ 页面内容为空或过短: ${crawlUrl}`)
          continue
        }

        if (html.includes('404') && html.includes('出错了')) {
          console.log(`  ⚠️ 页面不存在(404): ${crawlUrl}`)
          continue
        }

        const parsed = parseNationalLine(html, targetYear)
        console.log(`  ✅ 解析出 ${parsed.length} 条数据`)
        allParsed.push(...parsed)
        crawledUrls.push(crawlUrl)
      } catch (e) {
        console.log(`  ❌ 爬取失败: ${crawlUrl} - ${e.message}`)
      }
    }

    const seen = new Set()
    allParsed = allParsed.filter(r => {
      const key = `${r.year}-${r.region}-${r.category}-${r.subject_type}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (allParsed.length === 0) {
      return res.json(error('未能从页面中解析出国家线数据，页面格式可能已变化'))
    }

    let inserted = 0
    let updated = 0

    for (const item of allParsed) {
      const existing = await db.query(
        'SELECT id FROM national_lines WHERE year=? AND region=? AND category=? AND subject_type=?',
        [item.year, item.region, item.category, item.subject_type]
      )

      if (existing.length > 0) {
        await db.query(
          'UPDATE national_lines SET total_score=?, politics_score=?, foreign_score=?, subject1_score=?, subject2_score=? WHERE id=?',
          [item.total_score, item.politics_score, item.foreign_score, item.subject1_score, item.subject2_score, existing[0].id]
        )
        updated++
      } else {
        await db.query(
          'INSERT INTO national_lines (year, region, category, subject_type, total_score, politics_score, foreign_score, subject1_score, subject2_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [item.year, item.region, item.category, item.subject_type, item.total_score, item.politics_score, item.foreign_score, item.subject1_score, item.subject2_score]
        )
        inserted++
      }
    }

    console.log(`✅ 爬取完成: 新增 ${inserted} 条, 更新 ${updated} 条`)

    res.json(success({
      year: targetYear,
      urls: crawledUrls,
      total: allParsed.length,
      inserted,
      updated,
      items: allParsed
    }, `爬取完成：共 ${allParsed.length} 条，新增 ${inserted} 条，更新 ${updated} 条`))
  } catch (err) {
    console.error('爬取国家线数据失败:', err)
    res.json(error('爬取失败: ' + err.message))
  }
})

router.get('/admin/crawl-urls', adminAuth, async (req, res) => {
  try {
    const discovered = await discoverUrls()
    const merged = { ...CRAWL_URLS }
    for (const [year, urls] of Object.entries(discovered)) {
      if (!merged[year]) merged[year] = urls
    }
    res.json(success({ preset: CRAWL_URLS, discovered, merged }))
  } catch (e) {
    res.json(success({ preset: CRAWL_URLS, discovered: {}, merged: CRAWL_URLS }))
  }
})

router.get('/list', async (req, res) => {
  try {
    const { year, region, category } = req.query

    const systemYear = new Date().getFullYear()
    const years = await db.query('SELECT DISTINCT year FROM national_lines ORDER BY year DESC LIMIT 4')
    const targetYear = parseInt(year) || systemYear

    let yearList = years.map(y => y.year)
    if (!yearList.includes(targetYear)) {
      yearList.unshift(targetYear)
    }
    yearList = yearList.slice(0, 4)

    let sql = 'SELECT * FROM national_lines WHERE year=?'
    const params = [targetYear]

    if (region) {
      sql += ' AND region=?'
      params.push(region)
    }
    if (category) {
      sql += ' AND category=?'
      params.push(category)
    }

    sql += ' ORDER BY region ASC, category ASC, subject_type ASC'

    const list = await db.query(sql, params)

    const grouped = { academic: { A: [], B: [] }, professional: { A: [], B: [] } }
    for (const item of list) {
      if (grouped[item.category] && grouped[item.category][item.region]) {
        grouped[item.category][item.region].push(item)
      }
    }

    res.json(success({
      years: yearList,
      currentYear: targetYear,
      data: grouped
    }))
  } catch (err) {
    console.error('获取国家线数据失败:', err)
    res.json(error('获取国家线数据失败'))
  }
})

router.get('/years', async (req, res) => {
  try {
    const years = await db.query('SELECT DISTINCT year FROM national_lines ORDER BY year DESC LIMIT 4')
    res.json(success(years.map(y => y.year)))
  } catch (err) {
    res.json(error('获取年份列表失败'))
  }
})

router.get('/admin/list', adminAuth, async (req, res) => {
  try {
    const { year, region, category, page = 1, pageSize = 20 } = req.query
    const pageNum = parseInt(page) || 1
    const size = parseInt(pageSize) || 20
    const offset = (pageNum - 1) * size

    let sql = 'SELECT * FROM national_lines WHERE 1=1'
    const params = []

    if (year) {
      sql += ' AND year=?'
      params.push(year)
    }
    if (region) {
      sql += ' AND region=?'
      params.push(region)
    }
    if (category) {
      sql += ' AND category=?'
      params.push(category)
    }

    let countSql = 'SELECT COUNT(*) as total FROM national_lines WHERE 1=1'
    const countParams = []

    if (year) {
      countSql += ' AND year=?'
      countParams.push(year)
    }
    if (region) {
      countSql += ' AND region=?'
      countParams.push(region)
    }
    if (category) {
      countSql += ' AND category=?'
      countParams.push(category)
    }

    sql += ' ORDER BY year DESC, region ASC, category ASC, subject_type ASC LIMIT ? OFFSET ?'
    params.push(size, offset)

    const list = await db.query(sql, params)
    const totalResult = await db.query(countSql, countParams)

    res.json(pageSuccess(list, totalResult[0].total, pageNum, size))
  } catch (err) {
    console.error('获取国家线列表失败:', err)
    res.json(error('获取国家线列表失败'))
  }
})

router.post('/admin/add', adminAuth, async (req, res) => {
  try {
    const { year, region, category, subject_type, total_score, politics_score, foreign_score, subject1_score, subject2_score } = req.body

    if (!year || !region || !category || !subject_type || total_score === undefined) {
      return res.json(error('请填写必要字段'))
    }

    const existing = await db.query(
      'SELECT id FROM national_lines WHERE year=? AND region=? AND category=? AND subject_type=?',
      [year, region, category, subject_type]
    )

    if (existing.length > 0) {
      return res.json(error('该年份、区域、类别、学科门类的数据已存在'))
    }

    await db.query(
      'INSERT INTO national_lines (year, region, category, subject_type, total_score, politics_score, foreign_score, subject1_score, subject2_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [year, region, category, subject_type, total_score, politics_score || null, foreign_score || null, subject1_score || null, subject2_score || null]
    )

    res.json(success(null, '添加成功'))
  } catch (err) {
    console.error('添加国家线数据失败:', err)
    res.json(error('添加失败'))
  }
})

router.put('/admin/update/:id', adminAuth, async (req, res) => {
  try {
    const allowedFields = ['year', 'region', 'category', 'subject_type', 'total_score', 'politics_score', 'foreign_score', 'subject1_score', 'subject2_score']
    const fields = []
    const values = []

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        fields.push(`${key}=?`)
        values.push(req.body[key])
      }
    }

    if (fields.length === 0) return res.json(error('没有需要更新的字段'))

    values.push(req.params.id)
    await db.query(`UPDATE national_lines SET ${fields.join(',')} WHERE id=?`, values)
    res.json(success(null, '更新成功'))
  } catch (err) {
    console.error('更新国家线数据失败:', err)
    res.json(error('更新失败'))
  }
})

router.delete('/admin/delete/:id', adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM national_lines WHERE id=?', [req.params.id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('删除国家线数据失败:', err)
    res.json(error('删除失败'))
  }
})

router.post('/admin/batch', adminAuth, async (req, res) => {
  try {
    const { year, region, category, items } = req.body

    if (!year || !region || !category || !items || !items.length) {
      return res.json(error('请填写必要字段'))
    }

    for (const item of items) {
      const existing = await db.query(
        'SELECT id FROM national_lines WHERE year=? AND region=? AND category=? AND subject_type=?',
        [year, region, category, item.subject_type]
      )

      if (existing.length > 0) {
        await db.query(
          'UPDATE national_lines SET total_score=?, politics_score=?, foreign_score=?, subject1_score=?, subject2_score=? WHERE id=?',
          [item.total_score, item.politics_score || null, item.foreign_score || null, item.subject1_score || null, item.subject2_score || null, existing[0].id]
        )
      } else {
        await db.query(
          'INSERT INTO national_lines (year, region, category, subject_type, total_score, politics_score, foreign_score, subject1_score, subject2_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [year, region, category, item.subject_type, item.total_score, item.politics_score || null, item.foreign_score || null, item.subject1_score || null, item.subject2_score || null]
        )
      }
    }

    res.json(success(null, '批量保存成功'))
  } catch (err) {
    console.error('批量保存国家线数据失败:', err)
    res.json(error('批量保存失败'))
  }
})

router.delete('/admin/batch-by-year/:year', adminAuth, async (req, res) => {
  try {
    const { region, category } = req.query
    let sql = 'DELETE FROM national_lines WHERE year=?'
    const params = [req.params.year]

    if (region) {
      sql += ' AND region=?'
      params.push(region)
    }
    if (category) {
      sql += ' AND category=?'
      params.push(category)
    }

    await db.query(sql, params)
    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('批量删除国家线数据失败:', err)
    res.json(error('删除失败'))
  }
})

module.exports = router

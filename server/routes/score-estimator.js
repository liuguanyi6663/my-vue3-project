const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const { success, error } = require('../utils/response')
const { auth } = require('../middleware/auth')

router.get('/options', async (req, res) => {
  try {
    const years = await db.query('SELECT DISTINCT year FROM national_lines ORDER BY year DESC')
    const subjectTypes = await db.query('SELECT DISTINCT subject_type FROM national_lines ORDER BY subject_type')

    let studentStats = null
    try {
      const stats = await db.query(
        `SELECT target_school, target_major, is_admitted,
                AVG(politics_score) as avg_politics,
                AVG(english_score) as avg_english,
                AVG(math_score) as avg_math,
                AVG(professional_score) as avg_professional,
                COUNT(*) as total_count
         FROM student_kaoyan_records
         WHERE status='approved' AND is_admitted=1
         GROUP BY target_school, target_major
         HAVING total_count >= 2
         ORDER BY total_count DESC
         LIMIT 50`
      )
      studentStats = stats
    } catch (e) {
      console.log('学生数据暂不可用')
    }

    res.json(success({
      years: years.map(y => y.year),
      subjectTypes: subjectTypes.map(s => s.subject_type),
      studentStats: studentStats || []
    }))
  } catch (err) {
    console.error(err)
    res.json(error('获取选项失败'))
  }
})

router.post('/estimate', async (req, res) => {
  try {
    const {
      year, region, category, subject_type,
      politics_score, english_score, subject1_score, subject2_score
    } = req.body

    if (!year || !region || !category || !subject_type) {
      return res.json(error('请选择完整的考试信息'))
    }

    const scores = [politics_score, english_score, subject1_score, subject2_score].filter(s => s !== null && s !== undefined && s !== '')
    if (scores.length === 0) {
      return res.json(error('请至少输入一科成绩'))
    }

    const nationalLine = await db.query(
      `SELECT * FROM national_lines WHERE year=? AND region=? AND category=? AND subject_type=?`,
      [year, region, category, subject_type]
    )

    if (!nationalLine || nationalLine.length === 0) {
      return res.json(error('暂无该年份的国家线数据'))
    }

    const line = nationalLine[0]
    const myTotal = (parseFloat(politics_score) || 0) + (parseFloat(english_score) || 0) + (parseFloat(subject1_score) || 0) + (parseFloat(subject2_score) || 0)

    const subjectResults = []
    const checkSubject = (name, myScore, lineScore) => {
      if (myScore === null || myScore === undefined || myScore === '') return null
      const mine = parseFloat(myScore)
      const target = parseFloat(lineScore)
      if (target === 0) return null
      const diff = mine - target
      const passed = diff >= 0
      let level
      if (diff >= 15) level = 'safe'
      else if (diff >= 5) level = 'good'
      else if (diff >= 0) level = 'edge'
      else if (diff >= -5) level = 'close'
      else level = 'danger'

      return { name, myScore: mine, lineScore: target, diff, passed, level }
    }

    const pResult = checkSubject('政治', politics_score, line.politics_score)
    if (pResult) subjectResults.push(pResult)

    const eResult = checkSubject('外语', english_score, line.foreign_score)
    if (eResult) subjectResults.push(eResult)

    const s1Result = checkSubject('业务课一', subject1_score, line.subject1_score)
    if (s1Result) subjectResults.push(s1Result)

    const s2Result = checkSubject('业务课二', subject2_score, line.subject2_score)
    if (s2Result) subjectResults.push(s2Result)

    const totalDiff = myTotal - line.total_score
    const totalPassed = totalDiff >= 0
    let totalLevel
    if (totalDiff >= 30) totalLevel = 'safe'
    else if (totalDiff >= 15) totalLevel = 'good'
    else if (totalDiff >= 0) totalLevel = 'edge'
    else if (totalDiff >= -10) totalLevel = 'close'
    else totalLevel = 'danger'

    const allPassed = totalPassed && subjectResults.every(s => s === null || s.passed)
    const anyFailed = subjectResults.some(s => s !== null && !s.passed)

    let overallLevel
    if (allPassed && totalLevel === 'safe') overallLevel = 'safe'
    else if (allPassed && totalLevel === 'good') overallLevel = 'good'
    else if (allPassed && totalLevel === 'edge') overallLevel = 'edge'
    else if (totalPassed && anyFailed) overallLevel = 'single_fail'
    else if (!totalPassed && totalLevel === 'close') overallLevel = 'close'
    else overallLevel = 'danger'

    const levelLabels = {
      safe: '稳过国家线',
      good: '较稳妥',
      edge: '擦线过',
      single_fail: '总分过线但单科未过',
      close: '差一点',
      danger: '较危险'
    }

    const levelColors = {
      safe: '#216e39',
      good: '#30a14e',
      edge: '#9be9a8',
      single_fail: '#f0ad4e',
      close: '#f0ad4e',
      danger: '#ff4d4f'
    }

    const suggestions = []
    if (overallLevel === 'safe') {
      suggestions.push('你的成绩远超国家线，可以冲刺更好的院校！')
      suggestions.push('建议关注目标院校的院线，院线通常高于国家线。')
    } else if (overallLevel === 'good') {
      suggestions.push('你的成绩超过国家线较多，过线问题不大。')
      suggestions.push('建议提前准备复试，提升综合竞争力。')
    } else if (overallLevel === 'edge') {
      suggestions.push('你的成绩刚好过线，需要做好调剂准备。')
      suggestions.push('建议同时关注B区院校，增加上岸机会。')
    } else if (overallLevel === 'single_fail') {
      suggestions.push('你的总分过线，但有单科未达标，需注意目标院校是否有破格录取政策。')
      suggestions.push('部分院校允许总分超线较多时单科降分，请关注招生简章。')
    } else if (overallLevel === 'close') {
      suggestions.push('你的成绩距离国家线很近，还有提升空间！')
      suggestions.push('建议重点突破薄弱科目，每科提升几分就能过线。')
    } else {
      suggestions.push('当前成绩距离国家线有一定差距，需要加大复习力度。')
      suggestions.push('建议制定针对性复习计划，优先提升分值高的科目。')
    }

    const failedSubjects = subjectResults.filter(s => s !== null && !s.passed)
    if (failedSubjects.length > 0) {
      suggestions.push(`⚠️ ${failedSubjects.map(s => s.name).join('、')}未达国家线单科要求。`)
    }

    let studentComparison = null
    try {
      const admittedStudents = await db.query(
        `SELECT politics_score, english_score, math_score, professional_score,
                (IFNULL(politics_score,0)+IFNULL(english_score,0)+IFNULL(math_score,0)+IFNULL(professional_score,0)) as total
         FROM student_kaoyan_records
         WHERE status='approved' AND is_admitted=1 AND exam_year=?
         ORDER BY total DESC`,
        [year]
      )

      if (admittedStudents.length >= 3) {
        const totals = admittedStudents.map(s => s.total).sort((a, b) => a - b)
        const avg = totals.reduce((a, b) => a + b, 0) / totals.length
        const median = totals[Math.floor(totals.length / 2)]
        const p25 = totals[Math.floor(totals.length * 0.25)]
        const p75 = totals[Math.floor(totals.length * 0.75)]

        studentComparison = {
          sampleSize: admittedStudents.length,
          avgScore: Math.round(avg),
          medianScore: median,
          p25Score: p25,
          p75Score: p75,
          myRank: totals.filter(t => t <= myTotal).length,
          myPercentile: Math.round((totals.filter(t => t <= myTotal).length / totals.length) * 100)
        }
      }
    } catch (e) {
      console.log('学生对比数据暂不可用')
    }

    res.json(success({
      nationalLine: {
        year: line.year,
        region: line.region,
        category: line.category === 'academic' ? '学术型' : '专业型',
        subjectType: line.subject_type,
        totalScore: line.total_score,
        politicsScore: line.politics_score,
        foreignScore: line.foreign_score,
        subject1Score: line.subject1_score,
        subject2Score: line.subject2_score
      },
      myTotal,
      subjectResults,
      totalResult: { myScore: myTotal, lineScore: line.total_score, diff: totalDiff, passed: totalPassed, level: totalLevel },
      overallLevel,
      overallLabel: levelLabels[overallLevel],
      overallColor: levelColors[overallLevel],
      allPassed,
      suggestions,
      studentComparison
    }))
  } catch (err) {
    console.error(err)
    res.json(error('估算失败'))
  }
})

module.exports = router

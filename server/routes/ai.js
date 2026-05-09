const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const db = require('../utils/db')
const https = require('https')
const http = require('http')

const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_API_BASE_URL = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1'
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo'

const SYSTEM_PROMPT = `你是一个专业的考研助手，服务于校内考研学生。你的职责包括：

1. **考研相关问题解答**：专业院校选择建议、国家线/校线解读、复习规划建议、复试准备指导、调剂信息等
2. **学习辅助**：知识点解析、学习方法建议、时间管理指导
3. **信息提供**：考研政策解读、报名流程说明、考试科目介绍

回答要求：
- 使用友好、鼓励的语气，适当使用emoji增加亲和力
- 回答结构清晰，使用序号或分点说明
- 对于复杂问题，提供详细的步骤和建议
- 如果不确定某个信息，诚实地告知用户并建议查阅官方渠道
- 回答内容以中文为主`

const callAIAPI = (messages) => {
  return new Promise((resolve, reject) => {
    const url = new URL(AI_API_BASE_URL + '/chat/completions')
    const isHttps = url.protocol === 'https:'
    const httpModule = isHttps ? https : http

    const requestBody = JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: 60000
    }

    const req = httpModule.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'AI API error'))
          } else if (parsed.choices && parsed.choices[0]) {
            resolve(parsed.choices[0].message.content)
          } else {
            reject(new Error('AI API returned unexpected response'))
          }
        } catch (e) {
          reject(new Error('Failed to parse AI API response'))
        }
      })
    })

    req.on('error', (e) => {
      reject(new Error(`AI API request failed: ${e.message}`))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('AI API request timeout'))
    })

    req.write(requestBody)
    req.end()
  })
}

const getDefaultResponse = (userMessage, allMessages = []) => {
  const msg = userMessage.trim()
  const lower = msg.toLowerCase()

  const hasKeyword = (...keywords) => keywords.some(k => lower.includes(k))

  if (hasKeyword('你好', 'hi', 'hello', '嗨', '在吗', '早上好', '晚上好', '下午好')) {
    const names = ['同学', '朋友', '小伙伴']
    const name = names[Math.floor(Math.random() * names.length)]
    return `${name}你好呀！👋 我是AI考研助手~\n\n有什么考研相关的问题尽管问我，比如：\n📚 怎么制定复习计划？\n🏫 如何选择目标院校？\n📊 今年国家线预计会涨吗？\n😰 备考焦虑怎么办？\n\n或者随便聊聊也行哦~ 😊`
  }

  if (hasKeyword('谢谢', '感谢', '多谢', 'thank')) {
    const replies = [
      '不客气！😊 还有其他问题随时问我，加油！💪',
      '能帮到你就好~ 考研路上我会一直陪着你！🌟',
      '别客气！有问题随时来问，祝你备考顺利！📚✨'
    ]
    return replies[Math.floor(Math.random() * replies.length)]
  }

  if (hasKeyword('再见', '拜拜', 'bye', '下次', '晚安')) {
    const replies = [
      '再见！加油复习哦，我随时都在~ 👋💪',
      '拜拜~ 记得按时休息，明天继续努力！🌙',
      '好的，下次见！有疑问随时回来找我 😊📚'
    ]
    return replies[Math.floor(Math.random() * replies.length)]
  }

  if (hasKeyword('鼓励', '加油', '打气', '没信心', '坚持不下去', '想放弃')) {
    return `考研这条路确实不容易，但你已经很棒了！💪\n\n给你分享几个坚持的动力：\n\n1. **你已经走了很远了** — 回顾一下自己已经付出的努力，放弃太可惜了\n\n2. **分解小目标** — 不要总看终点，每天完成一个小任务就给自己点个赞 ✅\n\n3. **适当放松** — 累了出去走走、听听音乐，效率比时长更重要 🎵\n\n4. **想象上岸后的自己** — 拿到录取通知书的那一刻，一切都值得！🎓\n\n加油！你一定可以的！🔥`
  }

  if (hasKeyword('焦虑', '压力', '紧张', '失眠', '心态', '崩溃', '烦', '累')) {
    return `备考中感到焦虑和压力是很正常的，我理解你的感受 🫂\n\n**试试这些方法缓解焦虑：**\n\n1. **正视焦虑** — 适度焦虑是动力，完全放松反而不利于备考\n\n2. **呼吸放松法** — 4-7-8呼吸法：吸气4秒→屏住7秒→呼气8秒，重复3次 🧘\n\n3. **运动释放** — 每天30分钟运动，跑步/跳绳/瑜伽都可以 🏃\n\n4. **找人倾诉** — 和朋友、家人或论坛上的研友聊聊\n\n5. **降低期望** — 不用要求自己每天100分，60分也比0分好！\n\n💡 记住：焦虑说明你在乎，在乎说明你会成功！`
  }

  if (hasKeyword('国家线', '分数线', '复试线', 'a区', 'b区', '过线')) {
    return `关于国家线，我来帮你理清楚 📊\n\n**什么是国家线？**\n教育部根据当年考研整体情况划定的最低复试分数线\n\n**A区 vs B区：**\n- A区：北京、上海、江苏等21省市，分数线较高\n- B区：内蒙古、广西、海南等10省区，分数线低10分左右\n\n**影响因素：**\n- 当年报考人数和招生计划\n- 试卷整体难度\n- 各学科门类竞争程度\n\n📌 近3年趋势：工学260-273，文学351-367，教育学341-350\n\n建议参考近3年分数线，给自己定一个高于国家线20-30分的目标！🎯`
  }

  if (hasKeyword('复习', '学习计划', '规划', '备考', '怎么准备', '时间安排', '进度')) {
    if (hasKeyword('英语')) {
      return `考研英语复习建议 🇬🇧\n\n**单词（每天坚持）：**\n- 每天100-200个，用APP或单词书\n- 重点记忆真题高频词，暑假前过2-3轮\n\n**长难句（3-6月）：**\n- 每天分析3-5个长难句\n- 推荐跟唐迟/刘晓艳的课\n\n**真题阅读（6-10月）：**\n- 近20年真题精做，每篇逐句翻译\n- 先做题→对答案→精读→总结出题规律\n\n**作文（10-12月）：**\n- 整理自己的模板框架\n- 背10篇大小作文范文\n- 每周写1-2篇练手\n\n💡 英语重在积累，每天都要碰！`
    }
    if (hasKeyword('数学')) {
      return `考研数学复习建议 📐\n\n**基础阶段（3-6月）：**\n- 选一位老师跟基础课（张宇/汤家凤/武忠祥）\n- 教材例题+课后习题全部做一遍\n\n**强化阶段（7-9月）：**\n- 刷张宇1000题或汤家凤1800题\n- 整理错题本，按题型分类\n\n**真题阶段（10-11月）：**\n- 近15年真题按套卷做，严格计时\n- 每套做完后逐题分析\n\n**冲刺阶段（12月）：**\n- 模拟卷（李林6+4、张宇8+4）\n- 回顾错题本，强化薄弱环节\n\n⚠️ 数学计算量很大，平时一定要动手算！`
    }
    if (hasKeyword('政治')) {
      return `考研政治复习建议 📖\n\n政治不用太早开始，暑假后完全来得及！\n\n**7-9月（基础）：**\n- 听徐涛强化课（有趣不枯燥）\n- 配合肖秀荣精讲精练做笔记\n\n**10-11月（刷题）：**\n- 肖秀荣1000题刷2-3遍\n- 重点记选择题考点\n\n**11-12月（冲刺）：**\n- 肖八选择题吃透\n- 肖四大题全部背诵（必须背！）\n- 可以辅助腿姐/徐涛的背诵资料\n\n💡 选择题是拉分关键，大题大家差不多！`
    }
    if (hasKeyword('专业课')) {
      return `专业课复习建议 📝\n\n专业课分值高、拉分大，一定要重视！\n\n1. **搜集资料** — 找目标院校历年真题、参考书目、学长学姐笔记\n\n2. **通读教材（3-6月）** — 系统过1-2遍教材，建立知识框架\n\n3. **整理笔记（7-9月）** — 按考纲整理重点，形成自己的知识体系\n\n4. **研究真题（10-11月）** — 分析出题风格和重点章节，针对性强化\n\n5. **背诵冲刺（12月）** — 反复背诵重要概念和论述题要点\n\n📌 不同院校专业课差异很大，一定要找到本校直系学长学姐取经！`
    }
    return `制定科学的复习计划非常重要！📝\n\n**推荐分阶段复习法：**\n\n1. **基础阶段（3-6月）**\n   - 数学/专业课：系统过教材\n   - 英语：背单词+长难句\n\n2. **强化阶段（7-9月）**\n   - 刷真题、整理错题\n   - 政治开始看强化课\n\n3. **冲刺阶段（10-12月）**\n   - 全真模拟、查漏补缺\n   - 政治大题集中背诵\n\n💡 可以用本小程序的「今日计划」功能管理每日任务！\n\n需要哪个科目的具体建议？英语/数学/政治/专业课？`
  }

  if (hasKeyword('院校', '学校', '择校', '选学校', '报考', '目标')) {
    if (hasKeyword('985') || hasKeyword('211') || hasKeyword('双一流')) {
      return `如果你目标是985/211院校，建议这样评估 🏛️\n\n**985院校特点：**\n- 39所，保研比例高（部分达50%+）\n- 复试更看重科研经历和综合素质\n- 专业课难度通常更大\n\n**211院校特点：**\n- 112所（含985），选择范围更广\n- 部分211专业实力不输985\n- 竞争程度因专业差异很大\n\n**双一流建设学科：**\n- 一些双非院校的一流学科性价比很高\n- 比如南京信息工程大学的大气科学等\n\n📌 建议：不要只看学校名气，专业排名和导师资源同样重要！`
    }
    return `选择目标院校是考研第一步，也是最关键的一步 🎯\n\n**你需要考虑的维度：**\n\n1. **自身实力** — 本科院校、成绩排名、学习能力\n2. **专业匹配** — 是否跨考、专业课难度\n3. **地域偏好** — A区/B区、未来就业城市\n4. **数据参考** — 报录比、复试线、录取人数\n\n**择校策略：**\n- 🚀 冲刺：1-2所理想院校\n- 🎯 匹配：2-3所实力相当\n- 🛡️ 保底：1-2所有把握的\n\n可以去本小程序的「考研数据」功能查看往届数据~`
  }

  if (hasKeyword('复试', '面试', '口语')) {
    return `复试是上岸的最后一关！🎤\n\n**复试一般流程：**\n\n1. **专业课笔试**（部分院校）— 复习初试内容+关注前沿\n\n2. **综合面试**\n   - 自我介绍（中英文双版本）\n   - 专业问题问答\n   - 科研/毕设经历介绍\n   - 你为什么选择我们学校/专业\n\n3. **英语测试** — 听力+口语，准备专业英语词汇\n\n**加分技巧：**\n- 提前了解导师研究方向\n- 准备多份简历（5份+）\n- 模拟面试3次以上\n- 穿着得体、态度诚恳\n\n🎯 本小程序有「复试工具箱」，口语题库、简历模板、邮件模板都齐了！`
  }

  if (hasKeyword('调剂')) {
    return `关于考研调剂 📋\n\n**调剂条件：**\n1. 过了国家线（B区也算）\n2. 调入专业与报考专业相近\n3. 符合调入院校的具体要求\n\n**调剂流程：**\n1. 各院校发布调剂公告 → 提前关注\n2. 研招网系统开放 → 填报志愿\n3. 接收复试通知 → 参加复试\n4. 确认录取\n\n**提高成功率：**\n- 📋 提前列好10-20所备选院校\n- 📞 主动联系招生办\n- 📄 准备好简历和自荐信\n- 🏫 B区院校也是不错的选择\n\n⚠️ 调剂系统一般3月下旬开放，千万别错过！`
  }

  if (hasKeyword('跨考', '跨专业')) {
    return `关于跨考，这些你需要知道 📝\n\n**跨考的挑战：**\n- 专业课从零开始，需要投入更多时间\n- 复试时部分老师可能更倾向本专业学生\n\n**跨考的优势：**\n- 复合型背景在未来就业中有独特优势\n- 跨考到热门专业实现职业转型\n\n**建议：**\n1. 尽早开始专业课学习，最好提前1年\n2. 找到目标院校的直系跨考学长学姐\n3. 复试时突出跨专业的独特视角\n4. 可以提前联系导师说明你的情况和决心\n\n💪 每年都有大量跨考生成功上岸，你也可以！`
  }

  if (hasKeyword('专硕', '学硕', '专业硕士', '学术硕士')) {
    return `专硕 vs 学硕怎么选？🤔\n\n**学硕（学术型）：**\n- 偏向学术研究，适合想读博的同学\n- 一般考数一/英一，难度更大\n- 学费较低（8000/年左右）\n- 学制3年\n\n**专硕（专业型）：**\n- 偏向实践应用，适合直接就业\n- 多数考数二/英二，难度稍低\n- 学费较高（1-5万/年不等）\n- 学制2-3年\n\n📌 现在专硕的社会认可度已经很高了，选哪个主要看你的职业规划！`
  }

  if (hasKeyword('二战', '再考', '又考')) {
    return `关于二战考研 🎯\n\n首先，能做出二战的决定本身就需要巨大的勇气，你真的很棒！\n\n**二战的优势：**\n- 已经有了一年的基础和经验\n- 更清楚自己的薄弱环节\n- 心态可能更成熟\n\n**需要注意：**\n1. 认真分析一战失败原因（是知识问题还是策略问题？）\n2. 不要盲目自信，保持空杯心态重新学\n3. 合理安排时间，避免疲劳战\n4. 经济上有压力可以先找个轻松的工作边工作边备考\n\n💪 很多名校研究生都是二战甚至三战上岸的！`
  }

  if (hasKeyword('真题', '模拟', '刷题')) {
    return `关于刷真题的方法 🎯\n\n**真题使用的三个阶段：**\n\n1. **初期（了解题型）** — 做2-3套了解考试风格\n\n2. **中期（专项训练）** — 按题型/章节分类练习\n\n3. **后期（全真模拟）** — 严格按考试时间做套卷\n\n**刷题小贴士：**\n- 📝 先做题再对答案，不要边看答案边做\n- 📊 每套卷子记录分数和用时，追踪进步\n- 📖 错题一定要弄懂，比多做一套更有价值\n- 🔄 近5年真题至少刷2-3遍\n\n💡 质量 > 数量，吃透一套比刷十套有效！`
  }

  if (hasKeyword('导师', '选导师', '联系')) {
    return `关于联系导师的建议 👨‍🏫\n\n**什么时候联系？**\n- 初试成绩出来后，确定能进复试再联系\n- 不要过早联系，老师记不住\n\n**怎么联系？**\n- 📧 发邮件最合适（不要直接打电话）\n- 📄 附上简历+本科成绩单\n- ✍️ 简要介绍自己和对研究方向的理解\n- 🤝 表达真诚的求学意愿\n\n**邮件模板要点：**\n- 标题规范：XXX专业考研学生自荐-XXX\n- 正文简洁：300-500字即可\n- 不要群发，每个老师要个性化\n\n📌 本小程序「复试工具箱」有邮件模板可以参考！`
  }

  if (hasKeyword('就业', '工作', '出路', '前景')) {
    return `考研后的就业前景 📈\n\n总体来看，研究生学历在就业市场上仍然有明显优势：\n\n**薪资水平：**\n- 研究生起薪平均比本科高30%-50%\n- 部分专业（计算机、金融）差距更大\n\n**就业方向：**\n- 高校/科研院所（需要博士居多）\n- 大型国企/央企（学历门槛高）\n- 互联网/金融等高薪行业\n- 公务员/选调生（研究生定级更高）\n\n📌 但也要注意：读研不是逃避就业，3年后就业市场也会变化，选好专业方向很重要！`
  }

  if (hasKeyword('报名', '报名时间', '现场确认', '准考证', '初试时间')) {
    return `考研重要时间节点 📅\n\n- **9月中旬**：考研大纲发布\n- **9月下旬**：预报名（应届生）\n- **10月上旬-下旬**：正式报名\n- **11月上旬**：网上确认/现场确认\n- **12月中旬**：打印准考证\n- **12月倒数第二个周末**：初试考试！\n\n📌 记得提前准备好证件照（白底）、学历证书等材料哦！`
  }

  if (hasKeyword('报录比', '录取', '招生', '招多少人')) {
    return `关于报录比，你需要知道 📊\n\n**报录比 = 报考人数 / 录取人数**\n\n比如某专业报了300人，录30人，报录比就是10:1\n\n**怎么看报录比：**\n- 5:1以下：相对容易\n- 5:1 - 10:1：正常竞争\n- 10:1 - 20:1：竞争激烈\n- 20:1以上：神仙打架😂\n\n但别被数字吓到！很多人只是报了名但没有认真准备，真正有竞争力的对手没那么多~💪`
  }

  if (hasKeyword('英语', '外语', '单词', '阅读', '作文')) {
    if (hasKeyword('单词', '词汇', '背词')) {
      return `背单词是英语备考的基础 📚\n\n**推荐方法：**\n1. 用APP（墨墨/不背单词）每天碎片时间刷\n2. 核心词汇（2000-3000个）反复记忆\n3. 真题中遇到的生词优先级最高\n\n**高效记忆技巧：**\n- 词根词缀法（比如pre-表示"前"，re-表示"再"）\n- 联想记忆法\n- 在真题语境中记忆\n\n💡 每天至少100个，暑假前过完2轮！`
    }
    return `考研英语复习要点 🇬🇧\n\n- 单词每天坚持，暑假前过2轮\n- 长难句3-6月每天分析3-5个\n- 真题阅读6-10月精做近20年\n- 作文10-12月整理模板背诵\n\n需要具体哪方面的建议呢？单词/阅读/作文？`
  }

  if (hasKeyword('数学', '高数', '线代', '概率')) {
    return `数学是考研中最拉分的科目！📐\n\n**数一/数二/数三区别：**\n- 数一：内容最多、最难（一般工科学硕）\n- 数二：不考概率论（部分专硕）\n- 数三：经济类（内容少但灵活）\n\n**推荐老师：**\n- 张宇：讲课有趣，适合基础好的\n- 汤家凤：讲解细致，适合基础一般的\n- 武忠祥：方法实用，高数讲得好\n\n⚠️ 数学要多动手算，看懂了≠会做了！`
  }

  if (hasKeyword('暑校', '夏令营')) {
    return `关于考研夏令营 🏕️\n\n**什么是夏令营？**\n- 部分高校在7-8月举办\n- 面向大三学生\n- 优秀营员可能获得复试优惠甚至免复试\n\n**申请建议：**\n- 关注目标院校研究生院官网通知\n- 准备简历、成绩单、推荐信\n- 多在夏令营中展示你的学术潜力\n\n📌 大部分学校夏令营主要针对推免生，统考生机会有限但不妨一试！`
  }

  if (hasKeyword('资料', '买书', '用什么书', '教辅')) {
    return `考研经典教辅推荐 📚\n\n**英语：**\n- 单词：《红宝书》/《恋练有词》\n- 真题：《张剑黄皮书》\n- 作文：王江涛《高分写作》\n\n**数学：**\n- 复习全书：李永乐/汤家凤\n- 习题集：张宇1000题/汤家凤1800题\n- 真题：李永乐历年真题\n\n**政治：**\n- 精讲精练+1000题+肖四肖八（肖秀荣三件套）\n- 强化课：徐涛\n\n💡 书不在多，每类选1-2本精做即可！`
  }

  if (msg.length < 5) {
    return `嗯？你想问什么呢？😊\n\n可以跟我说说：\n- 考研准备中遇到了什么问题？\n- 哪个科目需要帮助？\n- 或者随便聊聊也可以~`
  }

  const previousAssistantMsgs = allMessages.filter(m => m.role === 'assistant')
  if (previousAssistantMsgs.length === 0) {
    return `好问题！🤔 让我帮你分析一下"${msg.length > 40 ? msg.substring(0, 40) + '...' : msg}"\n\n作为考研助手，我建议你可以从这几个方面考虑：\n\n1. 📖 找到权威的信息来源，比如目标院校的研究生院官网\n2. 💬 在考研论坛里找找有没有相似经验的学长学姐\n3. 📊 利用本小程序的考研数据功能做参考\n4. 📝 把问题拆解成更具体的小问题，一个个解决\n\n可以再具体说说你的情况吗？这样我能给你更精准的建议~ 😊`
  }

  const replies = [
    `嗯，关于"${msg.length > 30 ? msg.substring(0, 30) + '...' : msg}"这个问题，让我从备考的角度帮你分析 🤔\n\n每个考研人的情况都不太一样，如果你能告诉我更多细节，比如：\n- 你目前大几？\n- 准备考哪个专业？\n- 有没有目标院校？\n\n我可以给你更有针对性的建议哦~ 😊`,
  
    `这个问题挺有意思的！💡\n\n结合你之前的对话来看，我建议把这个问题拆开来看：\n1. 先确定你的核心诉求是什么\n2. 然后找到最需要解决的那个点\n3. 一步步来，不用一次解决所有问题\n\n考研备考也是一个"分而治之"的过程~ 还有什么想深入了解的吗？`,

    `好嘞，让我换个角度帮你想想 🧐\n\n其实很多考研问题都可以归结为两个维度：\n- **信息层面**：相关政策、数据、经验\n- **执行层面**：计划、方法、坚持\n\n你现在是在信息收集阶段，还是在执行落地阶段？不同阶段策略不一样哦~`
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}

const saveConversation = async (userId, role, content) => {
  try {
    await db.query(
      'INSERT INTO ai_conversations (user_id, role, content) VALUES (?, ?, ?)',
      [userId, role, content]
    )
  } catch (err) {
    console.error('保存对话记录失败:', err.message)
  }
}

const getConversationHistory = async (userId, limit = 50) => {
  try {
    const rows = await db.query(
      'SELECT role, content, created_at FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    )
    return rows.reverse()
  } catch (err) {
    console.error('获取对话历史失败:', err.message)
    return []
  }
}

router.get('/history', auth, async (req, res) => {
  try {
    const history = await getConversationHistory(req.user.id)
    res.json({ code: 200, data: { messages: history } })
  } catch (err) {
    res.json({ code: 500, msg: err.message })
  }
})

router.delete('/history', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM ai_conversations WHERE user_id = ?', [req.user.id])
    res.json({ code: 200, msg: '对话历史已清除' })
  } catch (err) {
    res.json({ code: 500, msg: err.message })
  }
})

router.post('/chat', auth, async (req, res) => {
  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.json({ code: 400, msg: '消息格式错误' })
  }

  const userLastMessage = messages[messages.length - 1]?.content || ''

  try {
    await saveConversation(req.user.id, 'user', userLastMessage)

    let reply

    if (AI_API_KEY) {
      try {
        reply = await callAIAPI(messages)
      } catch (apiErr) {
        console.error('AI API调用失败，使用默认回复:', apiErr.message)
        reply = getDefaultResponse(userLastMessage, messages)
      }
    } else {
      reply = getDefaultResponse(userLastMessage, messages)
    }

    await saveConversation(req.user.id, 'assistant', reply)

    res.json({ code: 200, data: { content: reply } })
  } catch (err) {
    console.error('AI聊天错误:', err)
    res.json({ code: 500, msg: 'AI服务暂时不可用，请稍后再试' })
  }
})

module.exports = router

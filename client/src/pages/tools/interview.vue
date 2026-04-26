<template>
  <view class="page">
    <!-- 功能入口 -->
    <view class="tool-grid">
      <view 
        v-for="(tool, index) in tools" 
        :key="index"
        class="tool-card card"
        @click="openTool(tool)"
      >
        <text class="tool-icon">{{ tool.icon }}</text>
        <text class="tool-name">{{ tool.name }}</text>
        <text class="tool-desc">{{ tool.desc }}</text>
      </view>
    </view>

    <!-- 口语题库弹窗 -->
    <view v-if="showOral" class="modal-mask" @click="showOral = false">
      <view class="modal-content oral-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">英语口语题库</text>
          <text class="close-btn" @click="showOral = false">✕</text>
        </view>

        <scroll-view scroll-y class="oral-list">
          <view 
            v-for="(q, index) in oralQuestions" 
            :key="index"
            class="oral-item"
          >
            <view class="question-section">
              <text class="q-label">Q{{ index + 1 }}.</text>
              <text class="q-en">{{ q.question_en }}</text>
              <text class="q-cn">{{ q.question_cn }}</text>
            </view>
            
            <view class="answer-section">
              <text class="a-label">参考回答：</text>
              <text class="a-content">{{ q.reference_answer }}</text>
            </view>
            
            <button class="copy-btn" @click="copyAnswer(q)">复制参考回答</button>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 简历模板弹窗 -->
    <view v-if="showResume" class="modal-mask" @click="showResume = false">
      <view class="modal-content resume-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">复试简历模板</text>
          <text class="close-btn" @click="showResume = false">✕</text>
        </view>

        <view class="template-list">
          <view 
            v-for="(tpl, index) in resumeTemplates" 
            :key="index"
            class="template-item"
          >
            <view class="template-info">
              <text class="template-name">{{ tpl.name }}</text>
              <text class="template-desc">{{ tpl.desc }}</text>
            </view>
            <button class="download-tpl-btn" @click="downloadTemplate(tpl)">
              下载模板
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 邮件模板弹窗 -->
    <view v-if="showEmail" class="modal-mask" @click="showEmail = false">
      <view class="modal-content email-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">导师联系邮件模板</text>
          <text class="close-btn" @click="showEmail = false">✕</text>
        </view>

        <view class="email-list">
          <view 
            v-for="(email, index) in emailTemplates" 
            :key="index"
            class="email-item"
          >
            <text class="email-scene">{{ email.scene }}</text>
            <text class="email-subject">主题：{{ email.subject }}</text>
            <view class="email-body">
              <text class="email-content">{{ email.content }}</text>
            </view>
            <button class="copy-btn" @click="copyEmail(email)">一键复制</button>
          </view>
        </view>
      </view>
    </view>

    <!-- AI润色弹窗 -->
    <view v-if="showPolish" class="modal-mask" @click="showPolish = false">
      <view class="modal-content polish-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">AI自我介绍/简历润色</text>
          <text class="close-btn" @click="showPolish = false">✕</text>
        </view>

        <view class="polish-form">
          <view class="form-item">
            <text class="form-label">输入内容</text>
            <textarea 
              class="polish-input" 
              v-model="polishContent" 
              placeholder="请输入你的自我介绍、个人经历或简历内容..."
              maxlength="2000"
            />
            <text class="char-count">{{ polishContent.length }}/2000</text>
          </view>

          <view class="form-item">
            <text class="form-label">输出风格</text>
            <picker :range="['正式学术', '亲切自然']" @change="(e) => polishStyle = ['formal','casual'][e.detail.value]">
              <view class="style-picker">{{ polishStyle === 'formal' ? '正式学术' : '亲切自然' }}</view>
            </picker>
          </view>

          <view class="form-item">
            <text class="form-label">语言</text>
            <picker :range="['中文', '英文']" @change="(e) => polishLang = ['zh','en'][e.detail.value]">
              <view class="style-picker">{{ polishLang === 'zh' ? '中文' : '英文' }}</view>
            </picker>
          </view>

          <button 
            class="btn-primary polish-btn" 
            :disabled="!polishContent.trim() || polishing"
            @click="doPolish"
          >
            {{ polishing ? '润色中...' : '开始润色' }}
          </button>

          <!-- 润色结果 -->
          <view v-if="polishResult" class="result-area">
            <text class="result-title">润色结果：</text>
            <text class="result-text">{{ polishResult }}</text>
            <view class="result-actions">
              <button class="btn-outline copy-result-btn" @click="copyResult">复制结果</button>
              <button class="btn-outline re-polish-btn" @click="doPolish">重新润色</button>
            </view>
          </view>
        </view>

        <text class="usage-tip">今日剩余使用次数：{{ remainingUses }}次</text>
      </view>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const showOral = ref(false)
const showResume = ref(false)
const showEmail = ref(false)
const showPolish = ref(false)

const polishContent = ref('')
const polishStyle = ref('formal')
const polishLang = ref('zh')
const polishResult = ref('')
const polishing = ref(false)
const remainingUses = ref(3)

const tools = [
  { icon: '🗣️', name: '英语口语题库', desc: '30道常见问题及参考回答', action: 'oral' },
  { icon: '📄', name: '简历模板下载', desc: '3套Word模板，带水印', action: 'resume' },
  { icon: '✉️', name: '导师邮件模板', desc: '3种场景，一键复制', action: 'email' },
  { icon: '✨', name: 'AI简历润色', desc: '智能优化你的自我介绍', action: 'polish' }
]

const oralQuestions = [
  {
    question_en: 'Could you please introduce yourself briefly?',
    question_cn: '请简单介绍一下你自己',
    reference_answer: 'Good morning/afternoon, professors. It\'s my great honor to be here. My name is [姓名], and I graduated from [本科学校] with a major in [专业]. During my undergraduate studies, I have developed a strong interest in [研究方向], and I hope to pursue further studies under your guidance.'
  },
  {
    question_en: 'Why do you want to pursue a master\'s degree?',
    question_cn: '你为什么想读研？',
    reference_answer: 'I believe that pursuing a master\'s degree is essential for my academic and career development. Through graduate study, I can deepen my understanding of [专业领域] and conduct more systematic research. Additionally, I aspire to contribute to this field through original research.'
  },
  {
    question_en: 'What are your research interests?',
    question_cn: '你的研究兴趣是什么？',
    reference_answer: 'My primary research interest lies in [具体方向]. During my undergraduate studies, I completed a project on [项目名称], which sparked my passion for this area. I am particularly interested in exploring [具体问题] because it has significant practical implications.'
  },
  {
    question_en: 'What is your greatest strength?',
    question_cn: '你最大的优点是什么？',
    reference_answer: 'I believe my greatest strength is my perseverance and ability to tackle complex problems systematically. For example, when working on [某个项目/经历], I encountered many challenges, but through persistent effort and methodical analysis, I was able to overcome them successfully.'
  },
  {
    question_en: 'Why did you choose our university/laboratory?',
    question_cn: '为什么选择我们学校/实验室？',
    reference_answer: 'I chose this university because of its excellent reputation in [领域] and the outstanding research achievements of your laboratory. I have read several papers from your team and am deeply impressed by the innovative work being done here. I believe studying here will provide me with the best environment to grow as a researcher.'
  }
]

const resumeTemplates = [
  { name: '学术型简历模板', desc: '突出科研成果和学术能力，适合学术导向的申请' },
  { name: '综合型简历模板', desc: '平衡展示学习、科研和实践能力，通用性强' },
  { name: '实践型简历模板', desc: '强调实习、项目和竞赛经验，适合专硕申请' }
]

const emailTemplates = [
  {
    scene: '初次联系',
    subject: '关于报考硕士研究生事宜 - [姓名]',
    content: `尊敬的[导师姓名]教授：

您好！

我是[本科学校][专业]的[姓名]同学，今年准备报考贵校[学院/专业]的硕士研究生。

通过阅读您的相关论文，我对您在[研究方向]领域的研究工作非常感兴趣。特别是您关于[某篇论文/研究成果]的工作让我深受启发。

我本科期间学习成绩优异（GPA: X.X/4.0），曾获得[奖项名称]。在[某课程/项目]的学习中，我对[相关方向]产生了浓厚兴趣，并完成了[相关成果]。

冒昧致信，希望能有机会得到您的指导。如蒙赐教，不胜感激！

随信附上我的个人简历，恳请拨冗审阅。

此致
敬礼！

学生：[姓名]
[日期]
[联系方式]`
  },
  {
    scene: '成绩出来后',
    subject: '汇报初试成绩及调剂意向 - [姓名]',
    content: `尊敬的[导师姓名]教授：

您好！我是之前与您联系过的[姓名]同学。

非常高兴地告诉您，我在今年的研究生入学考试中取得了以下成绩：
- 总分：XXX
- 政治：XX
- 英语：XX
- 专业课一：XX
- 专业课二：XX

我对您的研究方向仍然充满热情，希望能有机会加入您的团队攻读硕士学位。如果符合要求，我非常愿意参加复试并进一步交流。

期待您的回复！

祝您工作顺利！

学生：[姓名]
[日期]`
  },
  {
    scene: '复试后感谢',
    subject: '感谢面试机会 - [姓名]',
    content: `尊敬的[导师姓名]教授：

您好！

非常感谢您在百忙之中抽出时间参加我的复试面试。通过与您的交流，我受益匪浅，对您的研究方向有了更深入的理解，也更加坚定了跟随您学习的决心。

无论最终录取结果如何，这次面试经历都让我收获颇丰。如果能有幸成为您的学生，我将倍加珍惜这个学习机会，努力钻研，不负您的期望。

再次感谢您的时间和指导！

祝您身体健康，工作顺利！

学生：[姓名]
[日期]`
  }
]

const openTool = (tool) => {
  switch (tool.action) {
    case 'oral': showOral.value = true; break
    case 'resume': showResume.value = true; break
    case 'email': showEmail.value = true; break
    case 'polish': showPolish.value = true; break
  }
}

const copyAnswer = (q) => {
  uni.setClipboardData({
    data: q.reference_answer,
    success: () => uni.showToast({ title: '已复制', icon: 'success' })
  })
}

const downloadTemplate = (tpl) => {
  uni.showModal({
    title: '下载提示',
    content: `即将下载「${tpl.name}」，文件将带有水印标识`,
    confirmText: '下载',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '功能开发中', icon: 'none' })
      }
    }
  })
}

const copyEmail = (email) => {
  uni.setClipboardData({
    data: email.content,
    success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
  })
}

const doPolish = async () => {
  if (!polishContent.value.trim()) return
  
  polishing.value = true
  
  // 模拟AI润色过程
  setTimeout(() => {
    const input = polishContent.value
    
    if (polishLang.value === 'en') {
      polishResult.value = `[润色后的英文版本]\n\n${input}\n\n[AI优化建议]\n\nBased on your background, here is a polished version that highlights your strengths more effectively:\n\nDear Prof. [Name],\n\nI am writing to express my strong interest in... [Enhanced introduction with clearer structure and more professional tone]`
    } else {
      polishResult.value = `[润色后的中文版本]\n\n尊敬的老师：\n\n您好！我是来自${input.includes('学校') ? '' : '[XX大学]'}的${input.includes('姓名') ? '' : '[姓名]'}同学...\n\n[AI优化建议]\n\n1. 建议增加具体的量化数据支撑您的成就\n2. 可以更突出与目标方向的匹配度\n3. 语言可以更加简洁有力`
    }
    
    polishing.value = false
    remainingUses.value--
  }, 1500)
}

const copyResult = () => {
  if (polishResult.value) {
    uni.setClipboardData({
      data: polishResult.value,
      success: () => uni.showToast({ title: '已复制', icon: 'success' })
    })
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 24rpx;
}

.tool-card {
  padding: 36rpx 24rpx;
  text-align: center;
}

.tool-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.tool-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.tool-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #fff;
  border-radius: 20rpx;
  width: 88%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  font-size: 36rpx;
  color: #999;
  padding: 10rpx;
}

.oral-modal .oral-list {
  flex: 1;
  overflow-y: auto;
  padding: 20rpx 30rpx;
}

.oral-item {
  padding: 24rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.question-section {
  margin-bottom: 16rpx;
}

.q-label {
  font-size: 26rpx;
  font-weight: bold;
  color: #007AFF;
  margin-right: 8rpx;
}

.q-en {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 6rpx;
}

.q-cn {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.answer-section {
  background: #fff;
  padding: 16rpx;
  border-radius: 8rpx;
  border-left: 4rpx solid #07c160;
  margin-bottom: 12rpx;
}

.a-label {
  font-size: 22rpx;
  color: #07c160;
  font-weight: 500;
  display: block;
  margin-bottom: 8rpx;
}

.a-content {
  font-size: 26rpx;
  color: #444;
  line-height: 1.7;
}

.copy-btn {
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 24rpx;
  padding: 12rpx 32rpx;
  font-size: 24rpx;
}

.template-list {
  padding: 20rpx 30rpx;
}

.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.template-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}

.template-desc {
  font-size: 22rpx;
  color: #999;
}

.download-tpl-btn {
  background: linear-gradient(135deg, #007AFF, #00c6ff);
  color: #fff;
  border: none;
  border-radius: 24rpx;
  padding: 14rpx 28rpx;
  font-size: 24rpx;
}

.email-modal .email-list {
  flex: 1;
  overflow-y: auto;
  padding: 20rpx 30rpx;
}

.email-item {
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.email-scene {
  font-size: 28rpx;
  font-weight: bold;
  color: #007AFF;
  display: block;
  margin-bottom: 10rpx;
}

.email-subject {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.email-body {
  background: #fff;
  padding: 16rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
  max-height: 300rpx;
  overflow-y: auto;
}

.email-content {
  font-size: 24rpx;
  color: #444;
  white-space: pre-wrap;
  line-height: 1.7;
}

.polish-modal {
  max-height: 90vh;
}

.polish-form {
  padding: 24rpx 30rpx;
  flex: 1;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 20rpx;
}

.form-label {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 10rpx;
}

.polish-input {
  width: 100%;
  height: 180rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 26rpx;
  box-sizing: border-box;
  border: 2rpx solid transparent;
}

.char-count {
  font-size: 22rpx;
  color: #999;
  text-align: right;
  display: block;
  margin-top: 6rpx;
}

.style-picker {
  height: 70rpx;
  background: #f9f9f9;
  border-radius: 10rpx;
  padding: 0 20rpx;
  line-height: 70rpx;
  font-size: 26rpx;
  color: #666;
}

.polish-btn {
  width: 100%;
  height: 80rpx;
  font-size: 30rpx;
  margin-top: 10rpx;
}

.polish-btn[disabled] {
  opacity: 0.5;
}

.result-area {
  margin-top: 24rpx;
  padding: 20rpx;
  background: #e8ffee;
  border-radius: 12rpx;
}

.result-title {
  font-size: 26rpx;
  color: #07c160;
  font-weight: 500;
  display: block;
  margin-bottom: 12rpx;
}

.result-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.7;
  white-space: pre-wrap;
  display: block;
}

.result-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.copy-result-btn, .re-polish-btn {
  flex: 1;
  height: 64rpx;
  font-size: 26rpx;
}

.usage-tip {
  text-align: center;
  font-size: 24rpx;
  color: #ff9500;
  padding: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}
</style>

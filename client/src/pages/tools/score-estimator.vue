<template>
  <view class="page">
    <view class="header-section">
      <text class="page-title">成绩估算器</text>
      <text class="page-desc">输入预估分数，对比国家线评估过线概率</text>
    </view>

    <view class="form-card card">
      <view class="form-section">
        <text class="form-label">考试信息</text>
        <view class="form-row">
          <view class="form-item flex1">
            <text class="form-sublabel">年份</text>
            <picker :range="years" @change="onYearChange">
              <view class="picker-value">{{ form.year || '请选择' }}</view>
            </picker>
          </view>
          <view class="form-item flex1">
            <text class="form-sublabel">地区</text>
            <picker :range="regionLabels" @change="onRegionChange">
              <view class="picker-value">{{ regionLabels[regionIndex] }}</view>
            </picker>
          </view>
        </view>
        <view class="form-row">
          <view class="form-item flex1">
            <text class="form-sublabel">类别</text>
            <picker :range="categoryLabels" @change="onCategoryChange">
              <view class="picker-value">{{ categoryLabels[categoryIndex] }}</view>
            </picker>
          </view>
          <view class="form-item flex1">
            <text class="form-sublabel">学科门类</text>
            <picker :range="subjectTypes" @change="onSubjectChange">
              <view class="picker-value">{{ form.subject_type || '请选择' }}</view>
            </picker>
          </view>
        </view>
      </view>

      <view class="form-section">
        <text class="form-label">预估成绩</text>
        <view class="form-row">
          <view class="form-item flex1">
            <text class="form-sublabel">政治</text>
            <input class="score-input" type="digit" v-model="form.politics_score" placeholder="0-100" maxlength="5" />
          </view>
          <view class="form-item flex1">
            <text class="form-sublabel">外语</text>
            <input class="score-input" type="digit" v-model="form.english_score" placeholder="0-100" maxlength="5" />
          </view>
        </view>
        <view class="form-row">
          <view class="form-item flex1">
            <text class="form-sublabel">业务课一</text>
            <input class="score-input" type="digit" v-model="form.subject1_score" placeholder="0-150" maxlength="5" />
          </view>
          <view class="form-item flex1">
            <text class="form-sublabel">业务课二</text>
            <input class="score-input" type="digit" v-model="form.subject2_score" placeholder="0-150" maxlength="5" />
          </view>
        </view>
      </view>

      <button class="estimate-btn" @click="doEstimate" :loading="loading">开始评估</button>
    </view>

    <view v-if="result" class="result-section">
      <view class="overall-card card">
        <view class="overall-badge" :style="{ background: result.overallColor }">
          <text class="overall-label">{{ result.overallLabel }}</text>
        </view>
        <view class="overall-scores">
          <view class="score-big">
            <text class="score-num">{{ result.myTotal }}</text>
            <text class="score-unit">我的总分</text>
          </view>
          <text class="score-vs">VS</text>
          <view class="score-big">
            <text class="score-num gray">{{ result.nationalLine.totalScore }}</text>
            <text class="score-unit">国家线</text>
          </view>
        </view>
        <view class="diff-row">
          <text class="diff-text" :class="{ positive: result.totalResult.diff >= 0, negative: result.totalResult.diff < 0 }">
            {{ result.totalResult.diff >= 0 ? '+' : '' }}{{ result.totalResult.diff }} 分
          </text>
        </view>
      </view>

      <view class="subjects-card card">
        <text class="card-title">各科详情</text>
        <view v-for="sub in result.subjectResults" :key="sub.name" class="subject-row">
          <view class="sub-name-col">
            <text class="sub-name">{{ sub.name }}</text>
          </view>
          <view class="sub-score-col">
            <text class="sub-mine">{{ sub.myScore }}</text>
            <text class="sub-sep">/</text>
            <text class="sub-line">{{ sub.lineScore }}</text>
          </view>
          <view class="sub-diff-col">
            <text class="sub-diff" :class="sub.passed ? 'pass' : 'fail'">
              {{ sub.diff >= 0 ? '+' : '' }}{{ sub.diff }}
            </text>
          </view>
          <view class="sub-status-col">
            <text class="sub-status" :class="sub.level">{{ levelTag[sub.level] }}</text>
          </view>
        </view>

        <view class="subject-row total-row">
          <view class="sub-name-col">
            <text class="sub-name bold">总分</text>
          </view>
          <view class="sub-score-col">
            <text class="sub-mine bold">{{ result.myTotal }}</text>
            <text class="sub-sep">/</text>
            <text class="sub-line bold">{{ result.nationalLine.totalScore }}</text>
          </view>
          <view class="sub-diff-col">
            <text class="sub-diff bold" :class="result.totalResult.passed ? 'pass' : 'fail'">
              {{ result.totalResult.diff >= 0 ? '+' : '' }}{{ result.totalResult.diff }}
            </text>
          </view>
          <view class="sub-status-col">
            <text class="sub-status" :class="result.totalResult.level">{{ levelTag[result.totalResult.level] }}</text>
          </view>
        </view>
      </view>

      <view v-if="result.studentComparison" class="compare-card card">
        <text class="card-title">本校上岸学长对比</text>
        <text class="compare-hint">基于 {{ result.studentComparison.sampleSize }} 位已上岸学长的真实成绩</text>
        <view class="compare-stats">
          <view class="compare-item">
            <text class="compare-val">{{ result.studentComparison.p25Score }}</text>
            <text class="compare-key">25%分位</text>
          </view>
          <view class="compare-item">
            <text class="compare-val">{{ result.studentComparison.medianScore }}</text>
            <text class="compare-key">中位数</text>
          </view>
          <view class="compare-item">
            <text class="compare-val">{{ result.studentComparison.avgScore }}</text>
            <text class="compare-key">平均分</text>
          </view>
          <view class="compare-item">
            <text class="compare-val">{{ result.studentComparison.p75Score }}</text>
            <text class="compare-key">75%分位</text>
          </view>
        </view>
        <view class="compare-rank">
          <text class="rank-text">你的成绩超过了 <text class="rank-pct">{{ result.studentComparison.myPercentile }}%</text> 的上岸学长</text>
        </view>
      </view>

      <view class="suggest-card card">
        <text class="card-title">评估建议</text>
        <view v-for="(sug, i) in result.suggestions" :key="i" class="suggest-item">
          <text class="suggest-dot">•</text>
          <text class="suggest-text">{{ sug }}</text>
        </view>
      </view>

      <view class="line-info card">
        <text class="line-info-text">
          参考：{{ result.nationalLine.year }}年 {{ result.nationalLine.region === 'A' ? 'A区' : 'B区' }}
          {{ result.nationalLine.category }} {{ result.nationalLine.subjectType }} 国家线
        </text>
      </view>
    </view>

    <view style="height: 60rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { scoreEstimatorApi } from '@/api/index'

const loading = ref(false)
const years = ref([])
const subjectTypes = ref([])
const regionLabels = ['A区', 'B区']
const categoryLabels = ['学术型', '专业型']
const regionIndex = ref(0)
const categoryIndex = ref(0)

const form = ref({
  year: '',
  region: 'A',
  category: 'academic',
  subject_type: '',
  politics_score: '',
  english_score: '',
  subject1_score: '',
  subject2_score: ''
})

const result = ref(null)

const levelTag = {
  safe: '稳',
  good: '优',
  edge: '擦线',
  close: '接近',
  danger: '危险',
  single_fail: '单科未过'
}

const onYearChange = (e) => {
  form.value.year = years.value[e.detail.value]
}

const onRegionChange = (e) => {
  regionIndex.value = e.detail.value
  form.value.region = e.detail.value === 0 ? 'A' : 'B'
}

const onCategoryChange = (e) => {
  categoryIndex.value = e.detail.value
  form.value.category = e.detail.value === 0 ? 'academic' : 'professional'
}

const onSubjectChange = (e) => {
  form.value.subject_type = subjectTypes.value[e.detail.value]
}

const doEstimate = async () => {
  if (!form.value.year) return uni.showToast({ title: '请选择年份', icon: 'none' })
  if (!form.value.subject_type) return uni.showToast({ title: '请选择学科门类', icon: 'none' })

  const hasScore = form.value.politics_score || form.value.english_score || form.value.subject1_score || form.value.subject2_score
  if (!hasScore) return uni.showToast({ title: '请至少输入一科成绩', icon: 'none' })

  loading.value = true
  result.value = null

  try {
    const res = await scoreEstimatorApi.estimate({
      year: form.value.year,
      region: form.value.region,
      category: form.value.category,
      subject_type: form.value.subject_type,
      politics_score: form.value.politics_score || null,
      english_score: form.value.english_score || null,
      subject1_score: form.value.subject1_score || null,
      subject2_score: form.value.subject2_score || null
    })

    if (res.code === 200 && res.data) {
      result.value = res.data
      uni.pageScrollTo({ scrollTop: 600, duration: 300 })
    } else {
      uni.showToast({ title: res.msg || '评估失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络异常', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await scoreEstimatorApi.getOptions()
    if (res.data) {
      years.value = res.data.years || []
      subjectTypes.value = res.data.subjectTypes || []
      if (years.value.length > 0) form.value.year = years.value[0]
    }
  } catch (e) {
    console.error('加载选项失败:', e)
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
}

.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx 30rpx;
  color: #fff;
}

.page-title {
  font-size: 38rpx;
  font-weight: bold;
  display: block;
}

.page-desc {
  font-size: 24rpx;
  opacity: 0.85;
  margin-top: 8rpx;
  display: block;
}

.card {
  margin: 20rpx 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-section {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
  padding-left: 16rpx;
  border-left: 6rpx solid #667eea;
}

.form-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.flex1 {
  flex: 1;
}

.form-sublabel {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.picker-value {
  height: 72rpx;
  line-height: 72rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
}

.score-input {
  height: 72rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
}

.estimate-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  line-height: 88rpx;
  margin-top: 10rpx;
}

.result-section {
  margin-top: 10rpx;
}

.overall-card {
  text-align: center;
  padding: 36rpx 24rpx;
}

.overall-badge {
  display: inline-block;
  padding: 10rpx 40rpx;
  border-radius: 30rpx;
  margin-bottom: 24rpx;
}

.overall-label {
  color: #fff;
  font-size: 30rpx;
  font-weight: bold;
}

.overall-scores {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40rpx;
}

.score-big {
  text-align: center;
}

.score-num {
  font-size: 64rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.score-num.gray {
  color: #999;
}

.score-unit {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.score-vs {
  font-size: 28rpx;
  color: #ccc;
  font-weight: bold;
}

.diff-row {
  margin-top: 16rpx;
}

.diff-text {
  font-size: 32rpx;
  font-weight: bold;
}

.diff-text.positive {
  color: #07c160;
}

.diff-text.negative {
  color: #ff4d4f;
}

.card-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
  padding-left: 16rpx;
  border-left: 6rpx solid #667eea;
}

.subject-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.total-row {
  border-bottom: none;
  border-top: 2rpx solid #eee;
  margin-top: 8rpx;
  padding-top: 20rpx;
}

.sub-name-col {
  width: 140rpx;
}

.sub-name {
  font-size: 26rpx;
  color: #666;
}

.sub-name.bold {
  font-weight: bold;
  color: #333;
}

.sub-score-col {
  flex: 1;
  text-align: center;
}

.sub-mine {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.sub-mine.bold {
  font-weight: bold;
}

.sub-sep {
  font-size: 24rpx;
  color: #ccc;
  margin: 0 8rpx;
}

.sub-line {
  font-size: 26rpx;
  color: #999;
}

.sub-line.bold {
  font-weight: bold;
  color: #666;
}

.sub-diff-col {
  width: 120rpx;
  text-align: center;
}

.sub-diff {
  font-size: 26rpx;
  font-weight: 500;
}

.sub-diff.bold {
  font-weight: bold;
  font-size: 28rpx;
}

.sub-diff.pass {
  color: #07c160;
}

.sub-diff.fail {
  color: #ff4d4f;
}

.sub-status-col {
  width: 100rpx;
  text-align: right;
}

.sub-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.sub-status.safe {
  background: #e6f7e9;
  color: #216e39;
}

.sub-status.good {
  background: #e6f7e9;
  color: #30a14e;
}

.sub-status.edge {
  background: #fff8e1;
  color: #f9a825;
}

.sub-status.close {
  background: #fff3e0;
  color: #e65100;
}

.sub-status.danger {
  background: #ffebee;
  color: #c62828;
}

.sub-status.single_fail {
  background: #fff8e1;
  color: #f57f17;
}

.compare-card {
  padding: 24rpx;
}

.compare-hint {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-bottom: 20rpx;
}

.compare-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20rpx;
}

.compare-item {
  text-align: center;
}

.compare-val {
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.compare-key {
  font-size: 20rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.compare-rank {
  background: #f0f0ff;
  border-radius: 12rpx;
  padding: 16rpx;
  text-align: center;
}

.rank-text {
  font-size: 26rpx;
  color: #666;
}

.rank-pct {
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
}

.suggest-card {
  padding: 24rpx;
}

.suggest-item {
  display: flex;
  margin-bottom: 12rpx;
}

.suggest-dot {
  font-size: 28rpx;
  color: #667eea;
  margin-right: 12rpx;
  line-height: 40rpx;
}

.suggest-text {
  font-size: 26rpx;
  color: #555;
  line-height: 40rpx;
  flex: 1;
}

.line-info {
  padding: 16rpx 24rpx;
  background: #fafafa;
}

.line-info-text {
  font-size: 22rpx;
  color: #999;
}
</style>

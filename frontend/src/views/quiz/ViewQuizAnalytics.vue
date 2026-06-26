<template>
  <div class="analytics-page" ref="pageRef">
    <!-- 顶部导航栏 -->
    <div class="analytics-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 12H5m7 7l-7-7 7-7" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>返回</span>
        </button>
        <h1 class="header-title">答题数据分析中心</h1>
      </div>
      <div class="header-right">
        <span class="header-time">{{ currentTime }}</span>
        <button class="fullscreen-btn" @click="toggleFullscreen">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
        </button>
      </div>
    </div>

    <!-- 核心数据区 -->
    <div class="analytics-body">
      <!-- 顶部统计卡片 -->
      <div class="stats-row">
        <div class="stat-card primary">
          <div class="stat-icon">&#127941;</div>
          <div class="stat-info">
            <div class="stat-value" :style="{ color: accuracyColor }">{{ resultData.accuracy }}%</div>
            <div class="stat-label">正确率</div>
          </div>
          <svg class="stat-ring" viewBox="0 0 100 100">
            <circle class="ring-bg" cx="50" cy="50" r="42"/>
            <circle class="ring-fill" cx="50" cy="50" r="42" :style="ringStyle"/>
          </svg>
        </div>
        <div class="stat-card">
          <div class="stat-icon correct">&#10003;</div>
          <div class="stat-info">
            <div class="stat-value correct">{{ resultData.correctAnswers }}</div>
            <div class="stat-label">答对题数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon wrong">&#10007;</div>
          <div class="stat-info">
            <div class="stat-value wrong">{{ resultData.wrongAnswers }}</div>
            <div class="stat-label">答错题数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon time">&#9201;</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatTime(resultData.timeSpent) }}</div>
            <div class="stat-label">用时</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon score">&#9733;</div>
          <div class="stat-info">
            <div class="stat-value score">{{ resultData.earnedPoints }}</div>
            <div class="stat-label">获得积分</div>
          </div>
        </div>
      </div>

      <!-- 中间主图表区 -->
      <div class="charts-grid">
        <!-- 左侧：答题正确率分布（环形图） -->
        <div class="chart-panel">
          <div class="chart-header">
            <h3>答题结果分布</h3>
            <span class="chart-badge">本次</span>
          </div>
          <div class="chart-body center">
            <svg class="donut-chart" viewBox="0 0 200 200">
              <!-- 背景圆环 -->
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="24"/>
              <!-- 正确部分 -->
              <circle cx="100" cy="100" r="70" fill="none" stroke="#7CB342" stroke-width="24"
                      :stroke-dasharray="correctArc.dash" :stroke-dashoffset="correctArc.offset"
                      stroke-linecap="round" transform="rotate(-90 100 100)"/>
              <!-- 错误部分 -->
              <circle cx="100" cy="100" r="70" fill="none" stroke="#C75C3A" stroke-width="24"
                      :stroke-dasharray="wrongArc.dash" :stroke-dashoffset="wrongArc.offset"
                      stroke-linecap="round" transform="rotate(-90 100 100)"/>
              <!-- 中心文字 -->
              <text x="100" y="95" text-anchor="middle" fill="#C9A96E" font-size="28" font-weight="700">{{ resultData.accuracy }}%</text>
              <text x="100" y="118" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="11">正确率</text>
            </svg>
            <div class="donut-legend">
              <div class="legend-item"><span class="legend-dot" style="background:#7CB342"></span>正确 {{ resultData.correctAnswers }} 题</div>
              <div class="legend-item"><span class="legend-dot" style="background:#C75C3A"></span>错误 {{ resultData.wrongAnswers }} 题</div>
            </div>
          </div>
        </div>

        <!-- 中间：逐题分析（横向柱状图） -->
        <div class="chart-panel wide">
          <div class="chart-header">
            <h3>逐题正确性分析</h3>
            <span class="chart-badge">详细</span>
          </div>
          <div class="chart-body">
            <div class="question-bars">
              <div v-for="(d, index) in resultData.details" :key="index" class="q-bar-row">
                <span class="q-bar-label">Q{{ index + 1 }}</span>
                <div class="q-bar-track">
                  <div class="q-bar-fill" :class="{ correct: d.isCorrect, wrong: !d.isCorrect }" :style="{ width: '100%' }"></div>
                </div>
                <span class="q-bar-status" :class="{ correct: d.isCorrect, wrong: !d.isCorrect }">{{ d.isCorrect ? '对' : '错' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：能力雷达图 -->
        <div class="chart-panel">
          <div class="chart-header">
            <h3>能力维度评估</h3>
            <span class="chart-badge">综合</span>
          </div>
          <div class="chart-body center">
            <svg class="radar-chart" viewBox="0 0 220 220">
              <!-- 背景网格 -->
              <g v-for="n in 5" :key="n">
                <polygon :points="getRadarPoints(n / 5)" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
              </g>
              <!-- 轴线 -->
              <line v-for="i in 6" :key="'axis'+i" :x1="100" :y1="100"
                    :x2="getAxisEnd(i).x" :y2="getAxisEnd(i).y" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
              <!-- 数据区域 -->
              <polygon :points="radarDataPoints" fill="rgba(201, 169, 110, 0.2)" stroke="#C9A96E" stroke-width="2"/>
              <!-- 数据点 -->
              <circle v-for="(p, i) in radarPointCoords" :key="i" :cx="p.x" :cy="p.y" r="4" fill="#C9A96E" stroke="#1A1714" stroke-width="2"/>
              <!-- 标签 -->
              <text v-for="(label, i) in radarLabels" :key="'label'+i"
                    :x="getLabelPos(i).x" :y="getLabelPos(i).y"
                    text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="10">{{ label }}</text>
            </svg>
          </div>
        </div>
      </div>

      <!-- 底部图表区 -->
      <div class="charts-grid bottom">
        <!-- 用时分析 -->
        <div class="chart-panel">
          <div class="chart-header">
            <h3>每题用时分析</h3>
            <span class="chart-badge">效率</span>
          </div>
          <div class="chart-body">
            <div class="time-bars">
              <div v-for="(t, index) in timePerQuestion" :key="index" class="time-bar-row">
                <span class="time-label">Q{{ index + 1 }}</span>
                <div class="time-track">
                  <div class="time-fill" :style="{ width: t.percent + '%' }"></div>
                </div>
                <span class="time-value">{{ t.seconds }}s</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 历史趋势 -->
        <div class="chart-panel wide">
          <div class="chart-header">
            <h3>历史答题趋势</h3>
            <span class="chart-badge">趋势</span>
          </div>
          <div class="chart-body">
            <svg class="trend-chart" viewBox="0 0 700 200" preserveAspectRatio="none">
              <!-- 网格线 -->
              <line x1="50" y1="30" x2="680" y2="30" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
              <line x1="50" y1="80" x2="680" y2="80" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
              <line x1="50" y1="130" x2="680" y2="130" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
              <!-- 正确率区域 -->
              <polygon :points="trendAreaPoints" fill="rgba(201, 169, 110, 0.1)" stroke="none"/>
              <!-- 正确率线 -->
              <polyline :points="trendLinePoints" fill="none" stroke="#C9A96E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- 数据点 -->
              <circle v-for="(p, i) in trendPoints" :key="i" :cx="p.x" :cy="p.y" r="5" fill="#C9A96E" stroke="#1A1714" stroke-width="2"/>
              <!-- X轴标签 -->
              <text v-for="(p, i) in trendPoints" :key="'xl'+i" :x="p.x" y="185" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="9">{{ p.label }}</text>
              <!-- Y轴标签 -->
              <text x="45" y="35" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="9">100%</text>
              <text x="45" y="85" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="9">60%</text>
              <text x="45" y="135" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="9">20%</text>
              <text x="45" y="170" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="9">0%</text>
            </svg>
          </div>
        </div>

        <!-- 知识点掌握 -->
        <div class="chart-panel">
          <div class="chart-header">
            <h3>知识点掌握</h3>
            <span class="chart-badge">强弱</span>
          </div>
          <div class="chart-body">
            <div class="knowledge-list">
              <div v-for="(k, i) in knowledgeStats" :key="i" class="knowledge-item">
                <div class="knowledge-header">
                  <span class="knowledge-name">{{ k.name }}</span>
                  <span class="knowledge-percent" :class="{ strong: k.percent >= 70, weak: k.percent < 50 }">{{ k.percent }}%</span>
                </div>
                <div class="knowledge-track">
                  <div class="knowledge-fill" :class="{ strong: k.percent >= 70, medium: k.percent >= 50 && k.percent < 70, weak: k.percent < 50 }" :style="{ width: k.percent + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 答题笔记 -->
      <div class="notes-panel" v-if="quizHistory.length > 0">
        <div class="chart-header">
          <h3>答题笔记</h3>
          <span class="chart-badge">学习记录</span>
        </div>
        <div class="notes-body">
          <div v-if="sessionNotes.length > 0" class="session-notes-list">
            <div v-for="note in sessionNotes" :key="note.id" class="session-note-card">
              <h4>{{ note.title }}</h4>
              <p>{{ note.content }}</p>
              <span class="note-meta">{{ new Date(note.createdAt).toLocaleDateString('zh-CN') }}</span>
            </div>
          </div>
          <div v-else class="notes-empty">
            <svg viewBox="0 0 24 24" width="32" height="32"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M14 2v6h6" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
            <p>暂无答题笔记</p>
            <span class="notes-hint">在答题结果页记录笔记后，会同步显示在这里</span>
          </div>
        </div>
      </div>

      <!-- 详细答题回顾 -->
      <div class="detail-review-panel">
        <div class="chart-header">
          <h3>详细答题回顾</h3>
          <span class="chart-badge">全部</span>
        </div>
        <div class="review-list">
          <div class="review-header">
            <span class="rh-num">题号</span>
            <span class="rh-question">题目</span>
            <span class="rh-answer">你的答案</span>
            <span class="rh-answer">正确答案</span>
            <span class="rh-status">结果</span>
            <span class="rh-time">用时</span>
          </div>
          <div
              v-for="(d, index) in resultData.details"
              :key="index"
              class="review-card"
              :class="{ correct: d.isCorrect, wrong: !d.isCorrect, expanded: expandedRows.has(index) }"
          >
            <div class="review-main" @click="toggleRow(index)">
              <span class="rm-num">{{ index + 1 }}</span>
              <span class="rm-question">
                <span class="question-preview">{{ d.questionText }}</span>
                <span class="expand-hint">
                  <svg v-if="!expandedRows.has(index)" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                  <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
                </span>
              </span>
              <span class="rm-answer" :class="{ wrong: !d.isCorrect }">{{ formatUserAnswer(d) }}</span>
              <span class="rm-answer correct">{{ formatCorrectAnswer(d) }}</span>
              <span class="rm-status">
                <span class="status-badge" :class="{ correct: d.isCorrect, wrong: !d.isCorrect }">{{ d.isCorrect ? '正确' : '错误' }}</span>
              </span>
              <span class="rm-time">{{ timePerQuestion[index]?.seconds || '-' }}s</span>
            </div>
            <div v-if="expandedRows.has(index)" class="review-detail">
              <div class="detail-content">
                <div class="detail-section">
                  <h4 class="detail-label">题目</h4>
                  <p class="detail-question">{{ d.questionText }}</p>
                </div>
                <div class="detail-section">
                  <h4 class="detail-label">选项</h4>
                  <div class="options-list">
                    <div
                        v-for="opt in getAllOptions(d)"
                        :key="opt.key"
                        class="option-row"
                        :class="{
                        'opt-correct': opt.isCorrect,
                        'opt-wrong': opt.isUserWrong,
                        'opt-normal': !opt.isCorrect && !opt.isUserWrong
                      }"
                    >
                      <span class="opt-key">{{ opt.key }}</span>
                      <span class="opt-text">{{ opt.text }}</span>
                      <span v-if="opt.isCorrect" class="opt-tag correct-tag">✓ 正确答案</span>
                      <span v-else-if="opt.isUserWrong" class="opt-tag wrong-tag">✗ 你的答案</span>
                    </div>
                    <div v-if="getAllOptions(d).length === 0" class="options-empty">
                      <div class="options-empty-inner">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                        <span>该题目选项未记录</span>
                        <span class="empty-hint">请重新答题以获取带选项的完整回顾</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="d.explanation" class="detail-section explanation">
                  <h4 class="detail-label">解析</h4>
                  <p class="detail-explanation">{{ d.explanation }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuizStore } from '@/stores';
import { noteManager } from '@/utils/noteManager';
import type { Note } from '@/utils/noteManager';

const router = useRouter();
const route = useRoute();
const quizStore = useQuizStore();
const pageRef = ref<HTMLElement | null>(null);

// 当前时间
const currentTime = ref('');
let timeTimer: ReturnType<typeof setInterval> | null = null;

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleString('zh-CN', { hour12: false });
}

// 全屏状态
const isFullscreen = ref(false);

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    pageRef.value?.requestFullscreen?.().catch(() => {});
    isFullscreen.value = true;
  } else {
    document.exitFullscreen?.().catch(() => {});
    isFullscreen.value = false;
  }
}

function goBack() {
  router.push('/quiz');
}

// ===== 类型定义 =====
interface QuestionDetail {
  isCorrect: boolean;
  questionText: string;
  correctAnswer: string;
  yourAnswer: string;
  timeSpent: number;
  options?: Record<string, string>;
  explanation?: string;
}

interface ResultData {
  accuracy: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  totalPoints: number;
  earnedPoints: number;
  timeSpent: number;
  details: QuestionDetail[];
}

// ===== 原始数据（一次性加载，避免computed中重复解析） =====
const rawLastResult = ref<any>(null);
const rawHistory = ref<any[]>([]);
const expandedRows = ref<Set<number>>(new Set());

function toggleRow(index: number) {
  const newSet = new Set(expandedRows.value);
  if (newSet.has(index)) {
    newSet.delete(index);
  } else {
    newSet.add(index);
  }
  expandedRows.value = newSet;
}

function getOptionClass(d: any, optionKey: string): string {
  if (d.correctAnswer === optionKey) return 'option-correct';
  if (d.yourAnswer === optionKey && !d.isCorrect) return 'option-wrong';
  return '';
}

interface OptionItem {
  key: string;
  text: string;
  isCorrect: boolean;
  isUserWrong: boolean;
}

function getAllOptions(d: any): OptionItem[] {
  const opts: OptionItem[] = [];
  const keys = ['A', 'B', 'C', 'D'];

  // 辅助函数：提取选项文本（支持字符串和 {key,value} 对象）
  function extractText(raw: any): string {
    if (raw === undefined || raw === null) return '';
    if (typeof raw === 'string') {
      // 尝试解析 JSON 字符串
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return String(parsed.value ?? parsed.text ?? parsed.label ?? parsed.content ?? raw);
        }
      } catch { /* 不是 JSON，直接返回 */ }
      return raw;
    }
    if (typeof raw === 'object') {
      return String(raw.value ?? raw.text ?? raw.label ?? raw.content ?? JSON.stringify(raw));
    }
    return String(raw);
  }

  // 尝试从 options/choices 数组读取
  if (Array.isArray(d.options) && d.options.length > 0) {
    d.options.forEach((opt: any, idx: number) => {
      const k = keys[idx] || String(idx + 1);
      opts.push({
        key: k,
        text: extractText(opt) || '—',
        isCorrect: d.correctAnswer === k,
        isUserWrong: !d.isCorrect && d.yourAnswer === k,
      });
    });
    return opts;
  }

  // 尝试标准字段名 optionA / option_a 等
  keys.forEach((k) => {
    const candidates = [
      `option${k}`,
      `option_${k.toLowerCase()}`,
      `option${k.toLowerCase()}`,
      `opt_${k.toLowerCase()}`,
      `choice_${k.toLowerCase()}`,
      `choice${k}`,
      k,
    ];
    let raw: any = undefined;
    for (const ck of candidates) {
      if (d[ck] !== undefined && d[ck] !== null) {
        raw = d[ck];
        break;
      }
    }
    if (raw !== undefined) {
      opts.push({
        key: k,
        text: extractText(raw) || '—',
        isCorrect: d.correctAnswer === k,
        isUserWrong: !d.isCorrect && d.yourAnswer === k,
      });
    }
  });
  return opts;
}

function loadAllData() {
  // 1. 加载最后一次答题结果
  try {
    const fromStore = quizStore.result;
    // 直接使用 store 数据，兼容 null/undefined
    if (fromStore && fromStore.details && fromStore.details.length > 0) {
      rawLastResult.value = { ...fromStore };
      localStorage.setItem('quiz_last_result', JSON.stringify(fromStore));
    } else {
      const saved = JSON.parse(localStorage.getItem('quiz_last_result') || 'null');
      const savedData = saved;
      rawLastResult.value = savedData;
    }
  } catch { rawLastResult.value = null; }

  // 2. 加载答题历史
  try {
    rawHistory.value = JSON.parse(localStorage.getItem('quiz_history') || '[]');
  } catch { rawHistory.value = []; }
}

// 结果数据（基于rawLastResult）
const resultData = computed<ResultData>(() => {
  const r = rawLastResult.value;
  if (r && r.details && r.details.length > 0) {
    return {
      accuracy: Number(r.accuracy) || 0,
      correctAnswers: Number(r.correctAnswers) || 0,
      wrongAnswers: Number(r.totalQuestions || 0) - Number(r.correctAnswers || 0),
      totalQuestions: Number(r.totalQuestions) || 0,
      totalPoints: Number(r.totalPoints) || 0,
      earnedPoints: Number(r.earnedPoints) || 0,
      timeSpent: Number(r.timeSpent) || 0,
      details: r.details || [],
    };
  }
  return { accuracy: 0, correctAnswers: 0, wrongAnswers: 0, totalQuestions: 0, totalPoints: 0, earnedPoints: 0, timeSpent: 0, details: [] };
});

// 答题历史（基于rawHistory）
const quizHistory = computed(() => rawHistory.value);

onMounted(() => {
  updateTime();
  timeTimer = setInterval(updateTime, 1000);
  loadAllData();
});

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer);
});

// 正确率颜色
const accuracyColor = computed(() => {
  const a = resultData.value.accuracy;
  if (a >= 80) return '#7CB342';
  if (a >= 60) return '#C9A96E';
  return '#C75C3A';
});

// 环形图样式
const ringStyle = computed(() => {
  const a = resultData.value.accuracy;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (a / 100) * circumference;
  return {
    strokeDasharray: `${circumference}`,
    strokeDashoffset: `${offset}`,
    stroke: accuracyColor.value,
  };
});

// SVG环形图数据
const correctArc = computed(() => {
  const total = resultData.value.totalQuestions || 1;
  const correct = resultData.value.correctAnswers || 0;
  const circumference = 2 * Math.PI * 70;
  const ratio = correct / total;
  return {
    dash: `${circumference * ratio} ${circumference * (1 - ratio)}`,
    offset: 0,
  };
});

const wrongArc = computed(() => {
  const total = resultData.value.totalQuestions || 1;
  const correct = resultData.value.correctAnswers || 0;
  const circumference = 2 * Math.PI * 70;
  const ratio = (total - correct) / total;
  const offset = -(circumference * correct) / total;
  return {
    dash: `${circumference * ratio} ${circumference * (1 - ratio)}`,
    offset: offset,
  };
});

// 格式化时间
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
}

interface TimeData {
  seconds: number;
  percent: number;
}

// 每题用时（模拟分配）
const timePerQuestion = computed<TimeData[]>(() => {
  const details = resultData.value.details || [];
  const total = resultData.value.timeSpent || 0;
  if (details.length === 0 || total === 0) return [];
  // 平均分配用时，加上一些随机变化
  const base = total / details.length;
  let remaining = total;
  return details.map((_: QuestionDetail, i: number) => {
    const isLast = i === details.length - 1;
    const secs = isLast ? Math.round(remaining) : Math.round(base * (0.6 + Math.sin(i * 1.7) * 0.4 + 0.5));
    if (!isLast) remaining -= secs;
    const maxTime = Math.max(total / details.length * 2, secs || 1);
    return {
      seconds: Math.max(1, secs),
      percent: Math.min(100, ((secs || 1) / maxTime) * 60),
    };
  });
});

// ===== 答案选项格式化（核心修复：把字母映射成"字母 + 选项文本"） =====
function getOptionText(d: any, key: string): string {
  const map: Record<string, string> = {
    A: d.optionA || '',
    B: d.optionB || '',
    C: d.optionC || '',
    D: d.optionD || '',
  };
  return map[key] || '';
}

function formatUserAnswer(d: any): string {
  if (!d.yourAnswer) return '-';
  const text = getOptionText(d, d.yourAnswer);
  return text ? `${d.yourAnswer}. ${text}` : d.yourAnswer;
}

function formatCorrectAnswer(d: any): string {
  const text = getOptionText(d, d.correctAnswer);
  return text ? `${d.correctAnswer}. ${text}` : d.correctAnswer;
}

// ===== 雷达图 =====
const radarLabels = ['基础认知', '历史朝代', '建筑结构', '工艺技术', '文化理解', '综合应用'];
// 基于正确率和题目内容生成确定性雷达图数据
const radarValues = computed(() => {
  const base = resultData.value.accuracy || 50;
  const details = resultData.value.details || [];
  // 按知识点分类统计正确率
  const dimCounts: Record<string, { correct: number; total: number }> = {};
  details.forEach((d: any) => {
    const cat = classifyKnowledge(d.questionText || '');
    if (!dimCounts[cat]) dimCounts[cat] = { correct: 0, total: 0 };
    dimCounts[cat].total++;
    if (d.isCorrect) dimCounts[cat].correct++;
  });
  // 6个维度的映射（确定性，不使用Math.random）
  const dims = ['古建筑基础', '历史知识', '结构认知', '工艺技法', '文化理解', '综合应用'];
  return dims.map(dim => {
    const c = dimCounts[dim];
    if (c && c.total > 0) {
      return Math.min(100, Math.max(20, Math.round((c.correct / c.total) * 100)));
    }
    // 无数据时使用基于base的确定性偏移
    const hash = dim.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0);
    const offset = (hash % 20) - 10;
    return Math.min(100, Math.max(20, base + offset));
  });
});

function getRadarPoints(scale: number): string {
  const count = 6;
  const radius = 80 * scale;
  let points = '';
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const x = 100 + radius * Math.cos(angle);
    const y = 100 + radius * Math.sin(angle);
    points += `${x},${y} `;
  }
  return points.trim();
}

function getAxisEnd(index: number): { x: number; y: number } {
  const count = 6;
  const radius = 80;
  const angle = (Math.PI * 2 * (index - 1)) / count - Math.PI / 2;
  return {
    x: 100 + radius * Math.cos(angle),
    y: 100 + radius * Math.sin(angle),
  };
}

function getLabelPos(index: number): { x: number; y: number } {
  const count = 6;
  const radius = 95;
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: 100 + radius * Math.cos(angle),
    y: 100 + radius * Math.sin(angle) + 4,
  };
}

const radarPointCoords = computed(() => {
  const vals = radarValues.value;
  return vals.map((v, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const r = (v / 100) * 80;
    return { x: 100 + r * Math.cos(angle), y: 100 + r * Math.sin(angle) };
  });
});

const radarDataPoints = computed(() => {
  return radarPointCoords.value.map(p => `${p.x},${p.y}`).join(' ');
});

// ===== 历史趋势图 =====
const sessionNotes = computed<Note[]>(() => noteManager.getUserNotes().filter(n => n.tags.includes('答题')));

const trendPoints = computed(() => {
  // 从localStorage读取历史 + 当前数据
  let history: any[] = [];
  try {
    history = JSON.parse(localStorage.getItem('quiz_history') || '[]');
  } catch { /* ignore */ }
  // 添加当前结果
  const current = {
    accuracy: resultData.value.accuracy,
    date: '本次',
  };
  const all = [...history.slice(-6), current];
  const maxAcc = Math.max(...all.map(d => d.accuracy || 0), 100);
  const minAcc = Math.min(...all.map(d => d.accuracy || 0), 0);
  const range = maxAcc - minAcc || 100;

  return all.map((d, i) => {
    const x = 50 + (i / Math.max(all.length - 1, 1)) * 630;
    const y = 160 - ((d.accuracy - minAcc) / range) * 130;
    return { x, y, label: d.date || `T${i + 1}` };
  });
});

const trendLinePoints = computed(() => {
  return trendPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

const trendAreaPoints = computed(() => {
  const pts = trendPoints.value;
  if (pts.length < 2) return '';
  return `${pts[0].x},160 ${trendLinePoints.value} ${pts[pts.length - 1].x},160`;
});

// ===== 知识点统计 =====
// 从题目文本中提取关键词分类到知识点维度
function classifyKnowledge(questionText: string): string {
  const t = (questionText || '').toLowerCase();
  if (t.includes('结构') || t.includes('斗拱') || t.includes('榫卯') || t.includes('梁') || t.includes('柱') || t.includes('檐') || t.includes('顶')) return '结构认知';
  if (t.includes('朝代') || t.includes('年代') || t.includes('历史') || t.includes('始建于') || t.includes('建于')) return '历史知识';
  if (t.includes('工艺') || t.includes('技法') || t.includes('雕刻') || t.includes('彩绘') || t.includes('砖') || t.includes('瓦')) return '工艺技法';
  if (t.includes('文化') || t.includes('哲学') || t.includes('风水') || t.includes('礼制') || t.includes('园林') || t.includes('意境')) return '文化理解';
  return '古建筑基础';
}

const knowledgeStats = computed(() => {
  const details = resultData.value.details || [];
  if (!details.length) {
    return [
      { name: '古建筑基础', percent: 0 },
      { name: '结构认知', percent: 0 },
      { name: '历史知识', percent: 0 },
      { name: '工艺技法', percent: 0 },
      { name: '文化理解', percent: 0 },
    ];
  }
  // 基于用户答题详情分类统计
  const cats: Record<string, { total: number; correct: number }> = {};
  for (const d of details) {
    const cat = classifyKnowledge(d.questionText || '');
    if (!cats[cat]) cats[cat] = { total: 0, correct: 0 };
    cats[cat].total++;
    if (d.isCorrect) cats[cat].correct++;
  }
  // 确保所有维度都有数据
  const allCats = ['古建筑基础', '结构认知', '历史知识', '工艺技法', '文化理解'];
  return allCats.map(name => {
    const c = cats[name];
    if (!c || c.total === 0) return { name, percent: 0 };
    return { name, percent: Math.round((c.correct / c.total) * 100) };
  });
});
</script>

<style scoped>
/* ============ 大屏分析页面 ============ */
.analytics-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0D0B09 0%, #1A1714 50%, #141210 100%);
  color: #E8E2D9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow-x: hidden;
}

/* 顶部导航 */
.analytics-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 32px;
  background: rgba(13, 11, 9, 0.85);
  backdrop-filter: blur(20px) saturate(1.4);
  border-bottom: 1px solid rgba(201, 169, 110, 0.1);
}
.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header-title {
  font-family: 'Noto Serif SC', 'SimSun', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #C9A96E;
  letter-spacing: 0.06em;
}
.back-btn, .fullscreen-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid rgba(201, 169, 110, 0.2);
  background: rgba(201, 169, 110, 0.06);
  color: #E8E2D9;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.25s ease;
}
.back-btn:hover, .fullscreen-btn:hover {
  background: rgba(201, 169, 110, 0.15);
  border-color: #C9A96E;
  transform: translateY(-1px);
}
.header-time {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.05em;
}

/* 主体内容 */
.analytics-body {
  padding: 24px 32px 48px;
  max-width: 1600px;
  margin: 0 auto;
}

/* 顶部统计卡片行 */
.stats-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.06) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid rgba(201, 169, 110, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}
.stat-card:hover {
  border-color: rgba(201, 169, 110, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.stat-card.primary {
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.1) 0%, rgba(201, 169, 110, 0.03) 100%);
  border-color: rgba(201, 169, 110, 0.2);
}
.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(201, 169, 110, 0.1);
  font-size: 1.5rem;
  flex-shrink: 0;
}
.stat-icon.correct { background: rgba(91, 123, 76, 0.15); }
.stat-icon.wrong { background: rgba(199, 92, 58, 0.15); }
.stat-icon.time { background: rgba(100, 149, 237, 0.1); }
.stat-icon.score { background: rgba(201, 169, 110, 0.15); }
.stat-info { flex: 1; }
.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #C9A96E;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.stat-value.correct { color: #7CB342; }
.stat-value.wrong { color: #C75C3A; }
.stat-value.score { color: #D4A843; }
.stat-label {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.45);
  margin-top: 2px;
  letter-spacing: 0.04em;
}
.stat-ring {
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 90px;
  height: 90px;
  opacity: 0.5;
}
.ring-bg {
  fill: none;
  stroke: rgba(255,255,255,0.06);
  stroke-width: 6;
}
.ring-fill {
  fill: none;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 1.5s ease;
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 20px;
  margin-bottom: 20px;
}
.charts-grid.bottom {
  grid-template-columns: 300px 1fr 300px;
}

.chart-panel {
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.04) 0%, rgba(255,255,255,0.015) 100%);
  border: 1px solid rgba(201, 169, 110, 0.08);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}
.chart-panel:hover {
  border-color: rgba(201, 169, 110, 0.18);
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}
.chart-panel.wide {
  grid-column: span 1;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.chart-header h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.03em;
}
.chart-badge {
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(201, 169, 110, 0.1);
  color: #C9A96E;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.chart-body {
  min-height: 220px;
}
.chart-body.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 环形图 */
.donut-chart {
  width: 180px;
  height: 180px;
  transition: all 0.5s ease;
}
.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: rgba(255,255,255,0.6);
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* 逐题柱状图 */
.question-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.q-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.q-bar-label {
  width: 28px;
  font-size: 0.6875rem;
  color: rgba(255,255,255,0.4);
  text-align: center;
  flex-shrink: 0;
}
.q-bar-track {
  flex: 1;
  height: 18px;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  overflow: hidden;
}
.q-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.6s ease;
}
.q-bar-fill.correct { background: linear-gradient(90deg, #5B7B4C, #7CB342); }
.q-bar-fill.wrong { background: linear-gradient(90deg, #8B3A2A, #C75C3A); }
.q-bar-status {
  width: 20px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-align: center;
  flex-shrink: 0;
}
.q-bar-status.correct { color: #7CB342; }
.q-bar-status.wrong { color: #C75C3A; }

/* 雷达图 */
.radar-chart {
  width: 200px;
  height: 200px;
}

/* 用时柱状图 */
.time-bars {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.time-bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.time-label {
  width: 26px;
  font-size: 0.625rem;
  color: rgba(255,255,255,0.35);
  text-align: center;
  flex-shrink: 0;
}
.time-track {
  flex: 1;
  height: 14px;
  background: rgba(255,255,255,0.04);
  border-radius: 5px;
  overflow: hidden;
}
.time-fill {
  height: 100%;
  border-radius: 5px;
  background: linear-gradient(90deg, rgba(201, 169, 110, 0.5), rgba(201, 169, 110, 0.8));
  transition: width 0.8s ease;
}
.time-value {
  width: 30px;
  font-size: 0.625rem;
  color: rgba(255,255,255,0.4);
  text-align: right;
  flex-shrink: 0;
}

/* 趋势图 */
.trend-chart {
  width: 100%;
  height: 200px;
}

/* 知识点掌握 */
.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.knowledge-name {
  font-size: 0.8125rem;
  color: rgba(255,255,255,0.7);
}
.knowledge-percent {
  font-size: 0.8125rem;
  font-weight: 700;
}
.knowledge-percent.strong { color: #7CB342; }
.knowledge-percent.weak { color: #C75C3A; }
.knowledge-percent:not(.strong):not(.weak) { color: #C9A96E; }
.knowledge-track {
  height: 8px;
  background: rgba(255,255,255,0.06);
  border-radius: 4px;
  overflow: hidden;
}
.knowledge-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease;
}
.knowledge-fill.strong { background: linear-gradient(90deg, #5B7B4C, #7CB342); }
.knowledge-fill.medium { background: linear-gradient(90deg, #9A8548, #C9A96E); }
.knowledge-fill.weak { background: linear-gradient(90deg, #8B3A2A, #C75C3A); }

/* ===== 详细答题回顾 - Div卡片布局 ===== */
.detail-review-panel {
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.04) 0%, rgba(255,255,255,0.015) 100%);
  border: 1px solid rgba(201, 169, 110, 0.08);
  border-radius: 16px;
  padding: 20px;
  margin-top: 20px;
}
.review-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.review-header {
  display: grid;
  grid-template-columns: 50px 1fr 90px 90px 70px 60px;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(201, 169, 110, 0.08);
  color: #C9A96E;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(201, 169, 110, 0.12);
  border-radius: 10px 10px 0 0;
}
.review-card {
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: all 0.2s ease;
}
.review-card.correct {
  border-left: 2px solid #7CB342;
}
.review-card.wrong {
  border-left: 2px solid #C75C3A;
}
.review-card:last-child {
  border-bottom: none;
  border-radius: 0 0 10px 10px;
}
.review-main {
  display: grid;
  grid-template-columns: 50px 1fr 90px 90px 70px 60px;
  gap: 8px;
  padding: 12px 14px;
  align-items: center;
  cursor: pointer;
  color: rgba(255,255,255,0.75);
  font-size: 0.8125rem;
  transition: background 0.2s ease;
}
.review-main:hover {
  background: rgba(201, 169, 110, 0.05);
}
.review-card.expanded .review-main {
  background: rgba(201, 169, 110, 0.06);
}
.rm-num {
  font-weight: 700;
  color: rgba(255,255,255,0.5);
}
.rm-question {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}
.rm-question .question-preview {
  display: inline-block;
  max-width: calc(100% - 28px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.expand-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: rgba(201, 169, 110, 0.5);
  transition: color 0.2s ease;
  flex-shrink: 0;
}
.review-main:hover .expand-hint {
  color: #C9A96E;
}
.rm-answer {
  font-weight: 600;
}
.rm-answer.correct { color: #7CB342; }
.rm-answer.wrong { color: #C75C3A; }
.rm-status {
  display: flex;
  justify-content: center;
}
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.6875rem;
  font-weight: 600;
}
.status-badge.correct {
  background: rgba(91, 123, 76, 0.2);
  color: #7CB342;
}
.status-badge.wrong {
  background: rgba(199, 92, 58, 0.2);
  color: #C75C3A;
}
.rm-time {
  color: rgba(255,255,255,0.4);
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.75rem;
}

/* 展开详情 */
.review-detail {
  animation: expandIn 0.3s ease both;
  overflow: hidden;
}
.review-detail .detail-content {
  padding: 16px 20px 20px 72px;
  background: linear-gradient(180deg, rgba(201, 169, 110, 0.03) 0%, rgba(13, 11, 9, 0.3) 100%);
  border-top: 1px solid rgba(201, 169, 110, 0.06);
}
.detail-section {
  margin-bottom: 20px;
}
.detail-section:last-child {
  margin-bottom: 0;
}
.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #C9A96E;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.detail-question {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.92);
  margin: 0;
  font-weight: 500;
}

/* 选项列表 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 800px;
}
.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  transition: all 0.2s ease;
  min-height: 44px;
}
.option-row:hover {
  border-color: rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.04);
}
.option-row.opt-correct {
  border-color: rgba(91, 123, 76, 0.5);
  background: rgba(91, 123, 76, 0.1);
}
.option-row.opt-correct .opt-key {
  background: rgba(91, 123, 76, 0.25);
  color: #8BC34A;
}
.option-row.opt-correct .opt-text {
  color: rgba(255,255,255,0.95);
  font-weight: 500;
}
.option-row.opt-wrong {
  border-color: rgba(199, 92, 58, 0.5);
  background: rgba(199, 92, 58, 0.1);
}
.option-row.opt-wrong .opt-key {
  background: rgba(199, 92, 58, 0.25);
  color: #E57373;
}
.option-row.opt-wrong .opt-text {
  color: rgba(255,255,255,0.95);
  font-weight: 500;
}
.option-row.opt-normal .opt-key {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.55);
}
.option-row.opt-normal .opt-text {
  color: rgba(255,255,255,0.65);
}
.opt-key {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.8125rem;
  font-weight: 700;
  flex-shrink: 0;
}
.opt-text {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.5;
}
.opt-tag {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}
.correct-tag {
  color: #8BC34A;
  background: rgba(91, 123, 76, 0.18);
}
.wrong-tag {
  color: #E57373;
  background: rgba(199, 92, 58, 0.18);
}
.options-empty {
  padding: 20px 16px;
  text-align: center;
  border: 1px dashed rgba(201, 169, 110, 0.15);
  border-radius: 10px;
}
.options-empty-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.4);
  font-size: 0.875rem;
}
.options-empty-inner svg {
  opacity: 0.5;
  margin-bottom: 2px;
}
.empty-hint {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.25);
}

/* 解析 */
.explanation .detail-explanation {
  font-size: 0.875rem;
  line-height: 1.8;
  color: rgba(255,255,255,0.7);
  margin: 0;
  padding: 14px 18px;
  border-radius: 10px;
  background: rgba(201, 169, 110, 0.05);
  border-left: 3px solid rgba(201, 169, 110, 0.4);
}

@keyframes expandIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.stat-card { animation: fadeInUp 0.5s ease both; }
.stat-card:nth-child(1) { animation-delay: 0s; }
.stat-card:nth-child(2) { animation-delay: 0.08s; }
.stat-card:nth-child(3) { animation-delay: 0.16s; }
.stat-card:nth-child(4) { animation-delay: 0.24s; }
.stat-card:nth-child(5) { animation-delay: 0.32s; }

/* ===== 答题笔记 ===== */
.notes-panel { background: rgba(201, 169, 110, 0.04); border: 1px solid rgba(201, 169, 110, 0.08); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
.notes-body { padding: 4px; }
.session-notes-list { display: flex; flex-direction: column; gap: 12px; }
.session-note-card { background: rgba(13, 11, 9, 0.6); border: 1px solid rgba(201, 169, 110, 0.08); border-radius: 12px; padding: 16px; }
.session-note-card h4 { font-family: 'Noto Serif SC', 'SimSun', serif; font-size: 0.9375rem; font-weight: 600; color: #E8E2D9; margin-bottom: 6px; }
.session-note-card p { font-size: 0.8125rem; color: rgba(255,255,255,0.5); line-height: 1.6; margin-bottom: 6px; }
.session-note-card .note-meta { font-size: 0.75rem; color: rgba(255,255,255,0.35); }
.notes-empty { display: flex; flex-direction: column; align-items: center; padding: 32px; color: rgba(255,255,255,0.5); text-align: center; }
.notes-empty svg { margin-bottom: 8px; opacity: 0.4; }
.notes-empty p { font-size: 0.875rem; margin-bottom: 4px; }
.notes-hint { font-size: 0.75rem; color: rgba(255,255,255,0.35); }

/* ===== 响应式适配 - 平板端 (1024px - 768px) ===== */
@media screen and (max-width: 1024px) {
  .analytics-header {
    padding: 12px 20px;
  }
  .header-title {
    font-size: 1.125rem;
  }
  .back-btn span, .fullscreen-btn span {
    display: none;
  }
  .back-btn, .fullscreen-btn {
    padding: 8px;
    min-width: 40px;
    justify-content: center;
  }
  .analytics-body {
    padding: 20px 20px 40px;
  }
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .stat-card.primary {
    grid-column: span 2;
  }
  .charts-grid {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .charts-grid.bottom {
    grid-template-columns: 1fr 1fr;
  }
  .chart-panel.wide {
    grid-column: span 2;
  }
  .donut-chart {
    width: 160px;
    height: 160px;
  }
  .radar-chart {
    width: 180px;
    height: 180px;
  }
  .stat-value {
    font-size: 1.5rem;
  }
  .review-header {
    grid-template-columns: 45px 1fr 80px 80px 60px 50px;
    font-size: 0.6875rem;
  }
  .review-main {
    grid-template-columns: 45px 1fr 80px 80px 60px 50px;
    font-size: 0.75rem;
  }
}

/* ===== 响应式适配 - 移动端 (767px - 480px) ===== */
@media screen and (max-width: 767px) {
  .analytics-header {
    padding: 10px 16px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .header-left, .header-right {
    width: 100%;
    justify-content: space-between;
  }
  .header-title {
    font-size: 1rem;
  }
  .header-time {
    display: none;
  }
  .analytics-body {
    padding: 16px 16px 32px;
  }
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .stat-card.primary {
    grid-column: span 2;
  }
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
  .stat-value {
    font-size: 1.25rem;
  }
  .stat-label {
    font-size: 0.6875rem;
  }
  .stat-ring {
    width: 70px;
    height: 70px;
  }
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .charts-grid.bottom {
    grid-template-columns: 1fr;
  }
  .chart-panel.wide {
    grid-column: span 1;
  }
  .chart-header h3 {
    font-size: 0.8125rem;
  }
  .chart-body {
    min-height: 180px;
  }
  .donut-chart {
    width: 140px;
    height: 140px;
  }
  .radar-chart {
    width: 160px;
    height: 160px;
  }
  .trend-chart {
    height: 160px;
  }
  .review-header {
    grid-template-columns: 40px 1fr 70px;
  }
  .review-header .rh-answer:nth-child(3),
  .review-header .rh-answer:nth-child(4),
  .review-header .rh-status,
  .review-header .rh-time {
    display: none;
  }
  .review-main {
    grid-template-columns: 40px 1fr 70px;
    gap: 6px;
    padding: 10px 12px;
  }
  .rm-answer, .rm-status, .rm-time {
    display: none;
  }
  .rm-question {
    gap: 4px;
  }
  .question-preview {
    max-width: calc(100% - 24px);
  }
  .expand-hint {
    width: 18px;
    height: 18px;
  }
  .review-detail .detail-content {
    padding: 12px 16px 16px 56px;
  }
  .detail-question {
    font-size: 0.875rem;
    line-height: 1.6;
  }
  .option-row {
    padding: 10px 12px;
    min-height: 40px;
  }
  .opt-key {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }
  .opt-text {
    font-size: 0.8125rem;
  }
  .opt-tag {
    font-size: 0.625rem;
    padding: 2px 8px;
  }
  .notes-panel {
    padding: 16px;
  }
  .session-note-card {
    padding: 12px;
  }
  .session-note-card h4 {
    font-size: 0.875rem;
  }
  .session-note-card p {
    font-size: 0.75rem;
  }
}

/* ===== 响应式适配 - 小屏移动端 (< 480px) ===== */
@media screen and (max-width: 479px) {
  .analytics-header {
    padding: 8px 12px;
  }
  .header-title {
    font-size: 0.875rem;
    letter-spacing: 0.04em;
  }
  .analytics-body {
    padding: 12px 12px 24px;
  }
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .stat-card.primary {
    grid-column: span 2;
  }
  .stat-card {
    padding: 14px;
    gap: 10px;
  }
  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 1.125rem;
  }
  .stat-value {
    font-size: 1.125rem;
  }
  .stat-label {
    font-size: 0.625rem;
  }
  .stat-ring {
    width: 60px;
    height: 60px;
    right: -8px;
  }
  .chart-panel {
    padding: 14px;
  }
  .chart-header {
    margin-bottom: 10px;
  }
  .chart-header h3 {
    font-size: 0.75rem;
  }
  .chart-badge {
    font-size: 0.625rem;
    padding: 2px 8px;
  }
  .chart-body {
    min-height: 150px;
  }
  .donut-chart {
    width: 120px;
    height: 120px;
  }
  .radar-chart {
    width: 140px;
    height: 140px;
  }
  .legend-item {
    font-size: 0.75rem;
    gap: 6px;
  }
  .legend-dot {
    width: 8px;
    height: 8px;
  }
  .q-bar-row {
    gap: 6px;
  }
  .q-bar-label {
    width: 24px;
    font-size: 0.625rem;
  }
  .q-bar-track {
    height: 14px;
  }
  .q-bar-status {
    width: 18px;
    font-size: 0.625rem;
  }
  .time-bar-row {
    gap: 4px;
  }
  .time-label {
    width: 22px;
    font-size: 0.5625rem;
  }
  .time-track {
    height: 12px;
  }
  .time-value {
    width: 26px;
    font-size: 0.5625rem;
  }
  .knowledge-name {
    font-size: 0.75rem;
  }
  .knowledge-percent {
    font-size: 0.75rem;
  }
  .knowledge-track {
    height: 6px;
  }
  .review-header {
    grid-template-columns: 35px 1fr 60px;
    padding: 10px 10px;
    font-size: 0.625rem;
  }
  .review-main {
    grid-template-columns: 35px 1fr 60px;
    padding: 8px 10px;
    font-size: 0.75rem;
  }
  .rm-num {
    font-size: 0.75rem;
  }
  .review-detail .detail-content {
    padding: 10px 12px 12px 48px;
  }
  .detail-label {
    font-size: 0.6875rem;
    margin-bottom: 6px;
  }
  .detail-question {
    font-size: 0.8125rem;
  }
  .option-row {
    padding: 8px 10px;
    gap: 10px;
    min-height: 36px;
  }
  .opt-key {
    width: 22px;
    height: 22px;
    font-size: 0.75rem;
  }
  .opt-text {
    font-size: 0.75rem;
  }
  .detail-explanation {
    font-size: 0.75rem;
    line-height: 1.6;
    padding: 10px 14px;
  }
  .notes-panel {
    padding: 12px;
  }
  .notes-empty {
    padding: 24px 16px;
  }
  .notes-empty svg {
    width: 28px;
    height: 28px;
  }
  .notes-empty p {
    font-size: 0.75rem;
  }
}
</style>
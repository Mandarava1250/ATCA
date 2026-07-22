<template>
  <div class="page">
    <Navbar />
    <!-- 竞赛进行状态 -->
    <div class="container page-content" v-if="quizStore.session && !quizStore.result">
      <div class="quiz-header">
        <div class="quiz-progress">
          <span>{{ $t('quiz.play.question') }} {{ currentIndex + 1 }} / {{ totalQuestions }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
        <div class="quiz-timer" :class="{ 'timer-warning': timeRemaining < 60 }">
          <span>&#9201; {{ formatTime(timeRemaining) }}</span>
        </div>
      </div>

      <div class="question-card" v-if="currentQuestion">
        <h2 class="question-text">{{ currentQuestion.questionText }}</h2>
        <div class="options-list">
          <button
              v-for="opt in options"
              :key="opt.key"
              class="option-btn"
              :class="{ selected: selectedAnswer === opt.key }"
              @click="selectAnswer(opt.key)"
          >
            <span class="option-key">{{ opt.key }}</span>
            <span class="option-text">{{ opt.value }}</span>
          </button>
        </div>
      </div>

      <div class="quiz-actions">
        <button
            v-if="currentIndex > 0"
            class="atca-btn atca-btn-secondary"
            @click="prevQuestion"
        >
          {{ $t('quiz.play.prev') }}
        </button>
        <button
            v-if="currentIndex < totalQuestions - 1"
            class="atca-btn atca-btn-primary"
            :disabled="!selectedAnswer"
            @click="nextQuestion"
        >
          {{ $t('quiz.play.next') }}
        </button>
        <button
            v-else
            class="atca-btn atca-btn-primary"
            :disabled="!selectedAnswer"
            @click="submitQuiz"
        >
          {{ $t('quiz.play.submit') }}
        </button>
      </div>
    </div>

    <!-- 结果展示状态 -->
    <div class="container page-content" v-else-if="quizStore.result">
      <div class="result-card">
        <div class="result-header">
          <h2 class="atca-title atca-title-lg">{{ $t('quiz.result.title') }}</h2>
          <div class="result-score">{{ quizStore.result.accuracy }}%</div>
        </div>
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-num">{{ quizStore.result.correctAnswers }}</span>
            <span>{{ $t('quiz.result.correct') }}</span>
          </div>
          <div class="result-stat">
            <span class="result-num">{{ quizStore.result.totalQuestions - quizStore.result.correctAnswers }}</span>
            <span>{{ $t('quiz.result.wrong') }}</span>
          </div>
          <div class="result-stat">
            <span class="result-num">{{ quizStore.result.earnedPoints }}</span>
            <span>{{ $t('quiz.result.earned') }}</span>
          </div>
          <div class="result-stat">
            <span class="result-num">{{ formatTime(quizStore.result.timeSpent) }}</span>
            <span>{{ $t('quiz.result.timeSpent') }}</span>
          </div>
        </div>
        <!-- 记录笔记 -->
        <div class="notes-section">
          <h3>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M14 2v6h6" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
            答题笔记
          </h3>
          <textarea v-model="sessionNote" class="notes-textarea" placeholder="记录本次答题的收获和心得..." rows="3"></textarea>
          <div class="notes-actions">
            <button class="atca-btn atca-btn-primary atca-btn-sm" @click="saveSessionNote">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              保存笔记
            </button>
          </div>
        </div>

        <!-- 答题回顾已移至大屏分析页面 /quiz/analytics -->
        <div class="result-actions">
          <router-link to="/quiz/analytics" class="atca-btn analytics-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right:6px"><path d="M3 3v18h18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 16l4-8 4 4 4-10" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            大屏分析
          </router-link>
          <router-link to="/quiz" class="atca-btn atca-btn-primary">{{ $t('quiz.result.tryAgain') }}</router-link>
          <router-link to="/home" class="atca-btn atca-btn-secondary">{{ $t('quiz.result.backHome') }}</router-link>
        </div>
      </div>
    </div>

    <!-- 加载/错误状态 -->
    <div class="container page-content" v-else>
      <div class="quiz-loading" v-if="loading">
        <div class="atca-spinner"></div>
        <p>{{ $t('quiz.play.loading') }}</p>
      </div>
      <div class="quiz-error" v-else-if="errorMsg">
        <svg viewBox="0 0 24 24" width="48" height="48"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        <p>{{ errorMsg }}</p>
        <router-link to="/quiz" class="atca-btn atca-btn-primary">{{ $t('quiz.play.backToQuiz') }}</router-link>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onBeforeMount, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import { useQuizStore, useCheckinStore } from '@/stores';
import { quizApi } from '@/services/api';
import { noteManager } from '@/utils/noteManager';
import { createLogger } from '@/utils/logger';
import { logMount, logUnmount, logTimerStart, logTimerStop } from '@/utils/memoryLifecycle';

const logger = createLogger('ViewQuizPlay');
const perfLogger = logger.child('Performance');

const route = useRoute();
const router = useRouter();
const quizStore = useQuizStore();
const checkinStore = useCheckinStore();

const currentIndex = ref(0);
const selectedAnswer = ref('');
const timeRemaining = ref(0);
const loading = ref(true);
const errorMsg = ref('');
const sessionNote = ref('');
let timer: ReturnType<typeof setInterval> | null = null;
let mountStartTime = 0;

// 错题回顾模式
const isReviewMode = ref(false);
const reviewQuestionIds = ref<number[]>([]);

const totalQuestions = computed(() => quizStore.session?.questions.length || 0);
const currentQuestionRaw = computed(() => quizStore.session?.questions[currentIndex.value] || null);
// 统一字段名兼容性包装
const currentQuestion = computed(() => {
  const q = currentQuestionRaw.value as any;
  if (!q) return null;
  return {
    ...q,
    // 确保以下字段存在（兼容驼峰和下划线）
    questionText: q.questionText ?? q.question_text ?? q.text ?? q.title ?? '',
    questionId: q.questionId ?? q.question_id ?? q.id ?? 0,
    optionA: q.optionA ?? q.option_a ?? '',
    optionB: q.optionB ?? q.option_b ?? '',
    optionC: q.optionC ?? q.option_c ?? '',
    optionD: q.optionD ?? q.option_d ?? '',
    correctOption: q.correctOption ?? q.correct_option ?? q.correctAnswer ?? q.correct_answer ?? '',
    explanation: q.explanation ?? q.explain ?? '',
  };
});
const progressPercent = computed(() => totalQuestions.value > 0 ? ((currentIndex.value + 1) / totalQuestions.value) * 100 : 0);

const options = computed(() => {
  const q = currentQuestion.value as any;
  if (!q) return [];
  const opts: { key: string; value: string }[] = [];
  // 兼容驼峰和下划线命名
  const optA = q.optionA ?? q.option_a ?? '';
  const optB = q.optionB ?? q.option_b ?? '';
  const optC = q.optionC ?? q.option_c ?? '';
  const optD = q.optionD ?? q.option_d ?? '';
  if (optA) opts.push({ key: 'A', value: optA });
  if (optB) opts.push({ key: 'B', value: optB });
  if (optC) opts.push({ key: 'C', value: optC });
  if (optD) opts.push({ key: 'D', value: optD });
  return opts;
});

function saveSessionNote() {
  if (!sessionNote.value.trim()) return;
  noteManager.create({
    title: `答题笔记 ${new Date().toLocaleDateString('zh-CN')}`,
    content: sessionNote.value,
    tags: ['答题'],
    isPublic: false,
  });
  sessionNote.value = '';
  alert('笔记已保存');
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function selectAnswer(key: string) {
  selectedAnswer.value = key;
  if (currentQuestion.value) {
    const qid = currentQuestion.value.questionId ?? (currentQuestion.value as any).question_id ?? (currentQuestion.value as any).id ?? 0;
    quizStore.setAnswer(String(qid), key);
    logger.debug('选择答案', {
      questionIndex: currentIndex.value,
      questionId: qid,
      answer: key,
    });
  }
}

function nextQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++;
    const q = quizStore.session?.questions[currentIndex.value];
    selectedAnswer.value = q ? (quizStore.answers[String(q.questionId)] || '') : '';
    logger.debug('进入下一题', {
      questionIndex: currentIndex.value,
    });
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    const q = quizStore.session?.questions[currentIndex.value];
    selectedAnswer.value = q ? (quizStore.answers[String(q.questionId)] || '') : '';
    logger.debug('返回上一题', {
      questionIndex: currentIndex.value,
    });
  }
}

async function submitQuiz() {
  if (!quizStore.session) return;
  logger.info('开始提交测验', {
    sessionId: quizStore.session.sessionId,
    questionCount: quizStore.session.questions.length,
    timeRemaining: timeRemaining.value,
  });
  
  if (timer) { clearInterval(timer); timer = null; }

  const questions = quizStore.session.questions;
  const payload = {
    sessionId: quizStore.session.sessionId,
    answers: quizStore.answers,
  };

  const submitStartTime = Date.now();
  try {
    const res = await quizApi.submit(payload);
    if (res.success && res.data) {
      // 后端是唯一正确答案来源（前端题目不含正确答案）
      const backendDetails = res.data.details || [];
      const wrong: number[] = [];

      // 将后端判定结果与前端题目数据合并
      const details = questions.map((q: any) => {
        const qid = q.questionId ?? q.question_id ?? q.id ?? 0;
        const bd = backendDetails.find((d: any) => d.questionId === qid);
        const userAns = quizStore.answers[String(qid)] || '';
        const isCorrect = bd?.isCorrect ?? false;
        if (!isCorrect) wrong.push(Number(qid));
        return {
          questionId: Number(qid),
          questionText: q.questionText ?? q.question_text ?? '',
          yourAnswer: userAns,
          correctAnswer: bd?.correctAnswer || '',
          isCorrect,
          explanation: bd?.explanation || q.explanation || '',
          options: [
            { key: 'A', value: q.optionA ?? q.option_a ?? '' },
            { key: 'B', value: q.optionB ?? q.option_b ?? '' },
            { key: 'C', value: q.optionC ?? q.option_c ?? '' },
            { key: 'D', value: q.optionD ?? q.option_d ?? '' },
          ].filter((o: any) => o.value),
        };
      });

      const correctCount = details.filter((d: any) => d.isCorrect).length;

      perfLogger.perf('测验提交完成', {
        duration: Date.now() - submitStartTime,
        totalQuestions: questions.length,
        correctCount,
        wrongCount: wrong.length,
        accuracy: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
      });

      // 保存错题
      if (wrong.length > 0) {
        const existing: number[] = JSON.parse(localStorage.getItem('quiz_wrong') || '[]');
        const merged = Array.from(new Set([...existing, ...wrong]));
        localStorage.setItem('quiz_wrong', JSON.stringify(merged));
        logger.debug('保存错题', {
          wrongCount: wrong.length,
          totalWrongCount: merged.length,
        });
      }
      const existingWrong: number[] = JSON.parse(localStorage.getItem('quiz_wrong') || '[]');
      const currentQIds = new Set(questions.map((q: any) => Number(q.questionId ?? q.question_id ?? q.id ?? 0)));
      const wrongSet = new Set(wrong.map(Number));
      const remainingWrong = existingWrong.filter(id => {
        const numId = Number(id);
        if (!currentQIds.has(numId)) return true;
        return wrongSet.has(numId);
      });
      localStorage.setItem('quiz_wrong', JSON.stringify(remainingWrong));

      // 保存历史
      try {
        const history = JSON.parse(localStorage.getItem('quiz_history') || '[]');
        history.push({
          accuracy: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
          correctAnswers: correctCount,
          totalQuestions: questions.length,
          earnedPoints: correctCount * 10,
          timeSpent: quizStore.session.timeLimit - timeRemaining.value,
          date: new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          timestamp: Date.now(),
        });
        if (history.length > 20) history.shift();
        localStorage.setItem('quiz_history', JSON.stringify(history));
      } catch { /* ignore */ }

      quizStore.setResult({
        ...res.data,
        earnedPoints: correctCount * 10,
        accuracy: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        totalPoints: res.data?.totalPoints ?? correctCount * 10,
        sessionId: res.data?.sessionId ?? quizStore.session?.sessionId ?? '',
        details,
      } as any);
      syncOfflineResults();

      // 保存到答题历史（用于大屏分析）
      saveQuizHistory(res.data, correctCount, details);

      // 每日打卡：完成答题交卷后才算打卡
      doCheckinAfterSubmit();
    } else {
      logger.error('测验提交失败', {
        error: res.error?.message || '提交失败',
      });
      errorMsg.value = res.error?.message || '提交失败';
      saveOffline(payload);
    }
  } catch (e: any) {
    logger.error('网络异常，测验提交失败', {
      error: e.response?.data?.error?.message || e.message,
    });
    errorMsg.value = '网络异常，已保存到本地，联网后自动同步';
    saveOffline(payload);
    quizStore.setResult({
      accuracy: 0, correctAnswers: 0,
      totalQuestions: quizStore.session.questions.length,
      totalPoints: 0,
      earnedPoints: 0,
      sessionId: quizStore.session.sessionId,
      timeSpent: quizStore.session.timeLimit - timeRemaining.value,
      details: [],
    });
  }
}

/* ========== 每日打卡：完成答题交卷后才算打卡 ========== */
async function doCheckinAfterSubmit() {
  const fromCheckin = sessionStorage.getItem('quiz_from_checkin');
  if (!fromCheckin) return;

  sessionStorage.removeItem('quiz_from_checkin');

  sessionStorage.setItem('from_quiz_play', 'true');

  try {
    const deviceInfo = {
      device_type: getDeviceType(),
      device_info: navigator.userAgent.substring(0, 200),
    };

    const result = await checkinStore.performCheckin(deviceInfo);

    if (result.success) {
      logger.info('打卡成功', { result });
    } else if (result.already_checked) {
      logger.info('今日已打卡，无需重复打卡');
    } else {
      logger.error('打卡失败', { message: result.message });
    }
  } catch (e: any) {
    logger.error('打卡网络异常，将在下次同步时重试', {
      error: e.message,
    });
  }
}

function getDeviceType(): string {
  if (/Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent)) {
    return 'mobile';
  } else if (/Tablet|iPad/.test(navigator.userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

function saveQuizHistory(submitResult: any, correctCount: number, detailList: any[]) {
  const totalQuestions = detailList.length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const earnedPoints = submitResult?.earnedPoints ?? correctCount * 10;
  const timeSpent = submitResult?.timeSpent ?? 0;

  const historyEntry = {
    date: new Date().toLocaleDateString('zh-CN'),
    timestamp: Date.now(),
    accuracy,
    correctAnswers: correctCount,
    totalQuestions,
    totalPoints: submitResult?.totalPoints || earnedPoints,
    earnedPoints,
    timeSpent,
    sessionId: submitResult?.sessionId || quizStore.session?.sessionId || '',
    details: detailList.map(d => ({
      questionId: d.questionId,
      questionText: d.questionText || '',
      isCorrect: d.isCorrect,
      yourAnswer: d.yourAnswer,
      correctAnswer: d.correctAnswer,
      explanation: d.explanation || '',
      options: d.options || [],
    })),
  };
  // 追加到历史
  try {
    const existing = JSON.parse(localStorage.getItem('quiz_history') || '[]');
    existing.push(historyEntry);
    // 最多保留50条
    if (existing.length > 50) existing.shift();
    localStorage.setItem('quiz_history', JSON.stringify(existing));
  } catch { /* ignore */ }
}

function saveOffline(payload: any) {
  const pending = JSON.parse(localStorage.getItem('quiz_pending') || '[]');
  pending.push({ ...payload, savedAt: Date.now() });
  localStorage.setItem('quiz_pending', JSON.stringify(pending));
}

async function syncOfflineResults() {
  const raw = localStorage.getItem('quiz_pending');
  if (!raw) return;
  const pending: any[] = JSON.parse(raw);
  if (!pending.length) return;
  const synced: any[] = [];
  for (const item of pending) {
    try { await quizApi.submit({ sessionId: item.sessionId, answers: item.answers }); synced.push(item); }
    catch { break; }
  }
  if (synced.length > 0) {
    const remaining = pending.filter(p => !synced.includes(p));
    localStorage.setItem('quiz_pending', JSON.stringify(remaining));
  }
}

function startTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    quizStore.tick();
    timeRemaining.value = quizStore.timeRemaining;
    if (timeRemaining.value <= 0) {
      if (timer) { clearInterval(timer); timer = null; }
      submitQuiz();
    }
  }, 1000);
}

onBeforeMount(() => {
  mountStartTime = Date.now();
  logger.info('测验页面准备挂载', {
    timestamp: mountStartTime,
  });
});

onMounted(async () => {
  logMount('ViewQuizPlay');
  const mountedTime = Date.now();
  perfLogger.perf('测验页面挂载完成', {
    duration: mountedTime - mountStartTime,
  });
  
  // 联网时自动同步离线缓存的答题结果
  syncOfflineResults();

  loading.value = true;
  errorMsg.value = '';

  // 清除之前的结果
  quizStore.setResult(null);

  const mode = (route.query.mode as string) || 'entry';
  const type = (route.query.type as string) || 'random';
  isReviewMode.value = type === 'review';
  
  logger.info('开始加载测验', {
    mode,
    type,
    isReviewMode: isReviewMode.value,
  });

  const loadStartTime = Date.now();
  try {
    let res;
    if (isReviewMode.value) {
      // 错题回顾模式：读取 localStorage 中的错题 ID
      const wrongIds: number[] = JSON.parse(localStorage.getItem('quiz_wrong') || '[]');
      reviewQuestionIds.value = wrongIds;
      if (wrongIds.length === 0) {
        errorMsg.value = '暂无错题，先去答题吧！';
        loading.value = false;
        return;
      }
      logger.debug('加载错题回顾', {
        wrongIdsCount: wrongIds.length,
      });
      // 调用获取错题的 API（传入错题 ID 列表）
      res = await quizApi.getQuestions(mode + '?review=1&ids=' + wrongIds.join(','));
    } else {
      res = await quizApi.getQuestions(mode);
    }
    if (res.success && res.data) {
      logger.info('测验加载成功', {
        sessionId: res.data.sessionId,
        questionCount: res.data.questions?.length || 0,
        timeLimit: res.data.timeLimit || 180,
      });
      perfLogger.perf('测验加载完成', {
        duration: Date.now() - loadStartTime,
        questionCount: res.data.questions?.length || 0,
      });
      
      quizStore.setSession({
        sessionId: res.data.sessionId || 'local-' + Date.now(),
        modeId: res.data.mode || mode,
        questions: res.data.questions || [],
        startTime: new Date().toISOString(),
        timeLimit: res.data.timeLimit || 180,
        currentIndex: 0,
        answers: {},
      });
      timeRemaining.value = res.data.timeLimit || 180;
      startTimer();
    } else {
      logger.error('获取题目失败', {
        error: res.error?.message || '获取题目失败',
      });
      errorMsg.value = res.error?.message || '获取题目失败';
    }
  } catch (e: any) {
    logger.error('测验启动错误', {
      error: e.response?.data?.error?.message || e.message,
    });
    errorMsg.value = e.response?.data?.error?.message || '无法连接到服务器';
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  logger.info('测验页面准备卸载', {
    timestamp: Date.now(),
  });
});

onUnmounted(() => {
  logger.info('测验页面已卸载', {
    timestamp: Date.now(),
  });
  if (timer) {
    clearInterval(timer);
    logTimerStop('ViewQuizPlay', 'quiz-timer');
    timer = null;
  }
  logUnmount('ViewQuizPlay');
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}
.page-content {
  flex: 1;
  padding: 90px 16px 40px;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.quiz-loading, .quiz-error {
  text-align: center;
  padding: 80px 24px;
  color: var(--text-muted);
}
.quiz-error svg { margin-bottom: 16px; color: #C75C3A; }
.quiz-error p { margin-bottom: 24px; }

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}
.quiz-progress { flex: 1; min-width: 0; }
.quiz-progress span {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  display: block;
}
.progress-bar {
  height: 4px;
  background: var(--border);
  border-radius: var(--r-full);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-dim), var(--gold));
  border-radius: var(--r-full);
  transition: width var(--t);
}
.quiz-timer {
  font-family: var(--font-mono);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  flex-shrink: 0;
}
.timer-warning { color: #C75C3A; animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.question-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 24px;
  margin-bottom: 16px;
}
.question-text { font-size: 1.125rem; margin-bottom: 20px; line-height: 1.6; color: var(--text); font-weight: 600; }
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 110, 0.03) 100%);
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
  color: var(--text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.option-btn:hover {
  border-color: var(--gold-dim);
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.08) 0%, rgba(201, 169, 110, 0.04) 100%);
  box-shadow: 0 2px 10px rgba(201, 169, 110, 0.1);
  transform: translateX(3px);
}
.option-btn.selected {
  border-color: var(--gold);
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.15) 0%, rgba(201, 169, 110, 0.06) 100%);
  box-shadow: 0 2px 12px rgba(201, 169, 110, 0.18);
  transform: translateX(3px);
}
.option-key {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--bg-hover);
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
  color: var(--text-muted);
  border: 1.5px solid var(--border);
  transition: all 0.2s ease;
}
.option-btn:hover .option-key {
  border-color: var(--gold-dim);
  color: var(--gold);
}
.option-btn.selected .option-key {
  background: linear-gradient(135deg, var(--gold) 0%, #D4B87A 100%);
  color: #1A1714;
  border-color: var(--gold);
  box-shadow: 0 2px 6px rgba(201, 169, 110, 0.3);
}
.option-text { font-size: 0.875rem; color: var(--text); }

.quiz-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 4px; }
.quiz-actions .atca-btn {
  min-width: 100px;
  padding: 9px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.8125rem;
  letter-spacing: 0.03em;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.quiz-actions .atca-btn:hover { transform: translateY(-1px); }
.quiz-actions .atca-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.quiz-actions .atca-btn-secondary {
  background: linear-gradient(135deg, #3A342C 0%, #2A2520 100%);
  color: #E8E0D4;
}
.quiz-actions .atca-btn-secondary:hover {
  background: linear-gradient(135deg, #4A4338 0%, #3A342C 100%);
}
.quiz-actions .atca-btn-primary {
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
  color: #1A1714;
}
.quiz-actions .atca-btn-primary:hover {
  background: linear-gradient(135deg, var(--gold-light) 0%, #E0C88A 100%);
}

/* ===== 结果页 ===== */
.result-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 36px 28px;
  text-align: center;
}
.result-header { margin-bottom: 24px; }
.result-score {
  font-family: var(--font-serif);
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--gold);
  margin-top: 12px;
}
.result-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}
.result-stat {
  background: var(--bg-hover);
  border-radius: var(--r-md);
  padding: 14px 10px;
  color: var(--text-muted);
  font-size: 0.75rem;
}
.result-num {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gold);
  margin-bottom: 4px;
}
.result-review-header { margin-bottom: 20px; }
.result-review-header h3 { margin-bottom: 4px; }
.result-details { text-align: left; margin-bottom: 28px; display: flex; flex-direction: column; gap: 14px; }

/* 笔记区域 */
.notes-section { margin: 24px 0; padding: 20px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-lg); text-align: left; }
.notes-section h3 { font-size: 1rem; color: var(--gold); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.notes-textarea { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--bg-card); color: var(--text); font-size: 0.875rem; resize: vertical; min-height: 80px; font-family: inherit; outline: none; }
.notes-textarea:focus { border-color: var(--gold-dim); }
.notes-actions { display: flex; gap: 8px; margin-top: 10px; }

.detail-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 18px;
  color: var(--text);
}
.detail-card.correct { border-left: 3px solid #7CB342; }
.detail-card.wrong { border-left: 3px solid #C75C3A; }
.detail-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.detail-num { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-hover); font-weight: 700; font-size: 0.8125rem; flex-shrink: 0; }
.detail-card.correct .detail-num { background: rgba(91, 123, 76, 0.2); color: #7CB342; }
.detail-card.wrong .detail-num { background: rgba(199, 92, 58, 0.2); color: #C75C3A; }
.detail-status { font-weight: 600; font-size: 0.8125rem; }
.detail-card.correct .detail-status { color: #7CB342; }
.detail-card.wrong .detail-status { color: #C75C3A; }
.detail-question { font-size: 0.9375rem; font-weight: 500; line-height: 1.6; margin-bottom: 12px; color: var(--text); }
.detail-options { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.detail-opt { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--bg-card); font-size: 0.8125rem; position: relative; }
.opt-key { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-hover); font-weight: 600; font-size: 0.75rem; flex-shrink: 0; }
.opt-correct { border-color: rgba(91, 123, 76, 0.5); background: rgba(91, 123, 76, 0.08); }
.opt-correct .opt-key { background: #7CB342; color: #fff; }
.opt-wrong { border-color: rgba(199, 92, 58, 0.5); background: rgba(199, 92, 58, 0.08); }
.opt-wrong .opt-key { background: #C75C3A; color: #fff; }
.opt-label { margin-left: auto; padding: 2px 8px; border-radius: var(--r-full); font-size: 0.6875rem; font-weight: 600; }
.correct-label { background: rgba(91, 123, 76, 0.2); color: #7CB342; }
.wrong-label { background: rgba(199, 92, 58, 0.2); color: #C75C3A; }
.detail-answers-row { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.da-item { padding: 6px 12px; border-radius: var(--r-md); background: var(--bg-card); border: 1px solid var(--border); font-size: 0.8125rem; color: var(--text-muted); }
.da-item.correct { border-color: rgba(91, 123, 76, 0.4); color: #7CB342; }
.da-item strong { font-weight: 600; }
.detail-explanation { background: rgba(var(--gold-rgb), 0.05); border: 1px solid rgba(var(--gold-rgb), 0.15); border-radius: var(--r-md); padding: 12px; }
.ex-title { font-size: 0.75rem; font-weight: 600; color: var(--gold); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.detail-explanation p { font-size: 0.8125rem; line-height: 1.6; color: var(--text-muted); margin: 0; }
.result-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.analytics-btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 120px; padding: 9px 20px; border-radius: 10px;
  background: linear-gradient(135deg, #7B3FA0 0%, #9B59B6 100%);
  color: #fff; font-weight: 600; font-size: 0.8125rem;
  text-decoration: none; border: none; cursor: pointer;
  box-shadow: 0 4px 16px rgba(123, 63, 160, 0.35);
  transition: all 0.2s ease;
}
.analytics-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(123, 63, 160, 0.5); }
.result-actions .atca-btn {
  min-width: 120px; padding: 9px 20px; border-radius: 10px;
  font-weight: 600; font-size: 0.8125rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: all 0.2s ease;
}

</style>
<template>
  <div class="multi-ai-evaluation-container">
    <!-- 评估状态 -->
    <div v-if="isEvaluating" class="evaluation-status">
      <div class="status-icon">
        <svg class="spinner" viewBox="0 0 24 24" width="24" height="24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="10" />
        </svg>
      </div>
      <div class="status-text">
        <div class="status-title">正在进行多AI模型评估</div>
        <div class="status-detail">分析 {{ evaluationResult?.performance?.aiCount || props.aiResponses.length }} 个AI模型的输出内容...</div>
      </div>
    </div>

    <!-- 评估结果 -->
    <div v-else-if="evaluationResult" class="evaluation-result">
      <!-- 综合摘要 -->
      <div class="result-summary">
        <div class="summary-header">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
          <span class="summary-title">评估完成</span>
          <span class="summary-time">{{ formatTime(evaluationResult.timestamp) }}</span>
        </div>
        
        <!-- 最佳和最差AI -->
        <div class="best-worst-comparison">
          <div class="best-ai">
            <div class="ai-label">最佳表现</div>
            <div class="ai-name">{{ evaluationResult.comparisonReport.summary.bestAI.aiName }}</div>
            <div class="ai-score">{{ evaluationResult.comparisonReport.summary.bestAI.overallScore }}分</div>
          </div>
          <div class="worst-ai">
            <div class="ai-label">待改进</div>
            <div class="ai-name">{{ evaluationResult.comparisonReport.summary.worstAI.aiName }}</div>
            <div class="ai-score">{{ evaluationResult.comparisonReport.summary.worstAI.overallScore }}分</div>
          </div>
          <div class="score-gap">
            <div class="gap-label">分差</div>
            <div class="gap-value">{{ evaluationResult.comparisonReport.summary.scoreGap }}分</div>
          </div>
        </div>

        <!-- 平均分 -->
        <div class="average-scores">
          <div class="avg-score-item">
            <div class="avg-label">准确性</div>
            <div class="avg-value">{{ evaluationResult.comparisonReport.summary.avgScores.accuracy }}</div>
          </div>
          <div class="avg-score-item">
            <div class="avg-label">相关性</div>
            <div class="avg-value">{{ evaluationResult.comparisonReport.summary.avgScores.relevance }}</div>
          </div>
          <div class="avg-score-item">
            <div class="avg-label">完整性</div>
            <div class="avg-value">{{ evaluationResult.comparisonReport.summary.avgScores.completeness }}</div>
          </div>
          <div class="avg-score-item">
            <div class="avg-label">逻辑性</div>
            <div class="avg-value">{{ evaluationResult.comparisonReport.summary.avgScores.logic }}</div>
          </div>
          <div class="avg-score-item">
            <div class="avg-label">专业性</div>
            <div class="avg-value">{{ evaluationResult.comparisonReport.summary.avgScores.professionalism }}</div>
          </div>
        </div>
      </div>

      <!-- 排名 -->
      <div class="ranking-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
          <span>综合排名</span>
        </div>
        <div class="ranking-list">
          <div 
            v-for="item in evaluationResult.comparisonReport.ranking" 
            :key="item.aiId"
            class="ranking-item"
            :class="{ 'rank-1': item.rank === 1, 'rank-2': item.rank === 2, 'rank-3': item.rank === 3 }"
          >
            <div class="rank-badge">{{ item.rank }}</div>
            <div class="rank-ai-name">{{ item.aiName }}</div>
            <div class="rank-score">{{ item.overallScore }}分</div>
          </div>
        </div>
      </div>

      <!-- 维度对比 -->
      <div class="dimension-comparison-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
          <span>维度对比</span>
        </div>
        <div class="dimension-grid">
          <div 
            v-for="(dim, key) in evaluationResult.comparisonReport.dimensionComparison" 
            :key="key"
            class="dimension-item"
          >
            <div class="dim-name">{{ getDimensionName(String(key)) }}</div>
            <div class="dim-best">
              <span class="dim-label">最佳:</span>
              <span class="dim-value">{{ dim.best }}</span>
            </div>
            <div class="dim-worst">
              <span class="dim-label">待改进:</span>
              <span class="dim-value">{{ dim.worst }}</span>
            </div>
            <div class="dim-range">
              <span class="dim-label">差距:</span>
              <span class="dim-value">{{ (dim.range * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 各AI详细评估 -->
      <div class="individual-evaluations-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
          <span>详细评估</span>
        </div>
        <div class="evaluations-list">
          <div 
            v-for="evaluation in evaluationResult.individualEvaluations" 
            :key="evaluation.aiId"
            class="evaluation-card"
          >
            <div class="eval-header">
              <div class="eval-ai-name">{{ evaluation.aiName }}</div>
              <div class="eval-overall-score">{{ evaluation.evaluation.overallScore }}分</div>
            </div>
            
            <!-- 评分详情 -->
            <div class="eval-scores">
              <div class="score-row">
                <span class="score-label">准确性</span>
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: (evaluation.evaluation.accuracy.score * 100) + '%' }"></div>
                </div>
                <span class="score-value">{{ (evaluation.evaluation.accuracy.score * 100).toFixed(0) }}%</span>
              </div>
              <div class="score-row">
                <span class="score-label">相关性</span>
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: (evaluation.evaluation.relevance.score * 100) + '%' }"></div>
                </div>
                <span class="score-value">{{ (evaluation.evaluation.relevance.score * 100).toFixed(0) }}%</span>
              </div>
              <div class="score-row">
                <span class="score-label">完整性</span>
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: (evaluation.evaluation.completeness.score * 100) + '%' }"></div>
                </div>
                <span class="score-value">{{ (evaluation.evaluation.completeness.score * 100).toFixed(0) }}%</span>
              </div>
              <div class="score-row">
                <span class="score-label">逻辑性</span>
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: (evaluation.evaluation.logic.score * 100) + '%' }"></div>
                </div>
                <span class="score-value">{{ (evaluation.evaluation.logic.score * 100).toFixed(0) }}%</span>
              </div>
              <div class="score-row">
                <span class="score-label">专业性</span>
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: (evaluation.evaluation.professionalism.score * 100) + '%' }"></div>
                </div>
                <span class="score-value">{{ (evaluation.evaluation.professionalism.score * 100).toFixed(0) }}%</span>
              </div>
            </div>

            <!-- 优势与不足 -->
            <div class="eval-strengths-weaknesses">
              <div class="sw-section strengths">
                <div class="sw-title">优势</div>
                <ul class="sw-list">
                  <li v-for="strength in evaluation.evaluation.strengths" :key="strength">{{ strength }}</li>
                </ul>
              </div>
              <div class="sw-section weaknesses">
                <div class="sw-title">不足</div>
                <ul class="sw-list">
                  <li v-for="weakness in evaluation.evaluation.weaknesses" :key="weakness">{{ weakness }}</li>
                </ul>
              </div>
            </div>

            <!-- 专业术语 -->
            <div v-if="evaluation.evaluation.professionalism.keyTerms.length > 0" class="eval-key-terms">
              <div class="kt-title">专业术语</div>
              <div class="kt-list">
                <span v-for="term in evaluation.evaluation.professionalism.keyTerms" :key="term" class="kt-tag">{{ term }}</span>
              </div>
            </div>

            <!-- 冲突检测 -->
            <div v-if="evaluation.evaluation.conflictDetection.hasConflicts" class="eval-conflicts">
              <div class="conflicts-title">⚠️ 检测到冲突</div>
              <div class="conflicts-summary">{{ evaluation.evaluation.conflictDetection.summary }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 建议 -->
      <div class="recommendations-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
          <span>综合建议</span>
        </div>
        <div class="recommendations-content">
          <div class="rec-overall">
            <div class="rec-title">整体评价</div>
            <ul class="rec-list">
              <li v-for="rec in evaluationResult.recommendations.overallRecommendations" :key="rec">{{ rec }}</li>
            </ul>
          </div>
          
          <div v-if="evaluationResult.recommendations.scenarioSuggestions.length > 0" class="rec-scenarios">
            <div class="rec-title">适用场景</div>
            <div class="scenario-list">
              <div v-for="scenario in evaluationResult.recommendations.scenarioSuggestions" :key="scenario.aiId" class="scenario-item">
                <div class="scenario-ai">{{ scenario.aiName }}</div>
                <ul class="scenario-applications">
                  <li v-for="app in scenario.scenarios" :key="app">{{ app }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="rec-improvements">
            <div class="rec-title">改进方向</div>
            <ul class="rec-list">
              <li v-for="imp in evaluationResult.recommendations.improvementSuggestions" :key="imp">{{ imp }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 性能信息 -->
      <div class="performance-info">
        <div class="perf-item">
          <span class="perf-label">评估耗时</span>
          <span class="perf-value">{{ evaluationResult.performance.evaluationDuration }}ms</span>
        </div>
        <div class="perf-item">
          <span class="perf-label">AI数量</span>
          <span class="perf-value">{{ evaluationResult.performance.aiCount }}个</span>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="evaluation-error">
      <div class="error-icon">❌</div>
      <div class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface EvaluationResult {
  timestamp: number;
  question: string;
  individualEvaluations: any[];
  comparisonReport: any;
  recommendations: any;
  performance: {
    evaluationDuration: number;
    aiCount: number;
  };
}

const props = defineProps<{
  question: string;
  aiResponses: Array<{ aiId: string; aiName: string; content: string }>;
}>();

const isEvaluating = ref(false);
const evaluationResult = ref<EvaluationResult | null>(null);
const error = ref<string | null>(null);

// 执行评估
async function evaluate() {
  if (props.aiResponses.length < 2) {
    error.value = '至少需要2个AI模型的输出进行对比评估';
    return;
  }

  isEvaluating.value = true;
  error.value = null;
  evaluationResult.value = null;

  try {
    const { assistantApi } = await import('@/services/api');
    const response = await assistantApi.evaluateMultiAI(props.question, props.aiResponses);
    
    if (response.success) {
      evaluationResult.value = response.data;
    } else {
      error.value = (response as any).error?.message || '评估失败';
    }
  } catch (err: any) {
    error.value = err.message || '评估失败';
  } finally {
    isEvaluating.value = false;
  }
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// 获取维度名称
function getDimensionName(key: string): string {
  const names: Record<string, string> = {
    accuracy: '准确性',
    relevance: '相关性',
    completeness: '完整性',
    logic: '逻辑性',
    professionalism: '专业性'
  };
  return names[key] || key;
}

// 暴露方法
defineExpose({
  evaluate
});
</script>

<style scoped>
.multi-ai-evaluation-container {
  width: 100%;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-top: 20px;
}

/* 评估状态 */
.evaluation-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

.status-icon .spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-text {
  text-align: left;
}

.status-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.status-detail {
  font-size: 0.875rem;
  color: #666;
}

/* 评估结果 */
.result-summary {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.summary-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
}

.summary-time {
  margin-left: auto;
  font-size: 0.875rem;
  color: #666;
}

/* 最佳最差对比 */
.best-worst-comparison {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.best-ai, .worst-ai, .score-gap {
  flex: 1;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.best-ai {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.worst-ai {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.score-gap {
  background: #f3f4f6;
  color: #1a1a1a;
}

.ai-label {
  font-size: 0.75rem;
  opacity: 0.9;
  margin-bottom: 8px;
}

.ai-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.ai-score {
  font-size: 1.5rem;
  font-weight: 700;
}

.gap-label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 8px;
}

.gap-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

/* 平均分 */
.average-scores {
  display: flex;
  gap: 12px;
}

.avg-score-item {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  background: #f9fafb;
  border-radius: 6px;
}

.avg-label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 4px;
}

.avg-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

/* 排名 */
.ranking-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 6px;
  transition: all 0.2s;
}

.ranking-item:hover {
  background: #f3f4f6;
}

.ranking-item.rank-1 {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
}

.ranking-item.rank-2 {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 2px solid #9ca3af;
}

.ranking-item.rank-3 {
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
  border: 2px solid #f97316;
}

.rank-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.875rem;
  color: #1a1a1a;
}

.rank-ai-name {
  flex: 1;
  font-weight: 500;
  color: #1a1a1a;
}

.rank-score {
  font-weight: 600;
  color: #059669;
}

/* 维度对比 */
.dimension-comparison-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.dimension-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dimension-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.dim-name {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.dim-best, .dim-worst, .dim-range {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.dim-label {
  color: #666;
}

.dim-value {
  font-weight: 500;
  color: #1a1a1a;
}

/* 详细评估 */
.individual-evaluations-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.evaluations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.evaluation-card {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.eval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.eval-ai-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
}

.eval-overall-score {
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
}

/* 评分条 */
.eval-scores {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-label {
  width: 60px;
  font-size: 0.875rem;
  color: #666;
}

.score-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.3s ease;
}

.score-value {
  width: 50px;
  text-align: right;
  font-weight: 600;
  color: #1a1a1a;
}

/* 优势与不足 */
.eval-strengths-weaknesses {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.sw-section {
  padding: 12px;
  border-radius: 6px;
}

.sw-section.strengths {
  background: #ecfdf5;
  border: 1px solid #d1fae5;
}

.sw-section.weaknesses {
  background: #fef2f2;
  border: 1px solid #fee2e2;
}

.sw-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.sw-section.strengths .sw-title {
  color: #059669;
}

.sw-section.weaknesses .sw-title {
  color: #dc2626;
}

.sw-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sw-list li {
  padding: 4px 0;
  font-size: 0.875rem;
  color: #374151;
}

.sw-list li::before {
  content: '• ';
  margin-right: 4px;
}

/* 专业术语 */
.eval-key-terms {
  margin-bottom: 16px;
}

.kt-title {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.kt-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.kt-tag {
  padding: 4px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* 冲突检测 */
.eval-conflicts {
  padding: 12px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 6px;
}

.conflicts-title {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 4px;
}

.conflicts-summary {
  font-size: 0.875rem;
  color: #78350f;
}

/* 建议 */
.recommendations-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.recommendations-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rec-overall, .rec-scenarios, .rec-improvements {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.rec-title {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.rec-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rec-list li {
  padding: 4px 0;
  font-size: 0.875rem;
  color: #374151;
}

.rec-list li::before {
  content: '✓ ';
  color: #059669;
  margin-right: 8px;
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scenario-item {
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.scenario-ai {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.scenario-applications {
  list-style: none;
  padding: 0;
  margin: 0;
}

.scenario-applications li {
  padding: 2px 0;
  font-size: 0.875rem;
  color: #666;
}

.scenario-applications li::before {
  content: '→ ';
  margin-right: 4px;
}

/* 性能信息 */
.performance-info {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
}

.perf-item {
  flex: 1;
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.perf-label {
  color: #666;
}

.perf-value {
  font-weight: 600;
  color: #1a1a1a;
}

/* 错误状态 */
.evaluation-error {
  text-align: center;
  padding: 40px 20px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.error-message {
  color: #dc2626;
  font-size: 1rem;
}
</style>
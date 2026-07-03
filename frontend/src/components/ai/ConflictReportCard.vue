/**
 * 华夏营造 - 冲突报告卡片组件
 * 展示知识库冲突检测结果
 */

<template>
  <div class="conflict-report" role="region" aria-label="冲突报告">
    <!-- 报告摘要 -->
    <div class="report-summary" :class="summaryClass">
      <div class="summary-header">
        <div class="summary-icon">
          <svg v-if="isConflictFree" viewBox="0 0 24 24" width="24" height="24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
        </div>
        <div class="summary-content">
          <h3 class="summary-title">{{ report.summary }}</h3>
          <p class="summary-time">{{ formatTime(report.timestamp) }}</p>
        </div>
        <button class="toggle-btn" @click="toggleExpanded" :aria-expanded="isExpanded">
          <svg viewBox="0 0 24 24" width="20" height="20" :class="{ rotated: isExpanded }">
            <path d="M19 9l-7 7-7-7" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
        </button>
      </div>
      
      <!-- 统计信息 -->
      <div v-if="!isConflictFree" class="conflict-stats">
        <div v-if="severityCounts.high > 0" class="stat-item high">
          <span class="stat-badge high">{{ severityCounts.high }}</span>
          <span class="stat-label">高危</span>
        </div>
        <div v-if="severityCounts.medium > 0" class="stat-item medium">
          <span class="stat-badge medium">{{ severityCounts.medium }}</span>
          <span class="stat-label">中危</span>
        </div>
        <div v-if="severityCounts.low > 0" class="stat-item low">
          <span class="stat-badge low">{{ severityCounts.low }}</span>
          <span class="stat-label">低危</span>
        </div>
      </div>
    </div>
    
    <!-- 建议 -->
    <div class="report-recommendation" :class="{ warning: hasHighSeverity }">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" fill="none" stroke-width="1.5"/>
      </svg>
      <span>{{ report.recommendation }}</span>
    </div>
    
    <!-- 冲突详情列表 -->
    <Transition name="slide-fade">
      <div v-if="isExpanded && report.conflicts.length > 0" class="conflict-list">
        <div
          v-for="(conflict, index) in report.conflicts"
          :key="conflict.id"
          class="conflict-card"
          :class="conflict.severity"
        >
          <div class="conflict-header" @click="toggleConflict(index)">
            <div class="conflict-severity">
              <span class="severity-badge" :class="conflict.severity">
                {{ severityLabels[conflict.severity] }}
              </span>
            </div>
            <div class="conflict-title">
              <h4>{{ conflict.description }}</h4>
              <p class="conflict-difference">{{ conflict.detectedDifference }}</p>
            </div>
            <button class="expand-icon" :aria-expanded="expandedConflicts[index]">
              <svg viewBox="0 0 24 24" width="16" height="16" :class="{ rotated: expandedConflicts[index] }">
                <path d="M19 9l-7 7-7-7" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          
          <Transition name="slide-fade">
            <div v-if="expandedConflicts[index]" class="conflict-details">
              <!-- 知识库来源 -->
              <div class="detail-section">
                <h5 class="section-title">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" fill="none" stroke-width="1.5"/>
                  </svg>
                  知识库原文
                </h5>
                <div class="source-citation">
                  <p class="source-chapter">{{ conflict.knowledgeSource.chapter }} - {{ conflict.knowledgeSource.paragraph }}</p>
                  <blockquote class="source-content">{{ conflict.knowledgeSource.content }}</blockquote>
                </div>
              </div>
              
              <!-- 分析结果 -->
              <div class="detail-section">
                <h5 class="section-title">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" fill="none" stroke-width="1.5"/>
                  </svg>
                  差异分析
                </h5>
                <div class="analysis-content">
                  <p v-for="(line, i) in conflict.analysis.split('\n')" :key="i">{{ line }}</p>
                </div>
              </div>
              
              <!-- 建议 -->
              <div class="detail-section suggestion">
                <h5 class="section-title">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                  </svg>
                  改进建议
                </h5>
                <div class="suggestion-content">
                  <p v-for="(line, i) in conflict.suggestion.split('\n')" :key="i">{{ line }}</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ConflictReport, ConflictSeverity } from './KnowledgeBaseDetector';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('ConflictReportCard');

interface Props {
  report: ConflictReport;
  autoExpand?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoExpand: false
});

const isExpanded = ref(props.autoExpand && props.report.conflicts.length > 0);
const expandedConflicts = ref<boolean[]>([]);

// 初始化展开状态
onMounted(() => {
  expandedConflicts.value = new Array(props.report.conflicts.length).fill(false);
  if (props.autoExpand && props.report.conflicts.length > 0) {
    expandedConflicts.value[0] = true;
  }
});

// 计算属性
const isConflictFree = computed(() => props.report.conflicts.length === 0);

const hasHighSeverity = computed(() => 
  props.report.conflicts.some(c => c.severity === ConflictSeverity.HIGH)
);

const severityCounts = computed(() => ({
  high: props.report.conflicts.filter(c => c.severity === ConflictSeverity.HIGH).length,
  medium: props.report.conflicts.filter(c => c.severity === ConflictSeverity.MEDIUM).length,
  low: props.report.conflicts.filter(c => c.severity === ConflictSeverity.LOW).length
}));

const severityLabels: Record<string, string> = {
  [ConflictSeverity.HIGH]: '高危',
  [ConflictSeverity.MEDIUM]: '中危',
  [ConflictSeverity.LOW]: '低危'
};

const summaryClass = computed(() => {
  if (isConflictFree.value) return 'success';
  if (hasHighSeverity.value) return 'danger';
  return 'warning';
});

// 方法
function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}

function toggleConflict(index: number) {
  expandedConflicts.value[index] = !expandedConflicts.value[index];
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.conflict-report {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin: 16px 0;
}

/* 摘要 */
.report-summary {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.report-summary.success {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.report-summary.warning {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
}

.report-summary.danger {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
}

.summary-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.summary-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success .summary-icon {
  background: #4caf50;
  color: white;
}

.warning .summary-icon {
  background: #ff9800;
  color: white;
}

.danger .summary-icon {
  background: #f44336;
  color: white;
}

.summary-content {
  flex: 1;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.summary-time {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.toggle-btn {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.toggle-btn svg {
  transition: transform 0.3s;
}

.toggle-btn svg.rotated {
  transform: rotate(180deg);
}

/* 统计 */
.conflict-stats {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.stat-badge.high {
  background: #f44336;
}

.stat-badge.medium {
  background: #ff9800;
}

.stat-badge.low {
  background: #2196f3;
}

.stat-label {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

/* 建议 */
.report-recommendation {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.report-recommendation.warning {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.report-recommendation svg {
  flex-shrink: 0;
  color: #666;
}

.report-recommendation.warning svg {
  color: #856404;
}

/* 冲突列表 */
.conflict-list {
  padding: 16px;
}

.conflict-card {
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  transition: box-shadow 0.2s;
}

.conflict-card:last-child {
  margin-bottom: 0;
}

.conflict-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.conflict-card.high {
  border-left: 4px solid #f44336;
}

.conflict-card.medium {
  border-left: 4px solid #ff9800;
}

.conflict-card.low {
  border-left: 4px solid #2196f3;
}

.conflict-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
}

.severity-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge.high {
  background: #ffebee;
  color: #c62828;
}

.severity-badge.medium {
  background: #fff3e0;
  color: #e65100;
}

.severity-badge.low {
  background: #e3f2fd;
  color: #1565c0;
}

.conflict-title {
  flex: 1;
}

.conflict-title h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.conflict-difference {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expand-icon {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.expand-icon:hover {
  color: #666;
}

.expand-icon svg {
  transition: transform 0.3s;
}

.expand-icon svg.rotated {
  transform: rotate(180deg);
}

/* 详情 */
.conflict-details {
  padding: 0 16px 16px 16px;
  border-top: 1px solid #e8e8e8;
  background: white;
}

.detail-section {
  margin-top: 16px;
}

.detail-section:first-child {
  margin-top: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-title svg {
  color: #666;
}

.source-citation {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #ddd;
}

.source-chapter {
  font-size: 12px;
  color: #666;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.source-content {
  font-size: 13px;
  color: #333;
  line-height: 1.6;
  margin: 0;
  font-style: normal;
}

.analysis-content,
.suggestion-content {
  font-size: 13px;
  color: #555;
  line-height: 1.7;
}

.suggestion {
  background: #fff8e1;
  padding: 12px;
  border-radius: 6px;
}

.suggestion .section-title {
  color: #f57c00;
}

.suggestion .section-title svg {
  color: #f57c00;
}

/* 动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

</style>

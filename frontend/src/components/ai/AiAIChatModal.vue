<template>
  <Transition name="ai-modal">
    <div v-if="aiStore.isOpen" class="ai-modal-overlay" @click.self="aiStore.close">
      <div class="ai-modal" :class="{ discussion: aiStore.discussionMode && activeAIList.length > 1 }">
        <!-- Header -->
        <div class="ai-header">
          <!-- Left Section -->
          <div class="ai-header-left">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <span class="ai-title">{{ $t('assistant.chatTitle') }}</span>
            <span v-if="knowledgeReady" class="ai-kg-badge" title="知识库已启用">
              <svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </span>
          </div>
          
          <!-- Right Section -->
          <div class="ai-header-right">
            <!-- Mode & AI Selector - compact design -->
            <div class="mode-ai-selector">
              <button
                class="mode-toggle"
                :class="{ 'multi-mode': aiStore.discussionMode }"
                @click="toggleMode"
                :disabled="isLoading"
                :title="aiStore.discussionMode ? '切换到单AI模式' : '切换到多AI模式'"
              >
                <svg v-if="!aiStore.discussionMode" viewBox="0 0 24 24" width="16" height="16"><path d="M12 4a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-8a1 1 0 10-2 0v3a1 1 0 00.293.707l2 2a1 1 0 001.414-1.414L13 10.586V10z" stroke="currentColor" fill="none" stroke-width="2"/></svg>
                <svg v-else viewBox="0 0 24 24" width="16" height="16"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" fill="none" stroke-width="2"/></svg>
              </button>
              
              <!-- AI Selector - only show in single mode -->
              <select 
                v-if="!aiStore.discussionMode" 
                v-model="aiStore.activeAI" 
                class="ai-select-compact" 
                @change="onAISwitch"
              >
                <option v-for="ai in aiStore.aiList" :key="ai.ai_id" :value="ai.ai_id">{{ ai.name }}</option>
              </select>
            </div>
            
            <!-- Enhanced Check Toggle - compact version -->
            <div 
              class="enhanced-toggle-wrapper"
              @mouseenter="onEnhancedToggleMouseEnter"
              @mouseleave="onEnhancedToggleMouseLeave"
              ref="enhancedToggleRef"
            >
              <button 
                class="enhanced-toggle"
                :class="{ active: enhancedCheckEnabled, loading: localAIModelLoading }"
                @click="toggleEnhancedCheck"
                :disabled="localAIModelLoading"
              >
                <svg v-if="!enhancedCheckEnabled" viewBox="0 0 24 24" width="16" height="16"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" fill="none" stroke-width="2"/></svg>
                <svg v-else viewBox="0 0 24 24" width="16" height="16"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" fill="currentColor" stroke-width="2"/></svg>
              </button>
            </div>
            
            <!-- Close Button -->
            <button class="ai-close" @click="aiStore.close" title="关闭">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            </button>
          </div>
        </div>

        <!-- Discussion mode indicator -->
        <div v-if="aiStore.discussionMode && activeAIList.length > 1" class="ai-discussion-bar">
          <span class="disc-label">{{ $t('assistant.discussionLabel') }}</span>
          <div class="disc-participants">
            <span v-for="ai in activeAIList" :key="ai.ai_id" class="disc-pill" :class="{ active: ai.ai_id === speakingAI }">{{ ai.name }}</span>
          </div>
        </div>

        <!-- Queue status indicator -->
        <div v-if="isInQueue" class="ai-queue-bar">
          <div class="queue-info">
            <svg viewBox="0 0 24 24" width="14" height="14" class="queue-icon">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" fill="none" stroke-width="2"/>
            </svg>
            <span class="queue-text">{{ queueStatusText }}</span>
          </div>
          <div class="queue-stats">
            <span>全局: {{ globalConcurrent }}/{{ globalMaxConcurrent }}</span>
            <span v-if="currentAIId">AI: {{ currentAIConcurrent }}</span>
          </div>
        </div>

        <!-- Messages -->
        <div class="ai-messages" ref="messagesRef">
          <div
              v-for="msg in messages"
              :key="msg.id"
              class="ai-message"
              :class="{ user: msg.role === 'user', assistant: msg.role === 'assistant' }"
          >
            <!-- AI avatar for assistant messages in discussion mode -->
            <div v-if="msg.role === 'assistant' && aiStore.discussionMode" class="msg-avatar" :style="{ background: getAIColor(msg.aiId) }">
              {{ getAIInitial(msg.aiId) }}
            </div>
            <div class="msg-bubble">
              <div class="msg-sender" v-if="msg.role === 'assistant' && aiStore.discussionMode">{{ getAIName(msg.aiId) }}</div>
              <div class="msg-content" v-html="formatMsg(msg.content)"></div>
              <div class="msg-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
          </div>
          <div v-if="isLoading" class="ai-message assistant ai-typing">
            <div class="msg-bubble">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 冲突报告展示区域 -->
        <div v-if="conflictReport" class="conflict-report-container">
          <div class="conflict-report-header">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" fill="none" stroke-width="2"/>
            </svg>
            <span>增强检查报告</span>
            <button class="close-report" @click="conflictReport = null" aria-label="关闭报告">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <ConflictReportCard :report="conflictReport" :auto-expand="true" />
        </div>

        <!-- 本地AI推理进度 -->
        <div v-if="localAIReasoning" class="local-ai-progress">
          <div class="progress-indicator">
            <svg class="spinner" viewBox="0 0 24 24" width="18" height="18">
              <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="10" />
            </svg>
            <span class="progress-text">{{ localAIReasoning.message }}</span>
            <span class="progress-step">{{ localAIReasoning.step }}/{{ localAIReasoning.total }}</span>
          </div>
        </div>

        <!-- Input -->
        <div class="ai-input-area">
          <div class="ai-input-row">
            <textarea
                v-model="inputText"
                :placeholder="$t('assistant.placeholder')"
                class="ai-textarea"
                rows="1"
                @keydown.enter.prevent="debouncedSendMessage"
                @input="autoResize"
                ref="inputRef"
            ></textarea>
            <button class="ai-send" :class="{ debouncing: isDebouncing }" :disabled="!inputText.trim() || isLoading || isDebouncing" @click="debouncedSendMessage">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            </button>
          </div>
          <div class="ai-hint">{{ $t('assistant.hint') }}</div>
        </div>
      </div>
      
      <!-- Enhanced Check Tooltip - placed outside the modal to avoid overflow:hidden -->
      <Teleport to="body">
        <Transition name="tooltip">
          <div v-if="showEnhancedTooltip" class="enhanced-tooltip" ref="tooltipRef">
            <div class="tooltip-header">
              <span class="tooltip-title">增强检查模式</span>
              <span class="tooltip-status" :class="{ active: enhancedCheckEnabled }">
                {{ enhancedCheckEnabled ? '已启用' : '已关闭' }}
              </span>
            </div>
            <div class="tooltip-content">
              <div class="tooltip-section">
                <h4>功能用途</h4>
                <p>启用后，本地部署的大语言模型将对接入AI的输出内容进行实时评估与分析，确保回答的准确性和可靠性。</p>
              </div>
              <div class="tooltip-section">
                <h4>使用方法</h4>
                <ul>
                  <li>点击按钮即可开启/关闭此功能</li>
                  <li>在单AI模式下：对单个AI回答进行验证</li>
                  <li>在多AI模式下：对所有AI回答进行综合评估</li>
                </ul>
              </div>
              <div class="tooltip-section warning">
                <h4>注意事项</h4>
                <ul>
                  <li>启用后响应时间会增加约2-5秒</li>
                  <li>需要本地模型服务正常运行</li>
                  <li>建议在需要高精度回答时使用</li>
                </ul>
              </div>
            </div>
            <div class="tooltip-arrow"></div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAIStore } from '@/stores';
import { assistantApi } from '@/services/api';
import { knowledgeGraph } from './AiKnowledgeGraph';
import { ConflictResolver, formatConflictReport } from './AiConflictResolver';
import { useAIConcurrency } from '@/composables/useAIConcurrency';
import { localAIManager } from './LocalAIManager';
import { useKnowledgeDetector } from './KnowledgeBaseDetector';
import { ConflictReport } from './KnowledgeBaseDetector';
import EnhancedCheckToggle from './EnhancedCheckToggle.vue';
import ConflictReportCard from './ConflictReportCard.vue';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('AiAIChatModal');

const aiStore = useAIStore();
const { t } = useI18n();
const { 
  isInQueue, 
  queuePosition, 
  waitingCount, 
  queueStatusText,
  currentAIId,
  currentAIConcurrent,
  globalConcurrent,
  globalMaxConcurrent,
  loadConfigs,
  executeWithConcurrency 
} = useAIConcurrency();

const messages = ref<Array<{ id: string; role: string; content: string; aiId?: string; timestamp: number }>>([]);
const inputText = ref('');
const isLoading = ref(false);
const messagesRef = ref<HTMLDivElement>();
const inputRef = ref<HTMLTextAreaElement>();
const enhancedToggleRef = ref<HTMLDivElement>();
const tooltipRef = ref<HTMLDivElement>();
const speakingAI = ref('');
const knowledgeReady = ref(false);
const knowledgeEntryCount = ref(0);
const lastConflictReport = ref('');
const lastEvaluationResult = ref<any>(null);

// 防抖相关状态
const isDebouncing = ref(false);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_DELAY = 600; // 防抖时间间隔：600ms

// 增强检查相关状态
const enhancedCheckEnabled = ref(false);
const localAIModelLoading = ref(false);
const localAIReasoning = ref<{ step: number; total: number; message: string } | null>(null);
const conflictReport = ref<ConflictReport | null>(null);

// 增强检查提示框相关状态
const showEnhancedTooltip = ref(false);

// 知识库检测
const knowledgeDetector = useKnowledgeDetector();

// AI colors for discussion mode
const aiColors: Record<string, string> = {};
const palette = ['#8B2500', '#B8860B', '#4A7C6F', '#4A6B7C', '#6B4A7C', '#7C4A5A'];

const activeAIList = computed(() => {
  return aiStore.aiList.filter((a: any) => a.is_active);
});

function getAIColor(id?: string | number) {
  if (!id) return '#8B2500';
  const key = String(id);
  if (!aiColors[key]) {
    aiColors[key] = palette[Object.keys(aiColors).length % palette.length];
  }
  return aiColors[key];
}

function getAIInitial(id?: string | number) {
  const ai = aiStore.aiList.find((a: any) => String(a.ai_id) === String(id));
  return ai ? ai.name.charAt(0) : 'A';
}

function getAIName(id?: string | number) {
  const ai = aiStore.aiList.find((a: any) => String(a.ai_id) === String(id));
  return ai ? ai.name : 'AI';
}

function formatMsg(content: string) {
  let formatted = content;

  formatted = formatted.replace(/\n\s*---\s*\n/g, '\n');

  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  formatted = formatted.replace(/^#{6}\s(.+)$/gm, '<h6>$1</h6>');
  formatted = formatted.replace(/^#{5}\s(.+)$/gm, '<h5>$1</h5>');
  formatted = formatted.replace(/^#{4}\s(.+)$/gm, '<h4>$1</h4>');
  formatted = formatted.replace(/^#{3}\s(.+)$/gm, '<h3>$1</h3>');
  formatted = formatted.replace(/^#{2}\s(.+)$/gm, '<h2>$1</h2>');
  formatted = formatted.replace(/^#\s(.+)$/gm, '<h1>$1</h1>');

  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  formatted = formatted.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  formatted = formatted.replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>');

  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

  const lines = formatted.split('\n');
  const result: string[] = [];
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (/^(\d+)\.\s/.test(line)) {
      if (!inOrderedList) {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push('<ol>');
        inOrderedList = true;
      }
      result.push(`<li>${line.replace(/^\d+\.\s/, '')}</li>`);
    } else if (/^[一二三四五六七八九十]+、\s/.test(line)) {
      if (!inOrderedList) {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push('<ol>');
        inOrderedList = true;
      }
      result.push(`<li>${line.replace(/^[一二三四五六七八九十]+、\s/, '')}</li>`);
    } else if (/^([-*+])\s/.test(line)) {
      if (!inList) {
        if (inOrderedList) {
          result.push('</ol>');
          inOrderedList = false;
        }
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${line.replace(/^[-*+]\s/, '')}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }

      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').filter(c => c.trim() !== '');
        if (cells.length > 0 && line.includes('-')) {
          result.push('</thead><tbody>');
        } else if (result[result.length - 1] !== '</thead><tbody>' && !line.includes('-')) {
          result.push('<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>');
        }
      } else if (line.startsWith('|')) {
        result.push('<table><thead><tr>' + line.split('|').filter(c => c.trim() !== '').map(c => `<th>${c.trim()}</th>`).join('') + '</tr>');
      } else if (line === '') {
        result.push('');
      } else {
        if (!/^<(h[1-6]|pre|blockquote|ul|ol|li|table|tr|td|th)/.test(line)) {
          result.push(`<p>${line}</p>`);
        } else {
          result.push(line);
        }
      }
    }
  }

  if (inList) result.push('</ul>');
  if (inOrderedList) result.push('</ol>');

  formatted = result.join('\n');

  formatted = formatted.replace(/\*\*/g, '');
  formatted = formatted.replace(/\*/g, '');

  formatted = formatted.replace(/>\s+</g, '><');

  return formatted;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// 评估等级辅助函数
function getAccuracyLevel(score: number): string {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 70) return '中等';
  if (score >= 60) return '及格';
  return '需改进';
}

function getCompletenessLevel(score: number): string {
  if (score >= 90) return '完整';
  if (score >= 80) return '较完整';
  if (score >= 70) return '基本完整';
  if (score >= 60) return '部分完整';
  return '不完整';
}

function getLogicLevel(score: number): string {
  if (score >= 90) return '严谨';
  if (score >= 80) return '较严谨';
  if (score >= 70) return '基本合理';
  if (score >= 60) return '存在瑕疵';
  return '逻辑混乱';
}

function getRelevanceLevel(score: number): string {
  if (score >= 90) return '高度相关';
  if (score >= 80) return '较相关';
  if (score >= 70) return '基本相关';
  if (score >= 60) return '部分相关';
  return '不相关';
}

// 生成评分可视化进度条
function generateScoreBar(score: number): string {
  const totalBars = 20;
  const filledBars = Math.round((score / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  
  let bar = '[';
  bar += '█'.repeat(filledBars);
  bar += '░'.repeat(emptyBars);
  bar += ']';
  
  return bar;
}

function autoResize() {
  const el = inputRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

async function scrollToBottom() {
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
}

// 使用本地AI发送消息（增强检查模式）
async function sendMessageWithLocalAI(text: string) {
  // Add user message
  const userMsg = { id: `u_${Date.now()}`, role: 'user', content: text, timestamp: Date.now() };
  messages.value.push(userMsg);
  inputText.value = '';
  autoResize();
  await scrollToBottom();

  isLoading.value = true;
  conflictReport.value = null;

  try {
    // 监听推理进度
    const progressWatcher = setInterval(() => {
      if (localAIManager.reasoningProgress.value.active) {
        localAIReasoning.value = {
          step: localAIManager.reasoningProgress.value.step,
          total: localAIManager.reasoningProgress.value.total,
          message: localAIManager.reasoningProgress.value.message
        };
      } else {
        localAIReasoning.value = null;
      }
    }, 100);
    memTrack.trackTimer('ai-chat-progress', progressWatcher as unknown as number, 100);

    // 执行本地AI查询
    const result = await localAIManager.query(text);

    memTrack.untrackTimer('ai-chat-progress');
    clearInterval(progressWatcher);
    localAIReasoning.value = null;

    // 显示AI回答
    messages.value.push({
      id: `a_${Date.now()}`,
      role: 'assistant',
      content: result.response,
      timestamp: Date.now(),
    });
    await scrollToBottom();

    // 执行知识库冲突检测
    if (result.knowledge && result.knowledge.length > 0) {
      const report = await knowledgeDetector.detect(result.response, text);
      if (report && report.conflicts.length > 0) {
        conflictReport.value = report;
      }
    }
  } catch (error: any) {
    console.error('[LocalAI] 查询失败:', error);
    messages.value.push({
      id: `err_${Date.now()}`,
      role: 'assistant',
      content: `❌ 本地AI处理失败：${error.message}\n\n请稍后重试，或关闭增强检查模式使用云端AI。`,
      timestamp: Date.now(),
    });
    await scrollToBottom();
  } finally {
    isLoading.value = false;
    localAIReasoning.value = null;
  }
}

// 防抖包装的发送函数
async function debouncedSendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value || isDebouncing.value) return;

  // 设置防抖状态
  isDebouncing.value = true;

  // 创建防抖延迟
  return new Promise<void>((resolve) => {
    debounceTimer = setTimeout(async () => {
      try {
        await sendMessageInternal(text);
      } finally {
        isDebouncing.value = false;
        debounceTimer = null;
        resolve();
      }
    }, DEBOUNCE_DELAY);
    memTrack.trackTimer('ai-chat-debounce', debounceTimer as unknown as number, DEBOUNCE_DELAY);
  });
}

// 取消防抖
function cancelDebounce() {
  if (debounceTimer) {
    memTrack.untrackTimer('ai-chat-debounce');
    clearTimeout(debounceTimer);
    debounceTimer = null;
    isDebouncing.value = false;
  }
}

// 实际的发送逻辑
async function sendMessageInternal(text: string) {
  // 增强检查模式：先调用外接AI获取原始回答，再进行本地检查分析
  // 非增强检查模式：直接调用外接AI

  // 初始化知识图谱（首次使用时异步加载）
  if (!knowledgeReady.value) {
    knowledgeGraph.initialize().then(() => {
      knowledgeReady.value = true;
      knowledgeEntryCount.value = knowledgeGraph.getEntryCount();
    }).catch(() => { /* 静默失败 */ });
  }

  // Add user message
  const userMsg = { id: `u_${Date.now()}`, role: 'user', content: text, timestamp: Date.now() };
  messages.value.push(userMsg);
  inputText.value = '';
  autoResize();
  await scrollToBottom();

  isLoading.value = true;
  lastConflictReport.value = '';

  try {
    // 始终使用原始用户输入发送给外接AI，确保返回的是纯粹的AI回答
    // 这样在增强检查模式下，对话1输出的是外接AI的原始回答，未经任何修改
    let promptToSend = text;
    let knowledgeUsed = false;

    if (aiStore.discussionMode && activeAIList.value.length > 1) {
      // Discussion mode: 并发调用所有AI（带独立超时和错误隔离）
      const responses: Array<{ aiId: string; aiName: string; content: string; timestamp: number }> = [];

      // 并发调用所有AI，每个有独立的10秒超时
      const aiPromises = activeAIList.value.map(async (ai: any) => {
        speakingAI.value = ai.ai_id;
        try {
          const res = await Promise.race([
            assistantApi.chat(promptToSend, Number(ai.ai_id) || 1),
            new Promise<never>((_, reject) => {
              const handle = setTimeout(() => reject(new Error('AI响应超时')), 35000);
              memTrack.trackTimer('ai-chat-timeout', handle as unknown as number, 35000);
            }),
          ]);
          if ((res as any).success) {
            const content = (res as any).data?.response || (res as any).data?.message || '...';
            return { aiId: String(ai.ai_id), aiName: ai.name || `AI_${ai.ai_id}`, content, success: true };
          }
          return { aiId: String(ai.ai_id), aiName: ai.name || `AI_${ai.ai_id}`, content: 'AI未返回有效回答', success: false };
        } catch (err: any) {
          const isTimeout = err.message === 'AI响应超时';
          return {
            aiId: String(ai.ai_id),
            aiName: ai.name || `AI_${ai.ai_id}`,
            content: isTimeout ? '⏱响应超时，该AI暂时不可用' : `连接失败：${err.message || '未知错误'}`,
            success: false,
          };
        }
      });

      // 等待所有AI响应（并行执行，一个失败不影响其他）
      const results = await Promise.all(aiPromises);
      speakingAI.value = '';

      // 按顺序显示结果
      for (const result of results) {
        if (result.success) {
          messages.value.push({
            id: `a_${Date.now()}_${result.aiId}`,
            role: 'assistant',
            content: result.content,
            aiId: result.aiId,
            timestamp: Date.now(),
          });
          responses.push({
            aiId: result.aiId,
            aiName: result.aiName,
            content: result.content,
            timestamp: Date.now(),
          });
        } else {
          messages.value.push({
            id: `err_${Date.now()}_${result.aiId}`,
            role: 'assistant',
            content: result.content,
            aiId: result.aiId,
            timestamp: Date.now(),
          });
        }
        await scrollToBottom();
      }

      // 启用增强检查模式时：执行多AI评估分析和知识溯源标记
      if (enhancedCheckEnabled.value) {
        // 多AI评估分析（只对成功的回答）
        if (responses.length >= 2) {
          await performMultiAIEvaluation(text, responses);
        }

        // 知识溯源标记
        if (knowledgeUsed) {
          messages.value.push({
            id: `kg_${Date.now()}`,
            role: 'assistant',
            content: `本回答基于筑见山河知识库（${knowledgeEntryCount.value}条知识）进行增强。`,
            timestamp: Date.now(),
          });
          await scrollToBottom();
        }
      }
    } else {
      // Single AI mode - 使用并发管理
      const ai = aiStore.aiList.find((a: any) => a.ai_id === aiStore.activeAI) || aiStore.aiList[0];
      const aiId = Number(ai?.ai_id) || 1;
      
      const res = await executeWithConcurrency(
        aiId,
        () => assistantApi.chat(promptToSend, aiId, enhancedCheckEnabled.value),
        {
          showQueueInfo: true,
          onQueueUpdate: (position, total) => {
            // 可以在这里更新 UI 显示排队进度
          }
        }
      );
      
      if (res.success) {
        const originalContent = res.data?.response || res.data?.message || '...';
        const backendEnhancedResult = res.data?.enhancedCheck;
        
        // 未启用增强检查模式：直接输出原始回答，不进行任何修改
        if (!enhancedCheckEnabled.value) {
          messages.value.push({
            id: `a_${Date.now()}`,
            role: 'assistant',
            content: originalContent,
            aiId: ai?.ai_id,
            timestamp: Date.now(),
          });
          await scrollToBottom();
          return;
        }
        
        // 启用增强检查模式：输出外接AI返回的纯原始内容，未经任何修改或处理
        messages.value.push({
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: originalContent,
          aiId: ai?.ai_id,
          timestamp: Date.now(),
        });
        await scrollToBottom();
        
        // 使用后端返回的增强检查结果（如果有），否则使用前端本地模型分析
        if (backendEnhancedResult && backendEnhancedResult.conflictReport) {
          // 使用后端返回的分析结果
          await displayEnhancedReport(backendEnhancedResult);
        } else {
          // 回退到前端本地模型分析
          await performLocalAIAnalysis(originalContent);
        }
      }
    }
  } catch (e: any) {
    const errMsg = e?.response?.data?.error?.message || e?.message || '未知错误';
    messages.value.push({
      id: `err_${Date.now()}`,
      role: 'assistant',
      content: `抱歉，服务暂时不可用。\n\n错误信息：${errMsg}`,
      timestamp: Date.now(),
    });
    await scrollToBottom();
  } finally {
    isLoading.value = false;
  }
}

function onAISwitch() {
  aiStore.discussionMode = false;
}

function toggleMode() {
  aiStore.setDiscussionMode(!aiStore.discussionMode);
}

function toggleEnhancedCheck() {
  enhancedCheckEnabled.value = !enhancedCheckEnabled.value;
}

// 使用本地大模型对外接AI回答进行分析
async function performLocalAIAnalysis(aiResponse: string) {
  // 确保本地AI模型已初始化
  if (!localAIManager.isReady.value) {
    try {
      await localAIManager.initialize();
    } catch (error: any) {
      console.error('[LocalAI] 初始化失败:', error);
      messages.value.push({
        id: `analysis_err_${Date.now()}`,
        role: 'assistant',
        content: `本地AI模型初始化失败：${error.message}\n\n无法进行增强检查，请稍后重试或关闭增强检查模式。`,
        timestamp: Date.now(),
      });
      await scrollToBottom();
      return;
    }
  }

  // 添加分析中提示
  const analyzingMsgId = `analyzing_${Date.now()}`;
  messages.value.push({
    id: analyzingMsgId,
    role: 'assistant',
    content: '本地AI模型正在分析中...',
    timestamp: Date.now(),
  });
  await scrollToBottom();

  try {
    // 构建分析提示词 - 要求本地模型进行深入、系统的分析
    const analysisPrompt = `你是一个专业的AI回答质量评估专家。请对以下AI回答进行系统性、深入的质量评估分析。

【待评估内容】
${aiResponse}

【分析任务】
请从以下维度进行全面评估，并提供详细、具体的分析内容：

1. 基础评分维度（0-100分）：
   - accuracy: 准确性（回答是否准确无误，数据是否正确）
   - completeness: 完整性（回答是否完整覆盖问题要点，有无遗漏）
   - logic: 逻辑性（回答是否逻辑清晰、推理合理、结构完整）
   - relevance: 相关性（回答是否与问题高度相关，有无偏题）

2. 深度分析维度（必须提供具体、详细的内容）：
   - severity: 严重程度等级（低/中/高）
     * 低：回答准确完整，无明显问题
     * 中：存在轻微偏差或不完整，但核心信息正确
     * 高：存在严重错误或重大遗漏，需谨慎参考
   
   - deviationContent: 偏离内容描述
     * 详细描述回答中哪些内容可能存在偏差或错误
     * 指出具体的句子、数据或观点
     * 若无明显偏离，输出"无明显偏离"
   
   - deviationReason: 偏离原因分析
     * 分析导致偏差的可能原因（如信息过时、理解偏差、数据来源问题等）
     * 提供合理的推断依据
     * 若无偏离，输出"无"
   
   - impactScope: 影响范围评估
     * 评估偏差内容可能对用户理解造成的影响
     * 说明哪些概念或知识点可能被误导
     * 若无影响，输出"无"
   
   - correctionDirection: 具体修正方向
     * 提供具体的修正建议和正确信息方向
     * 说明应如何改进回答
     * 若无需修正，输出"无"
   
   - reference: 相关依据
     * 提供评估的参考依据或标准
     * 说明判断准确性的基准
     * 若无特定依据，输出"基于通用知识评估"
   
   - summary: 综合评价（50字以内）
     * 对回答质量的总体评价
   
   - recommendation: 改进建议（50字以内）
     * 具体的改进建议，若无则输出"无"

【输出格式】
严格只输出以下JSON格式，不要包含任何其他内容：
{"accuracy":85,"completeness":80,"logic":85,"relevance":90,"severity":"中","deviationContent":"具体偏离内容描述","deviationReason":"具体原因分析","impactScope":"具体影响范围","correctionDirection":"具体修正方向","reference":"相关依据","summary":"综合评价","recommendation":"改进建议"}`;

    // 调用本地AI进行分析
    const result = await localAIManager.query(analysisPrompt);

    // 移除分析中提示
    const analyzingIndex = messages.value.findIndex(m => m.id === analyzingMsgId);
    if (analyzingIndex !== -1) {
      messages.value.splice(analyzingIndex, 1);
    }

    // 解析分析结果
    let analysisResult: any = null;
    try {
      // 严格提取JSON对象（第一个 { 到最后一个 } 之间的内容）
      const jsonStart = result.response.indexOf('{');
      const jsonEnd = result.response.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonStr = result.response.substring(jsonStart, jsonEnd + 1);
        analysisResult = JSON.parse(jsonStr);
      }
    } catch {
      // JSON解析失败，使用默认值
      console.warn('[LocalAI] JSON解析失败，使用默认评估结果');
    }

    // 如果解析失败或结果无效，设置默认值
    if (!analysisResult || typeof analysisResult !== 'object') {
      analysisResult = {
        accuracy: 80,
        completeness: 75,
        logic: 80,
        relevance: 80,
        severity: '中',
        deviationContent: '',
        deviationReason: '',
        impactScope: '',
        correctionDirection: '',
        reference: '',
        summary: '评估结果解析异常',
        recommendation: '无'
      };
    }

    // 计算严重程度等级
    const avgScore = Math.round([
      analysisResult.accuracy || 0,
      analysisResult.completeness || 0,
      analysisResult.logic || 0,
      analysisResult.relevance || 0
    ].reduce((a, b) => a + b, 0) / 4);
    
    let severityLevel = analysisResult.severity || '中';
    let severityIcon = '🟡';
    let severityDesc = '存在一定偏差或不完整，但核心信息正确';
    
    if (avgScore >= 90) {
      severityLevel = '低';
      severityIcon = '🟢';
      severityDesc = '回答准确完整，符合知识库内容';
    } else if (avgScore >= 70) {
      severityLevel = '中';
      severityIcon = '🟡';
      severityDesc = '存在一定偏差或不完整，但核心信息正确';
    } else {
      severityLevel = '高';
      severityIcon = '🔴';
      severityDesc = '存在严重偏差或错误，需谨慎参考';
    }

    // 输出本地AI模型的分析报告 - 结构化展示
    let analysisReport = ``;
    
    // 报告标题
    analysisReport += `分析报告\n\n`;
    
    // 一、内容质量评估
    analysisReport += `【一、内容质量评估】\n\n`;
    
    // 准确性评估
    if (analysisResult.accuracy !== undefined) {
      const accuracyLevel = getAccuracyLevel(analysisResult.accuracy);
      const accuracyBar = generateScoreBar(analysisResult.accuracy);
      analysisReport += `  准确性: ${analysisResult.accuracy}/100 (${accuracyLevel})\n`;
      analysisReport += `     ${accuracyBar}\n\n`;
    }

    // 完整性评估
    if (analysisResult.completeness !== undefined) {
      const completenessLevel = getCompletenessLevel(analysisResult.completeness);
      const completenessBar = generateScoreBar(analysisResult.completeness);
      analysisReport += `  完整性: ${analysisResult.completeness}/100 (${completenessLevel})\n`;
      analysisReport += `     ${completenessBar}\n\n`;
    }

    // 逻辑性评估
    if (analysisResult.logic !== undefined) {
      const logicLevel = getLogicLevel(analysisResult.logic);
      const logicBar = generateScoreBar(analysisResult.logic);
      analysisReport += `  逻辑性: ${analysisResult.logic}/100 (${logicLevel})\n`;
      analysisReport += `     ${logicBar}\n\n`;
    }

    // 相关性评估
    if (analysisResult.relevance !== undefined) {
      const relevanceLevel = getRelevanceLevel(analysisResult.relevance);
      const relevanceBar = generateScoreBar(analysisResult.relevance);
      analysisReport += `  相关性: ${analysisResult.relevance}/100 (${relevanceLevel})\n`;
      analysisReport += `     ${relevanceBar}\n\n`;
    }
    
    // 三、潜在问题识别
    analysisReport += `【二、潜在问题识别】\n\n`;
    
    // 严重程度评估
    analysisReport += `  ${severityIcon} 风险等级: ${severityLevel}\n`;
    analysisReport += `     ${severityDesc}\n\n`;
    
    // 偏离内容分析
    if (analysisResult.deviationContent && analysisResult.deviationContent !== '无') {
      analysisReport += `  偏离内容:\n`;
      analysisReport += `     ${analysisResult.deviationContent}\n\n`;
    }
    
    // 偏离原因分析
    if (analysisResult.deviationReason && analysisResult.deviationReason !== '无') {
      analysisReport += `  偏离原因:\n`;
      analysisReport += `     ${analysisResult.deviationReason}\n\n`;
    }
    
    // 影响范围评估
    if (analysisResult.impactScope && analysisResult.impactScope !== '无') {
      analysisReport += `  影响范围:\n`;
      analysisReport += `     ${analysisResult.impactScope}\n\n`;
    }
    
    // 相关依据
    if (analysisResult.reference && analysisResult.reference !== '无') {
      analysisReport += `  参考依据:\n`;
      analysisReport += `     ${analysisResult.reference}\n\n`;
    }
    
    // 四、改进建议
    analysisReport += `【三、改进建议】\n\n`;
    
    // 具体修正方向
    if (analysisResult.correctionDirection && analysisResult.correctionDirection !== '无') {
      analysisReport += `  修正方向:\n`;
      analysisReport += `     ${analysisResult.correctionDirection}\n\n`;
    }
    
    // 综合评价与建议
    if (analysisResult.summary) {
      analysisReport += `  综合评价:\n`;
      analysisReport += `     ${analysisResult.summary}\n\n`;
    }
    
    if (analysisResult.recommendation && analysisResult.recommendation !== '无') {
      analysisReport += `  优化建议:\n`;
      analysisReport += `     ${analysisResult.recommendation}\n\n`;
    }
    
    // 五、综合评分
    const avgLevel = getAccuracyLevel(avgScore);
    const avgBar = generateScoreBar(avgScore);
    
    analysisReport += `【四、综合评分】\n`;
    analysisReport += `  总体评分: ${avgScore}/100 (${avgLevel})\n`;
    analysisReport += `     ${avgBar}\n`;

    // 显示分析报告
    messages.value.push({
      id: `analysis_${Date.now()}`,
      role: 'assistant',
      content: analysisReport,
      timestamp: Date.now(),
    });
    await scrollToBottom();

    // 如果有冲突检测结果，显示冲突报告
    if (result.conflictReport && result.conflictReport.conflicts && result.conflictReport.conflicts.length > 0) {
      conflictReport.value = result.conflictReport;
    }

  } catch (error: any) {
    console.error('[LocalAI] 分析失败:', error);
    // 移除分析中提示
    const analyzingIndex = messages.value.findIndex(m => m.id === analyzingMsgId);
    if (analyzingIndex !== -1) {
      messages.value.splice(analyzingIndex, 1);
    }
    messages.value.push({
      id: `analysis_err_${Date.now()}`,
      role: 'assistant',
      content: `本地AI分析失败：${error.message}`,
      timestamp: Date.now(),
    });
    await scrollToBottom();
  }
}

// 显示后端返回的增强检查报告
async function displayEnhancedReport(enhancedResult: any) {
  const conflictReport = enhancedResult.conflictReport;
  
  if (!conflictReport) {
    console.warn('[EnhancedCheck] 后端返回的增强检查结果为空');
    return;
  }
  
  // 生成结构化的分析报告
  let analysisReport = ``;
  
  // 报告标题
  analysisReport += ` 知识图谱分析报告\n\n`;
  
  // 一、冲突检测概览
  analysisReport += `【一、冲突检测概览】\n\n`;
  
  // 去重处理：基于冲突陈述去重，确保每个冲突只显示一次
  const uniqueConflicts = deduplicateConflicts(conflictReport.conflicts || []);
  const conflictCount = uniqueConflicts.length;
  const severityLevel = conflictReport.severityLevel || '低';
  
  let severityIcon = '🟢';
  let severityDesc = '回答准确完整，符合知识库内容';
  if (severityLevel === '中') {
    severityIcon = '🟡';
    severityDesc = '存在一定偏差或不完整，但核心信息正确';
  } else if (severityLevel === '高') {
    severityIcon = '🔴';
    severityDesc = '存在严重偏差或错误，需谨慎参考';
  }
  
  analysisReport += `  ${severityIcon} 风险等级: ${severityLevel}\n`;
  analysisReport += `     ${severityDesc}\n\n`;
  analysisReport += `  检测到冲突数: ${conflictCount}\n`;
  
  if (conflictReport.summary) {
    analysisReport += `  分析摘要: ${conflictReport.summary}\n\n`;
  }
  
  // 二、冲突详情
  if (conflictCount > 0) {
    analysisReport += `【二、冲突详情】\n\n`;
    
    uniqueConflicts.forEach((conflict: any, index: number) => {
      const typeLabel = getConflictTypeLabel(conflict.type);
      const severityLabel = getSeverityLabel(conflict.severity);
      
      analysisReport += `  ${index + 1}. [${typeLabel}] [${severityLabel}]\n`;
      analysisReport += `     冲突陈述: ${conflict.conflictingStatement}\n`;
      
      if (conflict.analysis) {
        analysisReport += `     分析: ${conflict.analysis}\n`;
      }
      
      // 移除修正建议部分
      
      if (conflict.knowledgeReference) {
        analysisReport += `     参考来源: ${conflict.knowledgeReference.source || '知识图谱'}\n`;
        if (conflict.knowledgeReference.name) {
          analysisReport += `        - ${conflict.knowledgeReference.name}\n`;
        }
      }
      
      analysisReport += `\n`;
    });
  }
  
  // 三、知识覆盖率评估
  if (conflictReport.knowledgeCoverage !== undefined) {
    analysisReport += `【三、知识覆盖率评估】\n`;
    analysisReport += `  覆盖率: ${conflictReport.knowledgeCoverage}%\n`;
    
    const coverageDesc = conflictReport.knowledgeCoverage >= 80 
      ? '回答内容与知识库高度匹配' 
      : conflictReport.knowledgeCoverage >= 50 
        ? '回答部分内容与知识库相关' 
        : '回答内容与知识库关联度较低';
    analysisReport += `     ${coverageDesc}\n\n`;
  }
  
  // 显示分析报告
  messages.value.push({
    id: `analysis_${Date.now()}`,
    role: 'assistant',
    content: analysisReport,
    timestamp: Date.now(),
  });
  await scrollToBottom();
  
  // 更新冲突报告状态（用于 ConflictReportCard 组件显示）
  if (conflictCount > 0) {
    conflictReport.value = conflictReport;
  }
}

// 冲突去重函数：基于冲突陈述进行去重，确保每个冲突只显示一次
function deduplicateConflicts(conflicts: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];
  
  for (const conflict of conflicts) {
    // 使用冲突陈述作为去重键
    const key = conflict.conflictingStatement?.trim() || JSON.stringify(conflict);
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(conflict);
    }
  }
  
  return unique;
}

// 获取冲突类型标签
function getConflictTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    'FACTUAL_ERROR': '事实性错误',
    'LOGICAL_CONFLICT': '逻辑矛盾',
    'INCONSISTENCY': '信息不一致',
    'INCOMPLETE': '信息缺失',
    'AMBIGUOUS': '表述模糊',
    'OUTDATED': '信息过时',
  };
  return typeMap[type] || type;
}

// 获取严重程度标签
function getSeverityLabel(severity: string): string {
  const severityMap: Record<string, string> = {
    'high': '高风险',
    'medium': '中风险',
    'low': '低风险',
  };
  return severityMap[severity] || severity;
}

// 增强检查提示框悬停处理
async function onEnhancedToggleMouseEnter() {
  // 立即显示提示框
  showEnhancedTooltip.value = true;
  // 等待 Vue 更新 DOM（异步）
  await nextTick();
  // 更新提示框位置
  updateTooltipPosition();
}

function onEnhancedToggleMouseLeave() {
  // 隐藏提示框
  showEnhancedTooltip.value = false;
}

// 更新提示框位置
function updateTooltipPosition() {
  if (!enhancedToggleRef.value || !tooltipRef.value) return;
  
  const toggleRect = enhancedToggleRef.value.getBoundingClientRect();
  const tooltipEl = tooltipRef.value;
  
  // 设置提示框位置（在按钮下方，避免覆盖按钮）
  const left = toggleRect.left;
  const top = toggleRect.bottom + 12;
  
  // 确保提示框不会超出视口
  const maxLeft = window.innerWidth - tooltipEl.offsetWidth - 16;
  const maxTop = window.innerHeight - tooltipEl.offsetHeight - 16;
  
  const finalLeft = Math.max(16, Math.min(left, maxLeft));
  const finalTop = Math.max(16, Math.min(top, maxTop));
  
  tooltipEl.style.left = `${finalLeft}px`;
  tooltipEl.style.top = `${finalTop}px`;
  
  // 如果提示框显示在按钮下方，调整箭头位置
  const arrow = tooltipEl.querySelector('.tooltip-arrow') as HTMLElement;
  if (arrow) {
    // 将箭头移到上方，指向按钮
    arrow.style.top = '-6px';
    arrow.style.bottom = 'auto';
    arrow.style.left = `${Math.min(20, toggleRect.width / 2)}px`;
    arrow.style.right = 'auto';
    arrow.style.transform = 'rotate(45deg)';
    arrow.style.borderRightColor = 'rgba(201, 169, 110, 0.2)';
    arrow.style.borderBottomColor = 'rgba(201, 169, 110, 0.2)';
    arrow.style.borderTopColor = 'transparent';
    arrow.style.borderLeftColor = 'transparent';
  }
}

// 增强检查开关变化处理
async function onEnhancedCheckChange(enabled: boolean) {
  if (enabled) {
    // 启用增强检查：初始化本地AI模型
    if (!localAIManager.isReady.value) {
      localAIModelLoading.value = true;
      try {
        await localAIManager.initialize();
        // 初始化知识库检测器
        await knowledgeDetector.initialize();
      } catch (error: any) {
        console.error('[EnhancedCheck] 初始化本地AI失败:', error);
        enhancedCheckEnabled.value = false;
        // 重置localAIManager状态，允许下次重新尝试
        localAIManager.destroy();
        return;
      } finally {
        localAIModelLoading.value = false;
      }
    }
  } else {
    // 禁用增强检查：清理状态并重置localAIManager
    localAIReasoning.value = null;
    conflictReport.value = null;
    localAIManager.destroy();
  }
}

// Load AI configs and knowledge graph on mount
onMounted(async () => {
  try {
    const res = await assistantApi.getAIList();
    if (res.success) {
      aiStore.setAIList(res.data);
    }
  } catch {
    // Fallback to default AI
    if (aiStore.aiList.length === 0) {
      aiStore.setAIList([{ ai_id: 1, name: 'AI助手', provider: 'default', model: 'default', is_active: true, is_default: true }]);
    }
  }

  // Initialize knowledge graph
  knowledgeGraph.initialize().then(() => {
    knowledgeReady.value = true;
    knowledgeEntryCount.value = knowledgeGraph.getEntryCount();
  }).catch(() => { /* 静默失败，核心知识已内嵌 */ });

  // Add welcome message
  if (messages.value.length === 0) {
    messages.value.push({
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是筑见山河的智能导览员。我连接了项目专属的古建筑知识库（涵盖结构、朝代、著名建筑等），可以为你提供准确的专业解答。请问有什么可以帮你的？',
      timestamp: Date.now(),
    });
  }
});

// Scroll on messages change
watch(() => messages.value.length, scrollToBottom);

// Cleanup debounce timer when component closes
watch(() => aiStore.isOpen, (isOpen) => {
  if (!isOpen) {
    cancelDebounce();
  }
});

// 多AI模型评估分析函数
async function performMultiAIEvaluation(question: string, responses: Array<{ aiId: string; aiName: string; content: string; timestamp: number }>) {
  try {
    // 添加评估中提示
    const evalMsgId = `eval_${Date.now()}`;
    messages.value.push({
      id: evalMsgId,
      role: 'assistant',
      content: '正在进行多AI评估分析...',
      timestamp: Date.now(),
    });
    await scrollToBottom();

    // 调用后端评估接口
    const { assistantApi } = await import('@/services/api');
    const aiResponses = responses.map(r => ({
      aiId: r.aiId,
      aiName: r.aiName,
      content: r.content
    }));
    
    const result = await assistantApi.evaluateMultiAI(question, aiResponses);

    // 移除评估中提示
    const evalIndex = messages.value.findIndex(m => m.id === evalMsgId);
    if (evalIndex !== -1) {
      messages.value.splice(evalIndex, 1);
    }

    if (result.success && result.data) {
      const data = result.data;
      
      // 显示综合评估报告摘要
      const report = data.comparisonReport;
      const recommendations = data.recommendations;

      let reportContent = `多AI评估报告\n\n`;
      
      // 最佳表现
      reportContent += `最佳表现: ${report.summary.bestAI.aiName} (${report.summary.bestAI.overallScore}分)\n`;
      
      // 平均分
      reportContent += `平均评分:\n`;
      reportContent += `   - 准确性: ${report.summary.avgScores.accuracy}分\n`;
      reportContent += `   - 相关性: ${report.summary.avgScores.relevance}分\n`;
      reportContent += `   - 完整性: ${report.summary.avgScores.completeness}分\n`;
      reportContent += `   - 逻辑性: ${report.summary.avgScores.logic}分\n`;
      reportContent += `   - 专业性: ${report.summary.avgScores.professionalism}分\n\n`;

      // 排名
      reportContent += `综合排名:\n`;
      report.ranking.forEach((item: any) => {
        const rankIcon = item.rank === 1 ? '1' : item.rank === 2 ? '2' : item.rank === 3 ? '3' : `${item.rank}.`;
        reportContent += `   ${rankIcon} ${item.aiName}: ${item.overallScore}分\n`;
      });

      reportContent += `\n建议: ${recommendations.overallRecommendations.join(' ')}\n`;

      messages.value.push({
        id: `eval_result_${Date.now()}`,
        role: 'assistant',
        content: reportContent,
        timestamp: Date.now(),
      });
      await scrollToBottom();

      // 保存评估结果供详细查看
      lastEvaluationResult.value = data;
    } else {
      messages.value.push({
        id: `eval_err_${Date.now()}`,
        role: 'assistant',
        content: `评估分析失败：${(result as any).error?.message || '未知错误'}`,
        timestamp: Date.now(),
      });
      await scrollToBottom();
    }
  } catch (error: any) {
    console.error('[MultiAI-Eval] 评估失败:', error);
    // 移除评估中提示
    const evalMsgId = `eval_${Date.now()}`;
    const evalIndex = messages.value.findIndex(m => m.id === evalMsgId);
    if (evalIndex !== -1) {
      messages.value.splice(evalIndex, 1);
    }
    messages.value.push({
      id: `eval_err_${Date.now()}`,
      role: 'assistant',
      content: `评估分析异常：${error.message || '网络错误'}`,
      timestamp: Date.now(),
    });
    await scrollToBottom();
  }
}
</script>

<style scoped>
.ai-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 16px;
  padding-bottom: 80px;
  pointer-events: none;
  background: transparent;
}
.ai-modal {
  width: 440px;
  max-width: calc(100vw - 32px);
  height: 580px;
  max-height: calc(100vh - 120px);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: 0 12px 48px rgba(0,0,0,0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: all;
  animation: modalPop 0.3s ease;
}
@keyframes modalPop {
  from { 
    opacity: 0; 
    transform: translateY(16px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}
.ai-modal.discussion { width: 540px; }

/* ===== 响应式适配 ===== */

/* 平板端 (768px - 1024px) */
@media screen and (max-width: 1024px) {
  .ai-modal {
    width: 380px;
    height: 520px;
    max-height: calc(100vh - 100px);
  }
  .ai-modal.discussion {
    width: 460px;
  }
}

/* 移动端 (< 768px) */
@media screen and (max-width: 767px) {
  .ai-modal-overlay {
    align-items: flex-end;
    justify-content: center;
    padding: 12px;
    padding-bottom: 70px;
  }
  
  .ai-modal {
    width: 100%;
    max-width: 100%;
    height: 60vh;
    max-height: calc(100vh - 140px);
    border-radius: var(--r-md) var(--r-md) 0 0;
  }
  
  .ai-modal.discussion {
    width: 100%;
  }
  
  .ai-header {
    padding: 8px 12px;
  }
  
  .ai-title {
    font-size: 0.875rem;
  }
  
  .ai-messages {
    padding: 10px 12px;
    gap: 12px;
  }
  
  .msg-bubble {
    max-width: 88%;
    padding: 8px 12px;
    font-size: 0.8125rem;
  }
  
  .ai-input-area {
    padding: 8px 12px;
  }
  
  .ai-textarea {
    font-size: 0.8125rem;
    padding: 8px 12px;
    max-height: 100px;
  }
  
  .ai-send {
    width: 36px;
    height: 36px;
  }
  
  .ai-hint {
    font-size: 0.625rem;
    margin-top: 6px;
  }
}

/* 小屏移动端 (< 360px) */
@media screen and (max-width: 359px) {
  .ai-modal-overlay {
    padding: 8px;
    padding-bottom: 60px;
  }
  
  .ai-modal {
    height: 55vh;
    max-height: calc(100vh - 120px);
  }
  
  .ai-header {
    padding: 6px 10px;
  }
  
  .ai-title {
    font-size: 0.8125rem;
  }
  
  .ai-messages {
    padding: 8px 10px;
    gap: 10px;
  }
  
  .msg-bubble {
    max-width: 90%;
    padding: 6px 10px;
    font-size: 0.75rem;
  }
  
  .msg-avatar {
    width: 24px;
    height: 24px;
    font-size: 0.625rem;
  }
  
  .ai-input-area {
    padding: 6px 10px;
  }
  
  .ai-textarea {
    font-size: 0.75rem;
    padding: 6px 10px;
    max-height: 80px;
  }
  
  .ai-send {
    width: 32px;
    height: 32px;
  }
  
  .ai-hint {
    font-size: 0.5625rem;
  }
}

/* Header - Simplified Design */
.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-light) 100%);
  border-bottom: 1px solid var(--border);
}
.ai-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ai-header-left svg {
  color: var(--gold);
}
.ai-title {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--gold);
  letter-spacing: 0.04em;
}
.ai-kg-badge {
  display: flex;
  align-items: center;
  padding: 2px 6px;
  background: rgba(90, 123, 108, 0.15);
  border: 1px solid rgba(90, 123, 108, 0.3);
  border-radius: var(--r-sm);
  color: var(--c-jade);
}
.ai-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mode-ai-selector {
  display: flex;
  align-items: center;
  background: rgba(0,0,0,0.15);
  border-radius: var(--r-sm);
  overflow: hidden;
}
.mode-toggle {
  padding: 5px 8px;
  border: none;
  background: transparent;
  color: rgba(201, 169, 110, 0.7);
  cursor: pointer;
  transition: all var(--t);
  display: flex;
  align-items: center;
  justify-content: center;
}
.mode-toggle:hover {
  background: rgba(201, 169, 110, 0.1);
  color: var(--gold);
}
.mode-toggle.multi-mode {
  background: rgba(201, 169, 110, 0.15);
  color: var(--gold);
}
.mode-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ai-select-compact {
  padding: 5px 8px;
  font-size: 0.75rem;
  border: none;
  border-left: 1px solid rgba(201, 169, 110, 0.2);
  background: transparent;
  color: var(--gold);
  cursor: pointer;
  min-width: 80px;
  font-family: var(--font-serif);
}
.ai-select-compact option {
  background: var(--bg-card);
  color: var(--text);
}
.enhanced-toggle {
  padding: 5px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: rgba(201, 169, 110, 0.5);
  cursor: pointer;
  transition: all var(--t);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}
.enhanced-toggle:hover {
  color: var(--c-jade);
  background: rgba(90, 123, 108, 0.15);
}
.enhanced-toggle.active {
  color: var(--c-jade);
  background: rgba(90, 123, 108, 0.15);
}
.enhanced-toggle.loading {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.enhanced-toggle:disabled {
  opacity: 0.5;
}
.ai-close {
  padding: 5px;
  border-radius: var(--r-sm);
  color: var(--text-muted);
  transition: all var(--t);
  cursor: pointer;
}
.ai-close:hover { 
  color: var(--text); 
  background: var(--bg-hover); 
}

/* Discussion bar */
.ai-discussion-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(var(--gold-rgb), 0.04);
  border-bottom: 1px solid var(--border);
  font-size: 0.75rem;
}
.disc-label { color: var(--gold); font-weight: 600; white-space: nowrap; }
.disc-participants { display: flex; gap: 6px; flex-wrap: wrap; }
.disc-pill {
  padding: 3px 10px;
  border-radius: var(--r-sm);
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text-muted);
  transition: all var(--t);
  font-size: 0.6875rem;
}
.disc-pill.active { background: rgba(var(--gold-rgb), 0.15); color: var(--gold); border-color: rgba(var(--gold-rgb), 0.3); }

/* Queue bar */
.ai-queue-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(90, 123, 108, 0.08);
  border-bottom: 1px solid var(--border);
  font-size: 0.75rem;
}
.queue-info {
  display: flex;
  align-items: center;
  gap: 6px;
}
.queue-icon {
  color: var(--c-jade);
  animation: spin 2s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.queue-text {
  color: var(--c-jade);
  font-weight: 500;
}
.queue-stats {
  display: flex;
  gap: 12px;
  color: var(--text-muted);
  font-size: 0.6875rem;
}

/* Messages */
.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg);
}
.ai-message {
  display: flex;
  gap: 10px;
  animation: msgSlide 0.25s ease;
}
@keyframes msgSlide {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.ai-message.user { justify-content: flex-end; }
.ai-message.assistant { justify-content: flex-start; }

.msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg);
  font-size: 0.7rem;
  font-weight: 600;
  flex-shrink: 0;
}
.ai-message.user .msg-avatar {
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
}
.ai-message.assistant .msg-avatar {
  background: linear-gradient(135deg, var(--c-red) 0%, #7A3225 100%);
}
.msg-bubble {
  max-width: 82%;
  padding: 10px 14px;
  border-radius: var(--r-md);
  font-size: 0.875rem;
  line-height: 1.7;
}
.ai-message.user .msg-bubble {
  background: linear-gradient(135deg, rgba(201,169,110,0.15) 0%, rgba(201,169,110,0.08) 100%);
  border: 1px solid rgba(201, 169, 110, 0.2);
  color: var(--text);
  border-bottom-right-radius: 2px;
}
.ai-message.user .msg-content {
  color: var(--text);
}
.ai-message.assistant .msg-bubble {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-bottom-left-radius: 2px;
  color: var(--text);
}
.msg-sender {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--gold);
  margin-bottom: 4px;
}
.msg-content { 
  word-break: break-word;
  white-space: normal;
  color: var(--text);
  line-height: 1.8;
  font-size: 0.95rem;
}
.msg-content h1, .msg-content h2, .msg-content h3, .msg-content h4, .msg-content h5, .msg-content h6 {
  margin: 16px 0 8px;
  font-weight: 700;
  color: var(--gold);
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(201, 169, 110, 0.2);
}
.msg-content h1 { font-size: 1.5rem; }
.msg-content h2 { font-size: 1.3rem; }
.msg-content h3 { font-size: 1.15rem; }
.msg-content h4 { font-size: 1rem; }
.msg-content h5 { font-size: 0.9rem; }
.msg-content h6 { font-size: 0.85rem; }
.msg-content ul, .msg-content ol {
  margin: 12px 0;
  padding-left: 28px;
}
.msg-content li {
  margin: 6px 0;
}
.msg-content p {
  margin: 12px 0;
  text-indent: 2em;
}
.msg-content blockquote {
  border-left: 3px solid var(--gold);
  padding: 8px 16px;
  margin: 16px 0;
  color: var(--text-muted);
  font-style: italic;
  background: rgba(201, 169, 110, 0.05);
  border-radius: 0 4px 4px 0;
}
.msg-content pre {
  background: #1A1714;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.85rem;
}
.msg-content code {
  background: rgba(201, 169, 110, 0.15);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}
.msg-content pre code {
  background: none;
  padding: 0;
  font-size: 0.85rem;
}
.msg-content a {
  color: var(--gold);
  text-decoration: none;
  border-bottom: 1px dashed rgba(201, 169, 110, 0.5);
}
.msg-content a:hover {
  color: var(--gold-hover);
  border-bottom: 1px solid var(--gold);
}
.msg-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 0.9rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.msg-content th, .msg-content td {
  border: 1px solid var(--border);
  padding: 10px 14px;
  text-align: left;
}
.msg-content th {
  background: var(--bg-hover);
  font-weight: 600;
  color: var(--gold);
}
.msg-content tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}
.msg-time {
  font-size: 0.65rem;
  color: var(--text-dim);
  margin-top: 4px;
  text-align: right;
}
.ai-message.user .msg-time { color: var(--text-muted); }

/* Typing indicator */
.typing-indicator { display: flex; gap: 4px; padding: 4px 0; }
.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold);
  animation: typingBounce 1.4s infinite ease-in-out both;
}
.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Input */
.ai-input-area {
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg-card);
}
.ai-input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.ai-textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-light);
  color: var(--text);
  font-size: 0.875rem;
  resize: none;
  max-height: 120px;
  line-height: 1.6;
  transition: all var(--t);
}
.ai-textarea:focus { 
  outline: none; 
  border-color: rgba(var(--gold-rgb), 0.5); 
  background: var(--bg);
}
.ai-textarea::placeholder {
  color: var(--text-dim);
}
.ai-send {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
  color: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--t);
  cursor: pointer;
}
.ai-send:hover:not(:disabled) { 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(201, 169, 110, 0.4);
}
.ai-send:active:not(:disabled) { 
  transform: translateY(-1px);
}
.ai-send:disabled { opacity: 0.4; cursor: not-allowed; }
.ai-send.debouncing {
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.6) 0%, rgba(201, 169, 110, 0.4) 100%);
  opacity: 0.8;
}
.ai-send.debouncing svg {
  animation: pulse 0.6s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.95); }
}
.ai-hint {
  font-size: 0.6875rem;
  color: var(--text-dim);
  margin-top: 8px;
  text-align: center;
}

/* Transition */
.ai-modal-enter-active, .ai-modal-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.ai-modal-enter-from, .ai-modal-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

/* 冲突报告容器 */
.conflict-report-container {
  max-height: 300px;
  overflow-y: auto;
  border-top: 1px solid var(--border);
  background: var(--bg-hover);
}

.conflict-report-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  color: var(--text);
}

.conflict-report-header svg {
  color: var(--color-primary);
}

.close-report {
  margin-left: auto;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 4px;
  transition: all 0.2s;
}

.close-report:hover {
  background: var(--bg-hover);
  color: var(--text);
}

/* 本地AI推理进度 */
.local-ai-progress {
  padding: 12px 16px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-top: 1px solid #e3f2fd;
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spinner {
  animation: spin 1s linear infinite;
  color: var(--color-primary);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text);
}

.progress-step {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* 滚动条样式 */
.conflict-report-container::-webkit-scrollbar {
  width: 6px;
}

.conflict-report-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.conflict-report-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.conflict-report-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Enhanced Check Tooltip */
.enhanced-toggle-wrapper {
  position: relative;
  display: inline-flex;
  cursor: pointer;
  padding: 2px;
}

.enhanced-tooltip {
  position: fixed;
  width: 360px;
  max-width: calc(100vw - 24px);
  background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%);
  border: 1px solid rgba(201, 169, 110, 0.2);
  border-radius: var(--r-md);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  padding: 0;
  overflow: hidden;
  z-index: 9999;
  animation: tooltipFadeIn 0.2s ease;
  pointer-events: none;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(201, 169, 110, 0.1);
  border-bottom: 1px solid rgba(201, 169, 110, 0.15);
}

.tooltip-title {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--gold);
  letter-spacing: 0.02em;
}

.tooltip-status {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: var(--r-sm);
  background: rgba(156, 156, 156, 0.2);
  color: #9c9c9c;
}

.tooltip-status.active {
  background: rgba(90, 123, 108, 0.3);
  color: var(--c-jade);
}

.tooltip-content {
  padding: 14px;
}

.tooltip-section {
  margin-bottom: 14px;
}

.tooltip-section:last-child {
  margin-bottom: 0;
}

.tooltip-section h4 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--gold);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tooltip-section h4::before {
  content: '';
  width: 4px;
  height: 4px;
  background: var(--gold);
  border-radius: 50%;
}

.tooltip-section.warning h4::before {
  background: var(--c-amber);
}

.tooltip-section.warning h4 {
  color: var(--c-amber);
}

.tooltip-section p {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
}

.tooltip-section ul {
  margin: 0;
  padding-left: 16px;
  list-style: none;
}

.tooltip-section li {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.7;
  position: relative;
  padding-left: 12px;
}

.tooltip-section li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--gold);
  font-size: 0.625rem;
}

.tooltip-section.warning li::before {
  color: var(--c-amber);
}

.tooltip-arrow {
  position: absolute;
  bottom: -6px;
  right: 10px;
  width: 12px;
  height: 12px;
  background: #252525;
  border-right: 1px solid rgba(201, 169, 110, 0.2);
  border-bottom: 1px solid rgba(201, 169, 110, 0.2);
  transform: rotate(45deg);
}

/* Tooltip transition */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
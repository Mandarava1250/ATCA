<template>
  <div class="admin-page">
    <!-- 页面标题 -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">{{ $t('admin.aiPageTitle') }}</h2>
        <span class="page-subtitle">{{ $t('admin.aiCount', { count: aiList.length }) }}</span>
      </div>
      <div class="toolbar-right">
        <!-- 批量操作 -->
        <div v-if="selectedIds.length > 0" class="batch-bar">
          <span class="batch-count">{{ $t('admin.selected', { count: selectedIds.length }) }}</span>
          <button class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDelete">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            {{ $t('admin.batchDelete') }}
          </button>
          <button class="atca-btn atca-btn-sm atca-btn-secondary" @click="selectedIds = []">{{ $t('admin.cancel') }}</button>
        </div>
        <button class="atca-btn atca-btn-sm" @click="showForm = true; resetForm();">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          {{ $t('admin.newConfig') }}
        </button>
      </div>
    </div>

    <!-- 列表区域 -->
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check"><input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" /></th>
            <th class="col-name">{{ $t('admin.name') }}</th>
            <th class="col-provider">{{ $t('admin.provider') }}</th>
            <th class="col-model">{{ $t('admin.model') }}</th>
            <th class="col-endpoint">{{ $t('admin.endpoint') }}</th>
            <th class="col-status">{{ $t('admin.status') }}</th>
            <th class="col-default">{{ $t('admin.default') }}</th>
            <th class="col-actions">{{ $t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ai in aiList" :key="ai.ai_id">
            <td class="col-check"><input type="checkbox" :value="ai.ai_id" v-model="selectedIds" /></td>
            <td class="col-name">
              <div class="ai-name">{{ ai.name }}</div>
              <div v-if="ai.description" class="ai-desc">{{ ai.description }}</div>
            </td>
            <td class="col-provider">
              <span class="provider-tag" :class="ai.provider">{{ getProviderLabel(ai.provider) }}</span>
            </td>
            <td class="col-model">{{ ai.model || ai.version || '-' }}</td>
            <td class="col-endpoint">
              <span class="endpoint-text" :title="ai.api_endpoint">{{ ai.api_endpoint }}</span>
            </td>
            <td class="col-status">
              <span class="badge" :class="ai.is_active ? 'active' : 'inactive'">{{ ai.is_active ? $t('admin.enabled') : $t('admin.disabled') }}</span>
            </td>
            <td class="col-default">
              <button class="star-btn" :class="{ active: ai.is_default }" @click="toggleDefault(ai.ai_id)">
                {{ ai.is_default ? '&#9733;' : '&#9734;' }}
              </button>
            </td>
            <td class="col-actions">
              <button class="btn-text" @click="testAI(ai)">{{ $t('admin.test') }}</button>
              <button class="btn-text" @click="editAI(ai)">{{ $t('admin.edit') }}</button>
              <button class="btn-text danger" @click="deleteAI(ai.ai_id)">{{ $t('admin.delete') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="aiList.length === 0" class="empty-table">
      <div v-if="errorMsg" style="color:var(--color-error);margin-bottom:8px">{{ errorMsg }}</div>
      <div v-else>{{ $t('admin.noAIConfig') }}</div>
    </div>
    </div>

    <!-- 编辑/新增弹窗 -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editingAI ? $t('admin.editConfig') : $t('admin.addConfig') }}</h3>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>

        <!-- 提供商选择 -->
        <div class="form-group">
          <label>{{ $t('admin.provider') }} <span class="required">*</span></label>
          <div class="provider-grid">
            <button
              v-for="p in providers"
              :key="p.value"
              class="provider-card"
              :class="{ active: form.provider === p.value }"
              @click="selectProvider(p.value)"
            >
              <span class="provider-icon">{{ p.icon }}</span>
              <span class="provider-label">{{ p.label }}</span>
              <span class="provider-desc">{{ p.desc }}</span>
            </button>
          </div>
        </div>

        <!-- 基础信息 -->
        <div class="form-section">
          <h4>{{ $t('admin.basicInfo') }}</h4>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>{{ $t('admin.name') }} <span class="required">*</span></label>
              <input v-model="form.name" class="atca-input" :placeholder="t('admin.aiNamePlaceholder')" />
            </div>
            <div class="form-group flex-1">
              <label>{{ $t('admin.aiModel') }} <span class="required">*</span></label>
              <div v-if="showModelSelect" class="model-input-group">
                <select v-model="form.model" class="atca-input" @change="onModelChange">
                  <option v-for="m in currentModels" :key="m" :value="m">{{ m }}</option>
                </select>
                <input v-model="form.model" class="atca-input model-custom" :placeholder="t('admin.modelPlaceholder')" />
              </div>
              <input v-else v-model="form.model" class="atca-input" :placeholder="t('admin.modelCustomPlaceholder')" />
            </div>
          </div>
        </div>

        <!-- 认证信息 -->
        <div class="form-section">
          <h4>{{ $t('admin.authInfo') }}</h4>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>{{ $t('admin.appId') }}</label>
              <input v-model="form.app_id" class="atca-input" :placeholder="$t('admin.appIdPlaceholder')" />
            </div>
            <div class="form-group flex-1">
              <label>{{ $t('admin.apiKey') }} <span class="required">*</span></label>
              <input v-model="form.api_key" class="atca-input" :placeholder="$t('admin.apiKeyPlaceholder')" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>{{ $t('admin.apiSecret') }}</label>
              <input v-model="form.api_secret" class="atca-input" :placeholder="$t('admin.apiSecretPlaceholder')" />
            </div>
            <div class="form-group flex-1">
              <label>{{ $t('admin.apiEndpoint') }} <span class="required">*</span></label>
              <input v-model="form.api_endpoint" class="atca-input" :placeholder="$t('admin.apiEndpointPlaceholder')" />
            </div>
          </div>
        </div>

        <!-- 高级参数 -->
        <div class="form-section">
          <h4>{{ $t('admin.advancedParams') }}</h4>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>{{ $t('admin.temperature') }} <span class="hint">{{ $t('admin.temperatureHint') }}</span></label>
              <input v-model.number="form.temperature" type="number" min="0.1" max="1" step="0.1" class="atca-input" />
            </div>
            <div class="form-group flex-1">
              <label>{{ $t('admin.maxTokens') }} <span class="hint">{{ $t('admin.maxTokensHint') }}</span></label>
              <input v-model.number="form.max_tokens" type="number" min="1" max="8192" class="atca-input" />
            </div>
          </div>
        </div>

        <!-- 其他设置 -->
        <div class="form-section">
          <h4>{{ $t('admin.otherSettings') }}</h4>
          <div class="form-group">
            <label>{{ $t('admin.systemPrompt') }}</label>
            <textarea v-model="form.system_prompt" class="atca-input" rows="3" :placeholder="$t('admin.systemPromptPlaceholder')"></textarea>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.aiDescription') }}</label>
            <input v-model="form.description" class="atca-input" :placeholder="t('admin.descPlaceholder')" />
          </div>
          <div class="form-row">
            <label class="toggle-label">
              <input type="checkbox" v-model="form.is_active" />
              <span>{{ $t('admin.enableAI') }}</span>
            </label>
            <label class="toggle-label">
              <input type="checkbox" v-model="form.is_default" />
              <span>{{ $t('admin.setDefaultAI') }}</span>
            </label>
          </div>
        </div>

        <!-- 并发配置 -->
        <div class="form-section">
          <h4>{{ $t('admin.concurrencySettings') || '并发设置' }}</h4>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>{{ $t('admin.maxConcurrent') || '最大并发数' }}</label>
              <input v-model.number="form.max_concurrent" type="number" min="1" max="100" class="atca-input" :placeholder="$t('admin.maxConcurrentPlaceholder') || '3'" />
            </div>
            <div class="form-group flex-1">
              <label>{{ $t('admin.maxQueueSize') || '最大排队数' }}</label>
              <input v-model.number="form.max_queue_size" type="number" min="1" max="1000" class="atca-input" :placeholder="$t('admin.maxQueueSizePlaceholder') || '20'" />
            </div>
            <div class="form-group flex-1">
              <label>{{ $t('admin.queueTimeout') || '排队超时(秒)' }}</label>
              <input v-model.number="form.queue_timeout" type="number" min="10" max="300" class="atca-input" :placeholder="$t('admin.queueTimeoutPlaceholder') || '60'" />
            </div>
          </div>
          <div class="form-hint">{{ $t('admin.concurrencyHint') || '设置AI的最大并发请求数和排队队列大小，超出限制的请求将被拒绝' }}</div>
        </div>

        <div class="form-actions">
          <button class="atca-btn atca-btn-primary" @click="submitForm" :disabled="submitting">{{ submitting ? $t('admin.saving') : $t('common.save') }}</button>
          <button class="atca-btn" @click="showForm = false">{{ $t('common.cancel') }}</button>
        </div>
      </div>
    </div>

    <!-- 测试弹窗 -->
    <div v-if="showTest" class="modal-overlay" @click.self="showTest = false">
      <div class="modal-card modal-card-lg">
        <div class="modal-header">
          <h3>{{ $t('admin.testAI') }} - {{ testConfig?.name }}</h3>
          <button class="modal-close" @click="showTest = false">&times;</button>
        </div>
        <div class="test-section">
          <label>{{ $t('admin.testMessage') || '测试消息' }}</label>
          <input v-model="testMessage" class="atca-input" :placeholder="$t('admin.testMessagePlaceholder') || '输入测试消息...'" />
          <button class="atca-btn atca-btn-primary" @click="runTest" :disabled="testing">
            {{ testing ? $t('admin.testing') || '测试中...' : $t('admin.sendTest') || '发送测试' }}
          </button>
        </div>
        <div v-if="testResult" class="test-result" :class="{ error: testResult.error }">
          <div v-if="testResult.loading" class="test-loading">{{ $t('admin.testLoading') || '测试中，请稍候...' }}</div>
          <div v-else-if="testResult.error" class="test-error">
            <div class="error-title">{{ $t('admin.testFailed') || '测试失败' }}</div>
            <pre>{{ testResult.response }}</pre>
          </div>
          <div v-else>
            <div class="result-meta">{{ $t('admin.model') || '模型' }}: {{ testResult.model }} | {{ $t('admin.provider') || '提供商' }}: {{ testResult.provider }}</div>
            <pre>{{ testResult.response }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { adminApi } from '@/services/api';
import { useI18n } from 'vue-i18n';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('AdminAI');
const { t } = useI18n();

interface AIConfig {
  ai_id: number; name: string; provider: string;
  model?: string; version?: string; description?: string;
  api_endpoint?: string; is_active?: boolean; is_default?: boolean;
  app_id?: string; api_key?: string; api_secret?: string;
  system_prompt?: string; temperature?: number; max_tokens?: number;
  max_concurrent?: number; max_queue_size?: number; queue_timeout?: number;
}

const aiList = ref<AIConfig[]>([]);
const showForm = ref(false);
const showTest = ref(false);
const testConfig = ref<AIConfig | null>(null);
const testMessage = ref('中国古代建筑有哪些特点？');
const testResult = ref<any>(null);
const testing = ref(false);
const submitting = ref(false);
const editingAI = ref<AIConfig | null>(null);

// 批量选择
const selectedIds = ref<number[]>([]);
const isAllSelected = computed(() => aiList.value.length > 0 && selectedIds.value.length === aiList.value.length);

function toggleSelectAll() {
  if (isAllSelected.value) { selectedIds.value = []; }
  else { selectedIds.value = aiList.value.map(a => a.ai_id); }
}

async function batchDelete() {
  if (!confirm(`确认删除选中的 ${selectedIds.value.length} 个AI配置？`)) return;
  try {
    for (const id of selectedIds.value) { await adminApi.deleteAIConfig(id); }
    selectedIds.value = [];
    loadData();
  } catch (e: any) { alert('批量删除失败: ' + e.message); }
}

const form = ref({
  name: '', provider: '', model: '', api_endpoint: '', api_key: '',
  app_id: '', api_secret: '', system_prompt: '', description: '',
  temperature: 0.7, max_tokens: 2048, is_active: true, is_default: false,
  max_concurrent: 3, max_queue_size: 20, queue_timeout: 60,
});

const providers = [
  { value: 'openai', label: 'OpenAI', icon: 'O', desc: 'GPT系列', models: ['gpt-4o','gpt-4o-mini','gpt-3.5-turbo'], placeholder: { model: 'gpt-4o', endpoint: 'https://api.openai.com/v1/chat/completions' } },
  { value: 'qwan', label: '通义千问', icon: '千', desc: '阿里云百炼', models: ['qwen-turbo','qwen-plus','qwen-max','qwen-coder-plus','qwen2.5-72b-instruct','qwen2.5-14b-instruct'], placeholder: { model: 'qwen-turbo', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' } },
  { value: 'deepseek', label: 'DeepSeek', icon: 'D', desc: '深度求索', models: ['deepseek-chat','deepseek-coder'], placeholder: { model: 'deepseek-chat', endpoint: 'https://api.deepseek.com/v1/chat/completions' } },
  { value: 'kimi', label: 'Kimi', icon: '月', desc: '月之暗面', models: ['moonshot-v1-8k','moonshot-v1-32k','moonshot-v1-128k'], placeholder: { model: 'moonshot-v1-8k', endpoint: 'https://api.moonshot.cn/v1/chat/completions' } },
  { value: 'spark', label: '讯飞星火', icon: '星', desc: '支持HTTP/WebSocket', models: ['lite','generalv3','pro-128k','generalv3.5','max-32k','4.0Ultra'], placeholder: { model: 'lite', endpoint: 'https://spark-api-open.xf-yun.com/v1/chat/completions' } },
  { value: 'baidu', label: '百度千帆', icon: '百', desc: '文心大模型', models: ['ernie-4.0-turbo','ernie-3.5-128k'], placeholder: { model: 'ernie-4.0-turbo', endpoint: 'https://qianfan.baidubce.com/v2/chat/completions' } },
  { value: 'aliyun', label: '阿里云', icon: '云', desc: '通义千问原生', models: ['qwen-turbo','qwen-plus','qwen-max'], placeholder: { model: 'qwen-turbo', endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation' } },
  { value: 'custom', label: '自定义', icon: '自', desc: '其他兼容OpenAI的API', models: [], placeholder: { model: 'custom-model', endpoint: 'https://api.example.com/v1/chat/completions' } },
];

const currentProvider = computed(() => providers.find(p => p.value === form.value.provider));
const showModelSelect = computed(() => (currentProvider.value?.models.length || 0) > 0);
const currentModels = computed(() => currentProvider.value?.models || []);

function selectProvider(p: string) {
  form.value.provider = p;
  const prov = providers.find(x => x.value === p);
  if (!prov) return;
  form.value.api_endpoint = prov.placeholder.endpoint;
  form.value.model = prov.models[0] || prov.placeholder.model;
  if (!editingAI.value && !form.value.name) { form.value.name = prov.label + '助手'; }
}

function onModelChange() { /* HTTP模式不自动改endpoint */ }

function resetForm() {
  editingAI.value = null;
  form.value = { 
    name: '', provider: 'openai', model: 'gpt-4o', api_endpoint: 'https://api.openai.com/v1/chat/completions', 
    api_key: '', app_id: '', api_secret: '', system_prompt: '', description: '', 
    temperature: 0.7, max_tokens: 2048, is_active: true, is_default: false,
    max_concurrent: 3, max_queue_size: 20, queue_timeout: 60 
  };
}

function editAI(ai: AIConfig) {
  editingAI.value = ai;
  form.value = {
    name: ai.name || '', provider: ai.provider || '', model: ai.model || ai.version || '',
    api_endpoint: ai.api_endpoint || '', api_key: ai.api_key || '', app_id: ai.app_id || '',
    api_secret: ai.api_secret || '', system_prompt: (ai as any).system_prompt || '',
    description: ai.description || '', temperature: (ai as any).temperature ?? 0.7,
    max_tokens: (ai as any).max_tokens ?? 2048, is_active: ai.is_active ?? true,
    is_default: ai.is_default ?? false,
    max_concurrent: ai.max_concurrent ?? 3, 
    max_queue_size: ai.max_queue_size ?? 20, 
    queue_timeout: ai.queue_timeout ?? 60,
  };
  showForm.value = true;
}

async function submitForm() {
  if (!form.value.name.trim()) { alert('请输入名称'); return; }
  if (!form.value.model?.trim()) { alert('请输入模型'); return; }
  if (!form.value.api_key?.trim()) { alert('请输入API Key'); return; }
  if (!form.value.api_endpoint?.trim()) { alert('请输入接口地址'); return; }

  submitting.value = true;
  try {
    const payload: any = {
      name: form.value.name.trim(), provider: form.value.provider, model: form.value.model.trim(),
      api_endpoint: form.value.api_endpoint.trim(), api_key: form.value.api_key?.trim() || null,
      app_id: form.value.app_id?.trim() || null, api_secret: form.value.api_secret?.trim() || null,
      system_prompt: form.value.system_prompt?.trim() || null,
      description: form.value.description?.trim() || null,
      temperature: Number(form.value.temperature) || 0.7, max_tokens: Number(form.value.max_tokens) || 2048,
      is_active: form.value.is_active, is_default: form.value.is_default,
      max_concurrent: Number(form.value.max_concurrent) || 3,
      max_queue_size: Number(form.value.max_queue_size) || 20,
      queue_timeout: Number(form.value.queue_timeout) || 60,
    };
    if (editingAI.value) {
      await adminApi.updateAIConfig(editingAI.value.ai_id, payload);
    } else {
      await adminApi.createAIConfig(payload);
    }
    showForm.value = false;
    loadData();
  } catch (e: any) {
    const errData = e.response?.data?.error;
    let msg = errData?.message || e.message || '未知错误';
    // 显示详细的验证错误
    if (errData?.details) {
      msg += '\n\n详细信息:\n' + errData.details;
    }
    alert('保存失败: ' + msg);
  }
  finally { submitting.value = false; }
}

async function testAI(ai: AIConfig) {
  testConfig.value = ai;
  showTest.value = true;
  testResult.value = null;
  testMessage.value = '中国古代建筑有哪些特点？';
}

async function runTest() {
  if (!testConfig.value || !testMessage.value.trim()) return;
  testResult.value = { loading: true };
  testing.value = true;
  try {
    const res = await adminApi.testAI(testConfig.value.ai_id, testMessage.value.trim());
    testResult.value = res.data?.data || res.data;
    if (res.data?.error) { testResult.value = { error: true, response: res.data.error.message }; }
  } catch (e: any) { testResult.value = { error: true, response: e.response?.data?.error?.message || e.message }; }
  finally { testing.value = false; }
}

async function toggleDefault(id: number) {
  try { await adminApi.updateAIConfig(id, { is_default: true }); loadData(); }
  catch (e: any) { alert('操作失败: ' + e.message); }
}

async function deleteAI(id: number) {
  if (!confirm('确认删除此AI配置？')) return;
  try { await adminApi.deleteAIConfig(id); loadData(); }
  catch (e: any) { alert('删除失败: ' + e.message); }
}

function getProviderLabel(p?: string) {
  const map: Record<string, string> = { openai: 'OpenAI', qwan: '通义千问', deepseek: 'DeepSeek', kimi: 'Kimi', spark: '讯飞星火', baidu: '百度千帆', aliyun: '阿里云', custom: '自定义' };
  return map[p || ''] || (p || '未知');
}

const errorMsg = ref('');

async function loadData() {
  errorMsg.value = '';
  try {
    // 兼容处理：优先使用getAIList，不存在则使用getAIConfigs
    const apiMethod = (adminApi as any).getAIList || (adminApi as any).getAIConfigs;
    if (!apiMethod || typeof apiMethod !== 'function') {
      throw new Error('adminApi中没有可用的AI列表方法(getAIList/getAIConfigs)');
    }
    const res = await apiMethod.call(adminApi);
    // response interceptor 已解包: res = { success, data }
    aiList.value = res.data || [];
    if (!aiList.value.length) errorMsg.value = '数据库中没有AI配置记录';
  } catch (e: any) {
    console.error('[AI] 加载失败:', e);
    const msg = e?.message || String(e);
    if (msg.includes('getAllList') || msg.includes('is not a function')) {
      errorMsg.value = 'API方法不匹配，请按 Ctrl+F5 强制刷新页面';
    } else {
      errorMsg.value = '加载失败: ' + msg;
    }
  }
}

// 切换界面时自动刷新
function handleRouteChange() { loadData(); }
window.addEventListener('admin-route-change', handleRouteChange);
memTrack.trackListener('admin-route-change', 'window');
onUnmounted(() => { memTrack.untrackListener('admin-route-change', 'window'); window.removeEventListener('admin-route-change', handleRouteChange); });
onMounted(() => { loadData(); });
</script>

<style scoped>
.admin-page { display: flex; flex-direction: column; gap: 20px; padding: 24px; }
.page-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.toolbar-left { display: flex; align-items: baseline; gap: 12px; }
.page-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
.page-subtitle { font-size: 0.75rem; color: var(--color-text-muted); }
.toolbar-right { display: flex; align-items: center; gap: 12px; }

/* 批量操作栏 */
.batch-bar { display: flex; align-items: center; gap: 8px; background: var(--color-surface-warm); padding: 6px 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border-light); }
.batch-count { font-size: 0.8125rem; font-weight: 500; color: var(--color-accent); }

/* 表格 */
.data-table-wrapper { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
.data-table th { background: var(--color-surface-alt); padding: 10px 12px; text-align: left; font-size: 0.6875rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid var(--color-border-light); vertical-align: middle; }
.data-table tbody tr:hover { background: var(--color-surface-warm); }
.col-check { width: 40px; text-align: center; }
.col-name { min-width: 180px; }
.col-provider { width: 100px; }
.col-model { width: 120px; }
.col-endpoint { max-width: 200px; }
.col-status { width: 80px; }
.col-default { width: 60px; text-align: center; }
.col-actions { width: 160px; white-space: nowrap; }

.ai-name { font-weight: 600; }
.ai-desc { font-size: 0.6875rem; color: var(--color-text-muted); margin-top: 2px; }
.provider-tag { font-size: 0.75rem; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 500; }
.provider-tag.spark { background: rgba(234, 88, 12, 0.1); color: #c2410c; }
.provider-tag.openai { background: rgba(16, 185, 129, 0.1); color: #059669; }
.provider-tag.qwan { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
.provider-tag.deepseek { background: rgba(99, 102, 241, 0.1); color: #4f46e5; }
.provider-tag.baidu { background: rgba(37, 99, 235, 0.1); color: #1d4ed8; }
.provider-tag.custom { background: rgba(100, 116, 139, 0.1); color: #64748b; }

.endpoint-text { font-size: 0.6875rem; color: var(--color-text-muted); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }

.badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 500; }
.badge.active { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
.badge.inactive { background: rgba(100, 116, 139, 0.1); color: #64748b; }

.star-btn { background: none; border: none; font-size: 1.25rem; color: var(--color-text-muted); cursor: pointer; }
.star-btn:hover { color: var(--color-gold); }
.star-btn.active { color: var(--color-gold); }

.btn-text { background: none; border: none; color: var(--color-primary); font-size: 0.75rem; cursor: pointer; padding: 2px 4px; }
.btn-text:hover { text-decoration: underline; }
.btn-text.danger { color: var(--color-error); }
.empty-table { padding: 48px; text-align: center; color: var(--color-text-muted); }

/* 弹窗 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { background: var(--color-surface); border-radius: var(--radius-lg); width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; }
.modal-card-lg { max-width: 720px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
.modal-header h3 { margin: 0; font-size: 1rem; }
.modal-close { background: none; border: none; font-size: 1.5rem; color: var(--color-text-muted); cursor: pointer; }
.modal-close:hover { color: var(--color-text); }

.form-section { padding: 16px 24px; border-bottom: 1px solid var(--color-border-light); }
.form-section h4 { font-size: 0.8125rem; font-weight: 600; color: var(--color-text-muted); margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.04em; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 6px; }
.form-group label .required { color: var(--color-error); }
.form-group label .hint { font-weight: 400; font-size: 0.6875rem; color: var(--color-text-muted); }
.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }
.flex-1 { flex: 1; }
.form-actions { padding: 20px 24px; display: flex; gap: 12px; justify-content: flex-end; }

/* 提供商选择 */
.provider-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.provider-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px; border: 2px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; background: var(--color-surface); transition: all var(--transition-fast); }
.provider-card:hover { border-color: var(--color-primary); background: var(--color-surface-warm); }
.provider-card.active { border-color: var(--color-primary); background: rgba(var(--color-primary-rgb), 0.06); }
.provider-icon { font-size: 1.25rem; }
.provider-label { font-size: 0.75rem; font-weight: 600; }
.provider-desc { font-size: 0.625rem; color: var(--color-text-muted); }

/* 模型选择 */
.model-input-group { display: flex; gap: 8px; }
.model-input-group select { flex: 0 0 50%; }
.model-input-group .model-custom { flex: 1; font-size: 0.8125rem; }

/* 开关 */
.toggle-label { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; cursor: pointer; }
.toggle-label input { width: 16px; height: 16px; }

/* 测试弹窗 */
.test-section { padding: 20px 24px; display: flex; gap: 12px; align-items: flex-end; }
.test-section label { font-size: 0.8125rem; font-weight: 500; }
.test-section .atca-input { flex: 1; }
.test-result { padding: 16px 24px; background: var(--color-surface-warm); border-top: 1px solid var(--color-border-light); }
.test-result pre { white-space: pre-wrap; word-break: break-all; font-size: 0.8125rem; background: var(--color-surface); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); max-height: 300px; overflow-y: auto; }
.test-result.error pre { color: var(--color-error); }
.error-title { font-weight: 600; color: var(--color-error); margin-bottom: 8px; }
.result-meta { font-size: 0.6875rem; color: var(--color-text-muted); margin-bottom: 8px; }
.test-loading { text-align: center; color: var(--color-text-muted); padding: 20px; }

</style>

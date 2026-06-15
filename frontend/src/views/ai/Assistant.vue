<template>
  <div class="page">
    <Navbar />
    <div class="container page-content">
      <div class="page-header">
        <h1 class="atca-title atca-title-lg">{{ $t('assistant.pageTitle') }}</h1>
        <p class="atca-text-muted">{{ $t('assistant.pageSubtitle') }}</p>
      </div>

      <div class="chat-container">
        <div class="chat-messages" ref="messagesContainer">
          <div v-for="msg in messages" :key="msg.id" class="message" :class="msg.role">
            <div class="message-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
            <div class="message-content">
              <div class="message-text" v-html="formatContent(msg.content)"></div>
              <span v-if="msg.provider" class="message-meta">{{ msg.provider }} · {{ msg.model }}</span>
            </div>
          </div>
          <div v-if="streaming" class="message assistant">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="message-text">{{ streamContent }}<span class="cursor">▌</span></div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <div class="provider-select">
            <select v-model="selectedProvider" class="atca-input">
              <option value="">{{ $t('assistant.default') }}</option>
              <option value="openai">OpenAI</option>
              <option value="claude">Claude</option>
              <option value="kimi">Kimi</option>
              <option value="qwen">通义千问</option>
              <option value="gemini">Gemini</option>
              <option value="mistral">Mistral</option>
              <option value="groq">Groq</option>
            </select>
          </div>
          <div class="input-row">
            <textarea
              v-model="inputMessage"
              class="atca-input chat-textarea"
              :placeholder="$t('assistant.placeholder')"
              rows="2"
              @keydown.enter.prevent="sendMessage"
            ></textarea>
            <button class="atca-btn atca-btn-primary send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || streaming">
              {{ $t('assistant.send') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import { assistantApi } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
}

const { t } = useI18n();

const messages = ref<Message[]>([
  {
    id: 'welcome',
    role: 'assistant',
    content: t('assistant.welcomeMsg'),
    provider: '系统',
    model: 'welcome',
  },
]);
const inputMessage = ref('');
const streaming = ref(false);
const streamContent = ref('');
const selectedProvider = ref('');
const messagesContainer = ref<HTMLElement>();

function formatContent(content: string): string {
  return content.replace(/\n/g, '<br>');
}

async function sendMessage() {
  const text = inputMessage.value.trim();
  if (!text || streaming.value) return;

  const userMsg: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: text,
  };
  messages.value.push(userMsg);
  inputMessage.value = '';
  scrollToBottom();

  streaming.value = true;
  streamContent.value = '';

  try {
    const res = await assistantApi.chat(text, selectedProvider.value ? parseInt(selectedProvider.value) : undefined, true);
    if (res.success && res.data) {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.message,
        provider: res.data.provider,
        model: res.data.model,
      };
      messages.value.push(assistantMsg);
    }
  } catch (e) {
    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: t('assistant.errorMsg'),
    });
  } finally {
    streaming.value = false;
    streamContent.value = '';
    scrollToBottom();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }
.page-content { flex: 1; padding-top: 100px; padding-bottom: 48px; max-width: 900px; }
.page-header { margin-bottom: 24px; }

.chat-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 280px);
  min-height: 400px;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}
.message-content {
  flex: 1;
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  max-width: 80%;
}
.message.user .message-content {
  background: rgba(var(--color-primary-rgb), 0.08);
}
.message-text {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--color-text);
}
.cursor {
  animation: blink 1s infinite;
  color: var(--color-primary);
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.message-meta {
  display: block;
  margin-top: 8px;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

.chat-input-area {
  border-top: 1px solid var(--color-border);
  padding: 16px 24px;
}
.provider-select {
  margin-bottom: 12px;
}
.provider-select select {
  width: 200px;
  padding: 6px 12px;
  font-size: 0.8125rem;
}
.input-row {
  display: flex;
  gap: 12px;
}
.chat-textarea {
  flex: 1;
  resize: none;
  padding: 12px 16px;
}
.send-btn {
  padding: 12px 24px;
  align-self: flex-end;
}

@media (max-width: 768px) {
  .chat-container { height: calc(100vh - 240px); }
  .message-content { max-width: 90%; }
  .input-row { flex-direction: column; }
  .send-btn { width: 100%; }
}
</style>

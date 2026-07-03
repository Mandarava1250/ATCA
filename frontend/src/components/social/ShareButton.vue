<template>
  <div class="share-wrap">
    <button class="share-btn" @click="showMenu = !showMenu" title="分享">
      <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="18" cy="5" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="6" cy="12" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="18" cy="19" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      分享
    </button>
    <div v-if="showMenu" class="share-menu">
      <button class="share-item" @click="share('wechat')">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.12C7.5 16.22 8.46 16.5 9.5 16.5c.17 0 .33 0 .5-.02-.3-.62-.5-1.3-.5-2.02 0-2.76 2.69-5 6-5 .7 0 1.37.1 2 .27C16.86 6.58 13.54 4 9.5 4zm12 6c-2.76 0-5 1.79-5 4s2.24 4 5 4c.74 0 1.44-.14 2.08-.38L21 19l-.66-1.78C20.82 16.52 21 15.78 21 15c0-2.21-2.24-4-5-4z" fill="currentColor"/></svg>
        微信
      </button>
      <button class="share-item" @click="share('weibo')">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M10.98 20.08c-3.45.55-6.42-1.2-6.64-3.91-.22-2.71 2.4-5.47 5.85-6.02 3.45-.55 6.42 1.2 6.64 3.91.22 2.71-2.4 5.47-5.85 6.02zM17.86 7.5c-.26 0-.5.04-.72.1-.24.07-.39.3-.32.54.07.24.3.39.54.32.14-.04.29-.06.44-.06.95 0 1.72.77 1.72 1.72 0 .35-.1.67-.28.94-.14.2-.09.48.11.62.2.14.48.09.62-.11.28-.4.44-.89.44-1.41 0-1.46-1.19-2.66-2.65-2.66z" fill="currentColor"/><path d="M17.5 4c-1.38 0-2.63.43-3.58 1.16-.21.16-.25.46-.09.67.16.21.46.25.67.09.74-.56 1.72-.92 2.83-.92 2.48 0 4.5 2.02 4.5 4.5 0 .67-.15 1.31-.42 1.88-.1.22 0 .48.22.58.22.1.48 0 .58-.22.35-.74.54-1.57.54-2.42 0-3.04-2.46-5.5-5.5-5.5z" fill="currentColor"/></svg>
        微博
      </button>
      <button class="share-item" @click="copyLink">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        复制链接
      </button>
    </div>
    <div v-if="copied" class="share-copied">链接已复制！</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { socialApi } from '@/services/api';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('ShareButton');

const props = defineProps<{
  targetType: string;
  targetId: number;
  targetTitle: string;
}>();

const showMenu = ref(false);
const copied = ref(false);

async function share(platform: string) {
  showMenu.value = false;
  try {
    await socialApi.createShare({
      target_type: props.targetType,
      target_id: props.targetId,
      target_title: props.targetTitle,
      platform,
    });
  } catch { /* 静默失败 */ }
  if (platform === 'wechat') alert('请使用微信扫一扫分享');
  else if (platform === 'weibo') {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(props.targetTitle);
    window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`, '_blank');
  }
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    copied.value = true;
    const handle = setTimeout(() => copied.value = false, 2000);
    memTrack.trackTimer('share-copy-feedback', handle as unknown as number, 2000);
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = window.location.href;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    copied.value = true;
    const handle = setTimeout(() => copied.value = false, 2000);
    memTrack.trackTimer('share-copy-feedback', handle as unknown as number, 2000);
  });
  showMenu.value = false;
}
</script>

<style scoped>
.share-wrap { position: relative; display: inline-block; }
.share-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all var(--t);
}
.share-btn:hover { border-color: var(--c-red); color: var(--c-red); }
.share-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 130px;
}
.share-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background var(--t);
  white-space: nowrap;
}
.share-item:hover { background: var(--bg-hover); }
.share-copied {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  padding: 6px 12px;
  background: var(--c-jade);
  color: #fff;
  font-size: 0.75rem;
  border-radius: var(--r-sm);
  z-index: 100;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
</style>

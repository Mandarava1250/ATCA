<template>
  <div class="splash-screen" @click="enterSite">
    <!-- 旋转装饰圆环 -->
    <div class="splash-rings">
      <div class="splash-ring ring-1"></div>
      <div class="splash-ring ring-2"></div>
      <div class="splash-ring ring-3"></div>
    </div>

    <!-- 浮动粒子背景 -->
    <div class="splash-particles">
      <div v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)"></div>
    </div>

    <!-- 浮动古建文字 -->
    <div class="splash-float-texts">
      <div
          v-for="(t, i) in floatTexts"
          :key="i"
          class="splash-float-item"
          :style="{
          left: t.x + '%',
          top: t.y + '%',
          fontSize: t.size + 'px',
          animationDuration: t.dur + 's',
          animationDelay: t.delay + 's',
        }"
      >
        {{ t.text }}
      </div>
    </div>

    <!-- 中央内容 -->
    <div class="splash-center">
      <!-- Logo SVG -->
      <svg class="splash-logo" viewBox="0 0 120 120" fill="none">
        <path d="M60 8L12 40H28V88H52V56H68V88H92V40H108L60 8Z" fill="none" stroke="#C9A96E" stroke-width="2" opacity="0.9"/>
        <path d="M60 8L12 40H28V88H52V56H68V88H92V40H108L60 8Z" fill="#C9A96E" opacity="0.08"/>
        <path d="M36 96H84V100H36V96Z" fill="#C9A96E" opacity="0.4"/>
        <path d="M44 100H76V104H44V100Z" fill="#C9A96E" opacity="0.25"/>
        <!-- 装饰飞檐 -->
        <path d="M20 40Q60 20 100 40" stroke="#C9A96E" stroke-width="1.5" fill="none" opacity="0.5"/>
        <path d="M60 8V4" stroke="#C9A96E" stroke-width="1.5" opacity="0.6"/>
        <circle cx="60" cy="4" r="2" fill="#C9A96E" opacity="0.5"/>
      </svg>

      <!-- 标题 -->
      <h1 class="splash-title">华夏营造</h1>
      <p class="splash-subtitle">中国古代建筑文化传承平台</p>

      <!-- 装饰线 -->
      <div class="splash-ornament">
        <div class="splash-line"></div>
        <span class="splash-diamond">◈</span>
        <div class="splash-line"></div>
      </div>

      <!-- 提示文字 -->
      <div class="splash-hint">
        <span class="hint-text">点击进入</span>
        <div class="hint-pulse"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onMounted, onUnmounted } from 'vue';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('ViewSplash');
const router = useRouter();

/* ========== 键盘支持：Enter / Space 快捷进入 ========== */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    enterSite();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  memTrack.trackListener('keydown', 'window');
});

onUnmounted(() => {
  memTrack.untrackListener('keydown', 'window');
  window.removeEventListener('keydown', onKeydown);
});

const floatTexts = [
  { text: '飞檐', x: 8, y: 15, size: 14, dur: 6, delay: 0 },
  { text: '斗拱', x: 18, y: 45, size: 12, dur: 8, delay: 1 },
  { text: '榫卯', x: 85, y: 20, size: 16, dur: 7, delay: 0.5 },
  { text: '庑殿', x: 78, y: 60, size: 11, dur: 9, delay: 2 },
  { text: '歇山', x: 5, y: 75, size: 13, dur: 6, delay: 1.5 },
  { text: '攒尖', x: 92, y: 80, size: 10, dur: 8, delay: 0.8 },
  { text: '悬山', x: 25, y: 85, size: 14, dur: 7, delay: 2.5 },
  { text: '硬山', x: 70, y: 35, size: 12, dur: 6, delay: 1.2 },
  { text: '卷棚', x: 12, y: 55, size: 11, dur: 9, delay: 3 },
  { text: '抱厦', x: 88, y: 48, size: 13, dur: 7, delay: 1.8 },
  { text: '影壁', x: 40, y: 12, size: 10, dur: 8, delay: 0.3 },
  { text: '牌坊', x: 55, y: 88, size: 14, dur: 6, delay: 2 },
  { text: '照壁', x: 62, y: 18, size: 12, dur: 9, delay: 1 },
  { text: '月洞', x: 35, y: 70, size: 11, dur: 7, delay: 2.2 },
  { text: '垂花', x: 95, y: 10, size: 13, dur: 8, delay: 0.6 },
  { text: '藻井', x: 15, y: 30, size: 10, dur: 6, delay: 1.6 },
];

function particleStyle(i: number) {
  const size = Math.random() * 3 + 1;
  const left = Math.random() * 100;
  const delay = Math.random() * 8;
  const dur = Math.random() * 6 + 4;
  return {
    width: size + 'px',
    height: size + 'px',
    left: left + '%',
    animationDuration: dur + 's',
    animationDelay: delay + 's',
  };
}

function enterSite() {
  const el = document.querySelector('.splash-screen') as HTMLElement | null;
  if (el) {
    // 古典画卷收起效果 - 优雅地向内收缩 (0.25秒快速切换)
    el.style.transition = 'opacity 0.25s cubic-bezier(0.55, 0, 1, 0.45), transform 0.25s cubic-bezier(0.55, 0, 1, 0.45), filter 0.25s cubic-bezier(0.55, 0, 1, 0.45)';
    el.style.opacity = '0';
    el.style.transform = 'scale(1.05)';
    el.style.filter = 'blur(6px)';
  }
  setTimeout(() => {
    router.push('/home');
  }, 250);
}
</script>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: linear-gradient(160deg, #1A1714 0%, #24201C 40%, #1A1714 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  animation: splashFadeIn 1.2s ease-out;
}
@keyframes splashFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== 旋转装饰圆环 ===== */
.splash-rings {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.splash-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(201, 169, 110, 0.06);
  pointer-events: none;
}
.ring-1 { width: 55vh; height: 55vh; animation: ringRotate 30s linear infinite; }
.ring-2 { width: 75vh; height: 75vh; animation: ringRotate 45s linear infinite reverse; }
.ring-3 { width: 95vh; height: 95vh; animation: ringRotate 60s linear infinite; }
@keyframes ringRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== 粒子背景 ===== */
.splash-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  bottom: -10px;
  background: var(--gold);
  border-radius: 50%;
  opacity: 0;
  white-space: nowrap;
  text-shadow: 0 0 6px 1px rgba(201, 169, 110, 0.45);
  animation-name: particleUp;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@keyframes particleUp {
  0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
  10% { opacity: 0.7; }
  50% { transform: translateY(-50vh) translateX(10px) scale(0.9); opacity: 0.4; }
  90% { opacity: 0.15; }
  100% { transform: translateY(-100vh) translateX(-5px) scale(0.3); opacity: 0; }
}

/* ===== 浮动文字 ===== */
.splash-float-texts {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.splash-float-item {
  position: absolute;
  font-family: var(--font-calligraphy);
  color: var(--gold);
  opacity: 0;
  white-space: nowrap;
  text-shadow: 0 0 10px rgba(201, 169, 110, 0.15);
  animation-name: floatTextAnim;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes floatTextAnim {
  0%, 100% { opacity: 0; transform: translateY(0) scale(0.95); }
  25%, 75% { opacity: 0.18; }
  50% { opacity: 0.3; transform: translateY(-18px) scale(1.05); }
}

/* ===== 中央内容 ===== */
.splash-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  animation: centerReveal 1.5s ease-out 0.3s both;
}
@keyframes centerReveal {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.splash-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  animation: logoGlow 3s ease-in-out infinite;
}
@keyframes logoGlow {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(201,169,110,0.3)); }
  50% { filter: drop-shadow(0 0 22px rgba(201,169,110,0.6)); }
}

.splash-title {
  font-family: var(--font-serif);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.3em;
  margin-bottom: 8px;
  animation: titlePulse 4s ease-in-out infinite;
}
@keyframes titlePulse {
  0%, 100% { text-shadow: 0 0 30px rgba(201,169,110,0.25); }
  50% { text-shadow: 0 0 50px rgba(201,169,110,0.45), 0 0 90px rgba(201,169,110,0.1); }
}

.splash-subtitle {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  color: var(--text-muted);
  letter-spacing: 0.15em;
  margin-bottom: 24px;
}

/* 装饰线 */
.splash-ornament {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}
.splash-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
}
.splash-diamond {
  color: var(--gold);
  font-size: 0.875rem;
  opacity: 0.5;
}

/* 点击进入提示 */
.splash-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: hintPulse 2s ease-in-out infinite;
}
.hint-text {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  color: var(--gold);
  letter-spacing: 0.2em;
  opacity: 0.85;
}
.hint-pulse {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--gold-dim);
  position: relative;
}
.hint-pulse::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid var(--gold);
  opacity: 0;
  animation: pulseRing 2s ease-out infinite;
}
.hint-pulse::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  border-left: 8px solid var(--gold);
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}
@keyframes pulseRing {
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes hintPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 底部版权 */
.splash-footer {
  position: absolute;
  bottom: 32px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 2;
}
.splash-footer p {
  font-size: 0.75rem;
  color: var(--text-dim);
  letter-spacing: 0.1em;
}

</style>

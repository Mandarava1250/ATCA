<template>
  <div id="app" :class="{ 'dark-theme': isDark }">
    <!-- 古风水墨过渡遮罩 -->
    <transition 
      name="ink-transition" 
      @before-enter="handleBeforeEnter" 
      @after-enter="handleAfterEnter" 
      @before-leave="handleBeforeLeave" 
      @after-leave="handleAfterLeave">
      <div v-if="isTransitioning" class="ink-overlay" :class="[currentStyle, schemeClass]">
        <!-- 方案1：轻盈飘逸 - 简洁淡雅的遮罩层 -->
        <div v-if="animationSettings.scheme === 'light'" class="light-scheme">
          <div class="light-gradient"></div>
        </div>
        
        <!-- 方案2：水墨晕染 - 经典水墨效果 -->
        <div v-if="animationSettings.scheme === 'ink-wash'" class="ink-wash-scheme">
          <!-- 宣纸纹理背景 -->
          <div class="rice-paper"></div>
          
          <!-- 水墨晕染效果 -->
          <div class="ink-wash-container">
            <div class="ink-wash wash-1"></div>
            <div class="ink-wash wash-2"></div>
            <div class="ink-wash wash-3"></div>
          </div>
          
          <!-- 古典祥云 -->
          <div class="cloud-decoration">
            <svg class="cloud-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#C9A96E;stop-opacity:0.15" />
                  <stop offset="100%" style="stop-color:#8B7A52;stop-opacity:0.05" />
                </linearGradient>
              </defs>
              <g class="clouds">
                <path class="cloud cloud-1" d="M50,100 Q80,60 120,80 T200,70 T280,90 Q320,110 300,130 Q280,150 240,140 T160,150 Q100,140 50,100" fill="url(#cloudGradient)" />
                <path class="cloud cloud-2" d="M80,120 Q110,80 160,100 T260,90 T340,120 Q380,140 360,160 Q330,180 280,170 T180,180 Q110,170 80,120" fill="url(#cloudGradient)" />
                <path class="cloud cloud-3" d="M30,130 Q60,100 100,120 T170,110 T240,130 Q280,150 260,170 Q230,190 180,180 T100,190 Q50,180 30,130" fill="url(#cloudGradient)" />
              </g>
            </svg>
          </div>
          
          <!-- 古典窗格图案 -->
          <div class="window-lattice">
            <svg class="lattice-svg" viewBox="0 0 200 200" preserveAspectRatio="none">
              <defs>
                <pattern id="latticePattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <rect width="40" height="40" fill="none"/>
                  <path d="M0,20 Q10,10 20,20 T40,20 M20,0 Q10,10 20,20 T20,40 M0,20 Q10,30 20,20 T40,20" 
                        stroke="#C9A96E" stroke-width="0.5" fill="none" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="200" height="200" fill="url(#latticePattern)"/>
            </svg>
          </div>
          
          <!-- 古典边框 -->
          <div class="classical-frame">
            <div class="frame-border top"></div>
            <div class="frame-border bottom"></div>
            <div class="frame-border left"></div>
            <div class="frame-border right"></div>
            
            <!-- 边框装饰 -->
            <div class="frame-corner top-left">
              <div class="corner-ornament"></div>
            </div>
            <div class="frame-corner top-right">
              <div class="corner-ornament"></div>
            </div>
            <div class="frame-corner bottom-left">
              <div class="corner-ornament"></div>
            </div>
            <div class="frame-corner bottom-right">
              <div class="corner-ornament"></div>
            </div>
          </div>
        </div>
        
        <!-- 方案3：笔走龙蛇 - 大气磅礴的效果 -->
        <div v-if="animationSettings.scheme === 'dramatic'" class="dramatic-scheme">
          <!-- 宣纸纹理背景 -->
          <div class="rice-paper"></div>
          
          <!-- 动态笔触效果 -->
          <div class="brush-stroke-container">
            <svg class="brush-strokes" viewBox="0 0 100 100" preserveAspectRatio="none">
              <!-- 动态笔触1 -->
              <path class="stroke stroke-1" 
                    d="M0,50 Q25,30 50,50 T100,50" 
                    fill="none" 
                    stroke="url(#strokeGradient)"
                    stroke-width="3"/>
              <!-- 动态笔触2 -->
              <path class="stroke stroke-2" 
                    d="M0,60 Q30,40 60,60 T100,60" 
                    fill="none" 
                    stroke="url(#strokeGradient2)"
                    stroke-width="2"/>
              <!-- 动态笔触3 -->
              <path class="stroke stroke-3" 
                    d="M0,70 Q35,50 70,70 T100,70" 
                    fill="none" 
                    stroke="url(#strokeGradient3)"
                    stroke-width="1.5"/>
              
              <defs>
                <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#C9A96E;stop-opacity:0"/>
                  <stop offset="50%" style="stop-color:#C9A96E;stop-opacity:0.8"/>
                  <stop offset="100%" style="stop-color:#C9A96E;stop-opacity:0"/>
                </linearGradient>
                <linearGradient id="strokeGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#D4B87A;stop-opacity:0"/>
                  <stop offset="50%" style="stop-color:#D4B87A;stop-opacity:0.6"/>
                  <stop offset="100%" style="stop-color:#D4B87A;stop-opacity:0"/>
                </linearGradient>
                <linearGradient id="strokeGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#8B7A52;stop-opacity:0"/>
                  <stop offset="50%" style="stop-color:#8B7A52;stop-opacity:0.4"/>
                  <stop offset="100%" style="stop-color:#8B7A52;stop-opacity:0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <!-- 水墨晕染效果 -->
          <div class="ink-wash-container">
            <div class="ink-wash wash-1"></div>
            <div class="ink-wash wash-2"></div>
            <div class="ink-wash wash-3"></div>
          </div>
          
          <!-- 古典祥云 -->
          <div class="cloud-decoration">
            <svg class="cloud-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cloudGradientD" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#C9A96E;stop-opacity:0.2" />
                  <stop offset="100%" style="stop-color:#8B7A52;stop-opacity:0.1" />
                </linearGradient>
              </defs>
              <g class="clouds">
                <path class="cloud cloud-1" d="M50,100 Q80,60 120,80 T200,70 T280,90 Q320,110 300,130 Q280,150 240,140 T160,150 Q100,140 50,100" fill="url(#cloudGradientD)" />
                <path class="cloud cloud-2" d="M80,120 Q110,80 160,100 T260,90 T340,120 Q380,140 360,160 Q330,180 280,170 T180,180 Q110,170 80,120" fill="url(#cloudGradientD)" />
              </g>
            </svg>
          </div>
          
          <!-- 古典边框 -->
          <div class="classical-frame">
            <div class="frame-border top"></div>
            <div class="frame-border bottom"></div>
            <div class="frame-border left"></div>
            <div class="frame-border right"></div>
            
            <!-- 边框装饰 -->
            <div class="frame-corner top-left">
              <div class="corner-ornament"></div>
            </div>
            <div class="frame-corner top-right">
              <div class="corner-ornament"></div>
            </div>
            <div class="frame-corner bottom-left">
              <div class="corner-ornament"></div>
            </div>
            <div class="frame-corner bottom-right">
              <div class="corner-ornament"></div>
            </div>
          </div>
        </div>
        
        <!-- 中央古典图案（仅水墨晕染和笔走龙蛇方案显示） -->
        <div v-if="animationSettings.scheme !== 'light'" class="center-emblem">
          <!-- 外圈 -->
          <div class="emblem-ring outer">
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="95" fill="none" stroke="#C9A96E" stroke-width="1" opacity="0.4"/>
              <circle cx="100" cy="100" r="90" fill="none" stroke="#C9A96E" stroke-width="0.5" stroke-dasharray="5 3" opacity="0.3"/>
            </svg>
          </div>
          
          <!-- 中圈 -->
          <div class="emblem-ring middle">
            <svg viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="75" fill="none" stroke="#D4B87A" stroke-width="1" opacity="0.5"/>
              <circle cx="80" cy="80" r="70" fill="none" stroke="#C9A96E" stroke-width="0.5" opacity="0.3"/>
            </svg>
          </div>
          
          <!-- 内圈 -->
          <div class="emblem-ring inner">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="55" fill="none" stroke="#C9A96E" stroke-width="1.5" opacity="0.6"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#D4B87A" stroke-width="0.5" opacity="0.4"/>
            </svg>
          </div>
          
          <!-- 中央图案 -->
          <div class="emblem-center">
            <div class="center-icon">{{ currentIcon }}</div>
            <div class="center-glow"></div>
          </div>
          
          <!-- 四个方向的装饰 -->
          <div class="cardinal-point north"></div>
          <div class="cardinal-point south"></div>
          <div class="cardinal-point east"></div>
          <div class="cardinal-point west"></div>
        </div>
        
        <!-- 古典装饰文字（可选显示） -->
        <div v-if="animationSettings.showPageName && animationSettings.scheme !== 'light'" class="classical-text">
          <span class="text-decoration">『</span>
          <span class="main-text">{{ pageName }}</span>
          <span class="text-decoration">』</span>
        </div>
        
        <!-- 底部装饰线 -->
        <div v-if="animationSettings.scheme === 'dramatic'" class="bottom-decoration">
          <div class="deco-line"></div>
          <div class="deco-pattern"></div>
          <div class="deco-line"></div>
        </div>
      </div>
    </transition>

    <router-view v-slot="{ Component }">
      <transition :name="animationSettings.skipTransition ? '' : 'page-unfurl'" mode="out-in" @before-enter="(el) => !animationSettings.skipTransition && perfLogger.perf('页面进入前', { element: el.tagName, path: route.path })" @after-enter="(el) => !animationSettings.skipTransition && perfLogger.perf('页面进入完成', { element: el.tagName, path: route.path })" @before-leave="(el) => !animationSettings.skipTransition && perfLogger.perf('页面离开前', { element: el.tagName, path: route.path })" @after-leave="(el) => !animationSettings.skipTransition && perfLogger.perf('页面离开完成', { element: el.tagName, path: route.path })">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- AI Assistant -->
    <template v-if="!hideAI">
      <AIChatModal />
      <AIChatButton />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore, useQuizStore } from '@/stores';
import { useAnimationSettingsStore } from '@/stores/animationSettings';
import AIChatButton from '@/components/ai/AiAIChatButton.vue';
import AIChatModal from '@/components/ai/AiAIChatModal.vue';
import { createLogger } from '@/utils/logger';

const logger = createLogger('AppRouterTransition');
const perfLogger = logger.child('Performance');

const userStore = useUserStore();
const quizStore = useQuizStore();
const animationSettings = useAnimationSettingsStore();
const route = useRoute();
const isDark = computed(() => userStore.settings?.theme === 'dark');
const isTransitioning = ref(false);
const currentIcon = ref('殿');
const pageName = ref('营造');
const currentStyle = ref('style-home');
let previousPath = route.path;
let transitionStartTime = 0;
let animationFrameCount = 0;
let animationStartTimestamp = 0;

// 计算当前方案的class
const schemeClass = computed(() => {
  return `scheme-${animationSettings.scheme}`;
});

// 获取动画时长（毫秒）
const transitionDuration = computed(() => {
  return animationSettings.getSchemeDuration();
});

// 需要显示转场动画的页面列表
const transitionPages = [
  '/home',           // 首页
  '/architecture',   // 古建筑馆
  '/quiz',           // 知识竞赛
  '/workshop',       // 3D攻防
  '/community',      // 社区讨论
  '/profile',        // 个人详情页
  '/admin',          // 管理
];

// 页面配置
const pageConfig: Record<string, {
  icon: string;
  name: string;
  style: string;
}> = {
  '/home': { icon: '首页', name: '归', style: 'style-home' },
  '/architecture': { icon: '建', name: '观', style: 'style-architecture' },
  '/architecture/detail': { icon: '筑', name: '览', style: 'style-detail' },
  '/quiz': { icon: '试', name: '考', style: 'style-quiz' },
  '/workshop': { icon: '匠', name: '工', style: 'style-workshop' },
  '/community': { icon: '社', name: '雅', style: 'style-community' },
  '/profile': { icon: '人', name: '物', style: 'style-profile' },
  '/admin': { icon: '管', name: '理', style: 'style-admin' },
  'default': { icon: '殿', name: '营造', style: 'style-default' }
};

// 过渡进入前的钩子
function handleBeforeEnter(el: Element) {
  const beforeEnterTime = Date.now();
  animationFrameCount = 0;
  animationStartTimestamp = performance.now();
  
  perfLogger.perf('页面过渡进入前', {
    fromPath: previousPath,
    toPath: route.path,
    timestamp: beforeEnterTime,
    element: el.tagName,
  });
}

// 过渡进入后的钩子
function handleAfterEnter(el: Element) {
  const afterEnterTime = Date.now();
  const duration = afterEnterTime - transitionStartTime;
  
  perfLogger.perf('页面过渡进入完成', {
    fromPath: previousPath,
    toPath: route.path,
    duration,
    timestamp: afterEnterTime,
  });
  
  measureFrameRate();
}

// 过渡离开前的钩子
function handleBeforeLeave(el: Element) {
  const beforeLeaveTime = Date.now();
  
  perfLogger.perf('页面过渡离开前', {
    fromPath: previousPath,
    toPath: route.path,
    timestamp: beforeLeaveTime,
    element: el.tagName,
  });
}

// 过渡离开后的钩子
function handleAfterLeave(el: Element) {
  const afterLeaveTime = Date.now();
  const duration = afterLeaveTime - transitionStartTime;
  
  perfLogger.perf('页面过渡离开完成', {
    fromPath: previousPath,
    toPath: route.path,
    duration,
    timestamp: afterLeaveTime,
  });
}

// 测量帧率
function measureFrameRate() {
  const endTimestamp = performance.now();
  const duration = (endTimestamp - animationStartTimestamp) / 1000;
  const fps = duration > 0 ? Math.round(animationFrameCount / duration) : 0;
  
  perfLogger.perf('动画帧率统计', {
    fromPath: previousPath,
    toPath: route.path,
    frameCount: animationFrameCount,
    duration,
    fps,
  });
}

// 计数动画帧数
function countAnimationFrame() {
  if (isTransitioning.value) {
    animationFrameCount++;
    requestAnimationFrame(countAnimationFrame);
  }
}

watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/splash') return;
  
  const watchStartTime = Date.now();
  previousPath = oldPath || '/';
  
  logger.info('路由变化开始', {
    fromPath: previousPath,
    toPath: newPath,
    skipTransition: animationSettings.skipTransition,
    timestamp: watchStartTime,
    component: 'App.vue',
  });
  
  const config = pageConfig[newPath] || pageConfig['default'];
  currentIcon.value = config.icon;
  pageName.value = config.name;
  currentStyle.value = config.style;
  
  logger.debug('页面配置应用', {
    path: newPath,
    icon: config.icon,
    name: config.name,
    style: config.style,
  });
  
  // 检查是否需要显示转场动画：只有在指定页面之间跳转时才显示
  // 特殊情况：从序幕动画 (/splash) 跳转到其他页面时也需要显示转场
  const isFromSplash = previousPath === '/splash' || previousPath === '/';
  const shouldShowTransition = (transitionPages.includes(newPath) && 
                                transitionPages.includes(previousPath)) ||
                               (isFromSplash && transitionPages.includes(newPath));
  
  // 如果用户设置跳过转场动画，或者当前页面不需要转场动画，则直接完成路由变化
  if (animationSettings.skipTransition || !shouldShowTransition) {
    const skipReason = animationSettings.skipTransition ? '用户设置跳过' : '非指定页面';
    logger.info('跳过转场动画', {
      fromPath: previousPath,
      toPath: newPath,
      reason: skipReason,
      timestamp: Date.now(),
    });
    
    logger.info('路由变化完成', {
      fromPath: previousPath,
      toPath: newPath,
      totalDuration: Date.now() - watchStartTime,
      timestamp: Date.now(),
    });
    return;
  }
  
  isTransitioning.value = true;
  transitionStartTime = Date.now();
  animationFrameCount = 0;
  animationStartTimestamp = performance.now();
  
  perfLogger.perf('过渡遮罩显示', {
    fromPath: previousPath,
    toPath: newPath,
    timestamp: transitionStartTime,
  });
  
  requestAnimationFrame(countAnimationFrame);
  
  setTimeout(() => {
    isTransitioning.value = false;
    const hideTime = Date.now();
    const transitionDurationMs = hideTime - transitionStartTime;
    
    perfLogger.perf('过渡遮罩隐藏', {
      fromPath: previousPath,
      toPath: newPath,
      duration: transitionDurationMs,
      expectedDuration: transitionDuration.value,
      timestamp: hideTime,
    });
    
    logger.info('路由变化完成', {
      fromPath: previousPath,
      toPath: newPath,
      totalDuration: hideTime - watchStartTime,
      timestamp: hideTime,
    });
  }, transitionDuration.value);
});

const hideAI = computed(() => {
  const path = route.path;
  if (path === '/splash' || path.startsWith('/admin')) return true;
  if (path === '/quiz/play') {
    return !quizStore.result;
  }
  return false;
});
</script>

<style>
/* ===== 古风水墨过渡 ===== */

.ink-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #1A1714 0%, #2A2520 50%, #1A1714 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* 方案Class */
.ink-overlay.scheme-light {
  background: linear-gradient(135deg, rgba(26, 23, 20, 0.95) 0%, rgba(42, 37, 32, 0.95) 50%, rgba(26, 23, 20, 0.95) 100%);
}

.ink-overlay.scheme-ink-wash {
  background: linear-gradient(135deg, #1A1714 0%, #2A2520 50%, #1A1714 100%);
}

.ink-overlay.scheme-dramatic {
  background: linear-gradient(135deg, #0F0D0B 0%, #1A1714 50%, #0F0D0B 100%);
}

/* ===== 轻盈飘逸方案样式 ===== */
.light-scheme {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.light-gradient {
  width: 100%;
  height: 100%;
  background: radial-gradient(
    ellipse at center,
    rgba(201, 169, 110, 0.15) 0%,
    rgba(201, 169, 110, 0.05) 30%,
    transparent 70%
  );
  animation: lightPulse 0.3s ease-out;
  position: relative;
}

/* 添加水墨笔触边缘效果 */
.light-gradient::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(139, 122, 82, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(201, 169, 110, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* 轻盈飘逸的云纹装饰 */
.light-scheme::after {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: 
    radial-gradient(ellipse at 30% 30%, rgba(201, 169, 110, 0.03) 0%, transparent 30%),
    radial-gradient(ellipse at 70% 70%, rgba(201, 169, 110, 0.02) 0%, transparent 40%);
  animation: cloudFloat 15s ease-in-out infinite;
  pointer-events: none;
}

@keyframes lightPulse {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes cloudFloat {
  0%, 100% { transform: translate(-10%, -10%) rotate(0deg); }
  50% { transform: translate(10%, 10%) rotate(2deg); }
}

/* ===== 水墨晕染方案样式 ===== */

/* 宣纸纹理 - 增强留白艺术 */
.rice-paper {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(201, 169, 110, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(201, 169, 110, 0.03) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(212, 184, 122, 0.02) 0%, transparent 60%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  animation: paperTexture 20s linear infinite;
  opacity: 0.9;
}

/* 宣纸纹理水印效果 */
.rice-paper::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 50px,
      rgba(201, 169, 110, 0.01) 50px,
      rgba(201, 169, 110, 0.01) 51px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 50px,
      rgba(201, 169, 110, 0.01) 50px,
      rgba(201, 169, 110, 0.01) 51px
    );
  pointer-events: none;
}

@keyframes paperTexture {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-100px, -100px); }
}

/* 水墨晕染 - 增强层次感和过渡效果 */
.ink-wash-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ink-wash {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.18;
  animation: inkFlow 0.4s ease-out;
  /* 添加笔触质感边缘 */
  box-shadow: 
    inset 0 0 60px rgba(201, 169, 110, 0.3),
    inset -20px -20px 40px rgba(139, 122, 82, 0.2),
    inset 20px 20px 40px rgba(212, 184, 122, 0.2);
}

.wash-1 {
  width: 700px;
  height: 700px;
  top: -15%;
  left: -15%;
  background: radial-gradient(
    circle at 30% 30%,
    #C9A96E 0%,
    rgba(201, 169, 110, 0.5) 30%,
    rgba(139, 122, 82, 0.3) 60%,
    transparent 80%
  );
  animation: washFlow1 8s ease-in-out infinite;
  /* 添加水墨晕染边缘 */
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
}

.wash-2 {
  width: 600px;
  height: 600px;
  bottom: -15%;
  right: -15%;
  background: radial-gradient(
    circle at 70% 70%,
    #D4B87A 0%,
    rgba(212, 184, 122, 0.5) 30%,
    rgba(201, 169, 110, 0.3) 60%,
    transparent 80%
  );
  animation: washFlow2 10s ease-in-out infinite;
  /* 不规则边缘 */
  border-radius: 40% 60% 70% 30% / 40% 70% 30% 60%;
}

.wash-3 {
  width: 500px;
  height: 500px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle at 50% 50%,
    #8B7A52 0%,
    rgba(139, 122, 82, 0.5) 30%,
    rgba(201, 169, 110, 0.3) 60%,
    transparent 80%
  );
  animation: washFlow3 12s ease-in-out infinite;
  /* 流动边缘 */
  border-radius: 50% 50% 40% 60% / 60% 40% 60% 40%;
}

@keyframes washFlow1 {
  0%, 100% { 
    transform: translate(0, 0) scale(1) rotate(0deg); 
  }
  25% { 
    transform: translate(30px, 20px) scale(1.05) rotate(2deg); 
  }
  50% { 
    transform: translate(50px, 30px) scale(1.1) rotate(0deg); 
  }
  75% { 
    transform: translate(20px, 10px) scale(1.03) rotate(-1deg); 
  }
}

@keyframes washFlow2 {
  0%, 100% { 
    transform: translate(0, 0) scale(1) rotate(0deg); 
  }
  33% { 
    transform: translate(-25px, -15px) scale(1.08) rotate(-2deg); 
  }
  66% { 
    transform: translate(-40px, -20px) scale(1.15) rotate(1deg); 
  }
}

@keyframes washFlow3 {
  0%, 100% { 
    transform: translate(-50%, -50%) scale(1) rotate(0deg); 
  }
  50% { 
    transform: translate(-50%, -50%) scale(1.2) rotate(5deg); 
  }
}

@keyframes inkFlow {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  30% {
    opacity: 0.2;
    transform: scale(0.9);
  }
  100% {
    opacity: 0.18;
    transform: scale(1);
  }
}

/* ===== 笔走龙蛇方案样式 ===== */

.dramatic-scheme {
  position: absolute;
  inset: 0;
  /* 添加深沉意境背景 */
  background: linear-gradient(135deg, #0A0908 0%, #1A1714 30%, #2A2520 50%, #1A1714 70%, #0A0908 100%);
}

.dramatic-scheme .rice-paper {
  opacity: 1;
}

/* 笔触容器 - 增强书写感 */
.brush-stroke-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0.7;
}

.brush-strokes {
  width: 100%;
  height: 100%;
}

/* 笔触效果 - 增加笔触质感 */
.stroke {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: brushDraw 0.5s ease-out forwards;
  opacity: 0;
  filter: url(#brushTexture);
}

/* 笔触1 - 主笔触 */
.stroke-1 {
  stroke-dasharray: 250;
  stroke-dashoffset: 250;
  stroke-width: 4;
}

/* 笔触2 - 副笔触 */
.stroke-2 {
  stroke-dasharray: 220;
  stroke-dashoffset: 220;
  stroke-width: 3;
  animation-delay: 0.08s;
}

/* 笔触3 - 辅助笔触 */
.stroke-3 {
  stroke-dasharray: 190;
  stroke-dashoffset: 190;
  stroke-width: 2;
  animation-delay: 0.16s;
}

/* 笔触4 - 装饰笔触 */
.stroke-4 {
  stroke-dasharray: 160;
  stroke-dashoffset: 160;
  stroke-width: 1.5;
  animation-delay: 0.24s;
}

@keyframes brushDraw {
  0% {
    stroke-dashoffset: 100%;
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}

.dramatic-scheme .ink-wash {
  opacity: 0.22;
  filter: blur(80px);
  /* 添加水墨质感边缘 */
  box-shadow: 
    inset 0 0 80px rgba(201, 169, 110, 0.4),
    inset -30px -30px 50px rgba(139, 122, 82, 0.3),
    inset 30px 30px 50px rgba(212, 184, 122, 0.3);
}

.dramatic-scheme .ink-wash.wash-1 {
  animation: dramaticWash1 0.5s ease-out;
  /* 增强主水墨效果 */
  border-radius: 55% 45% 35% 65% / 55% 40% 60% 45%;
}

.dramatic-scheme .ink-wash.wash-2 {
  animation: dramaticWash2 0.5s ease-out 0.1s both;
  /* 增强副水墨效果 */
  border-radius: 45% 55% 65% 35% / 45% 60% 40% 55%;
}

.dramatic-scheme .ink-wash.wash-3 {
  animation: dramaticWash3 0.5s ease-out 0.2s both;
  /* 增强中心水墨效果 */
  border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%;
}

@keyframes dramaticWash1 {
  0% {
    opacity: 0;
    transform: translate(-100px, -100px) scale(0.5) rotate(-10deg);
  }
  40% {
    opacity: 0.3;
    transform: translate(-50px, -50px) scale(0.75) rotate(-5deg);
  }
  100% {
    opacity: 0.22;
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
}

@keyframes dramaticWash2 {
  0% {
    opacity: 0;
    transform: translate(100px, 100px) scale(0.5) rotate(10deg);
  }
  40% {
    opacity: 0.3;
    transform: translate(50px, 50px) scale(0.75) rotate(5deg);
  }
  100% {
    opacity: 0.22;
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
}

@keyframes dramaticWash3 {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3) rotate(-5deg);
  }
  40% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(0.6) rotate(-2deg);
  }
  100% {
    opacity: 0.22;
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
  }
}

/* 意境留白增强 - 添加诗意的留白空间 */
.dramatic-scheme::before {
  content: '';
  position: absolute;
  top: 10%;
  left: 10%;
  width: 30%;
  height: 30%;
  background: radial-gradient(
    ellipse at center,
    rgba(201, 169, 110, 0.05) 0%,
    transparent 70%
  );
  animation: poeticSpace 8s ease-in-out infinite;
  pointer-events: none;
}

.dramatic-scheme::after {
  content: '';
  position: absolute;
  bottom: 10%;
  right: 10%;
  width: 25%;
  height: 25%;
  background: radial-gradient(
    ellipse at center,
    rgba(212, 184, 122, 0.04) 0%,
    transparent 70%
  );
  animation: poeticSpace 10s ease-in-out infinite reverse;
  pointer-events: none;
}

@keyframes poeticSpace {
  0%, 100% { 
    opacity: 0.6;
    transform: scale(1);
  }
  50% { 
    opacity: 1;
    transform: scale(1.1);
  }
}

/* 古典祥云 */
.cloud-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.cloud-svg {
  width: 100%;
  height: 100%;
}

.clouds {
  animation: cloudDrift 30s ease-in-out infinite;
}

.cloud {
  opacity: 0.6;
}

.cloud-1 { animation: cloudFloat1 20s ease-in-out infinite; }
.cloud-2 { animation: cloudFloat2 25s ease-in-out infinite; }
.cloud-3 { animation: cloudFloat3 30s ease-in-out infinite; }

@keyframes cloudDrift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(20px); }
}

@keyframes cloudFloat1 {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
  50% { transform: translateY(-20px) scale(1.05); opacity: 0.8; }
}

@keyframes cloudFloat2 {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
  50% { transform: translateY(-15px) scale(1.03); opacity: 0.7; }
}

@keyframes cloudFloat3 {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
  50% { transform: translateY(-25px) scale(1.08); opacity: 0.6; }
}

/* 窗格图案 */
.window-lattice {
  position: absolute;
  inset: 0;
  opacity: 0.15;
  pointer-events: none;
}

.lattice-svg {
  width: 100%;
  height: 100%;
  animation: latticeShimmer 15s ease-in-out infinite;
}

@keyframes latticeShimmer {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.25; }
}

/* 古典边框 */
.classical-frame {
  position: absolute;
  inset: 40px;
  pointer-events: none;
  animation: frameFadeIn 0.4s ease-out 0.1s both;
}

@keyframes frameFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.frame-border {
  position: absolute;
  background: linear-gradient(90deg, transparent, #C9A96E, transparent);
}

.frame-border.top,
.frame-border.bottom {
  height: 1px;
  left: 60px;
  right: 60px;
  animation: borderGlow 3s ease-in-out infinite;
}

.frame-border.top { top: 0; }
.frame-border.bottom { bottom: 0; }

.frame-border.left,
.frame-border.right {
  width: 1px;
  top: 60px;
  bottom: 60px;
  background: linear-gradient(180deg, transparent, #C9A96E, transparent);
  animation: borderGlow 3s ease-in-out infinite;
}

.frame-border.left { left: 0; }
.frame-border.right { right: 0; }

@keyframes borderGlow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* 边框角落 */
.frame-corner {
  position: absolute;
  width: 60px;
  height: 60px;
  animation: cornerFadeIn 0.4s ease-out 0.2s both;
}

@keyframes cornerFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.corner-ornament {
  width: 100%;
  height: 100%;
  border: 2px solid #C9A96E;
  opacity: 0.6;
  animation: cornerPulse 4s ease-in-out infinite;
}

.frame-corner.top-left .corner-ornament {
  border-radius: 8px 0 0 0;
  border-right: none;
  border-bottom: none;
}

.frame-corner.top-right .corner-ornament {
  border-radius: 0 8px 0 0;
  border-left: none;
  border-bottom: none;
}

.frame-corner.bottom-left .corner-ornament {
  border-radius: 0 0 0 8px;
  border-right: none;
  border-top: none;
}

.frame-corner.bottom-right .corner-ornament {
  border-radius: 0 0 8px 0;
  border-left: none;
  border-top: none;
}

@keyframes cornerPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

/* 中央图案 */
.center-emblem {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: emblemFadeIn 0.4s ease-out 0.15s both;
}

@keyframes emblemFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.7) rotate(-10deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.emblem-ring {
  position: absolute;
  animation: ringRotate 60s linear infinite;
}

.emblem-ring.outer { animation-direction: normal; }
.emblem-ring.middle { animation-direction: reverse; animation-duration: 45s; }
.emblem-ring.inner { animation-duration: 30s; }

@keyframes ringRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.emblem-center {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-icon {
  font-family: var(--font-serif, 'Noto Serif SC', serif);
  font-size: 72px;
  font-weight: 700;
  color: #C9A96E;
  text-shadow: 
    0 0 20px rgba(201, 169, 110, 0.8),
    0 0 40px rgba(201, 169, 110, 0.4),
    0 0 60px rgba(201, 169, 110, 0.2);
  animation: iconGlow 3s ease-in-out infinite;
}

.center-glow {
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(201, 169, 110, 0.3) 0%, transparent 70%);
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes iconGlow {
  0%, 100% { 
    text-shadow: 
      0 0 20px rgba(201, 169, 110, 0.8),
      0 0 40px rgba(201, 169, 110, 0.4),
      0 0 60px rgba(201, 169, 110, 0.2);
    transform: scale(1);
  }
  50% { 
    text-shadow: 
      0 0 30px rgba(201, 169, 110, 1),
      0 0 60px rgba(201, 169, 110, 0.6),
      0 0 90px rgba(201, 169, 110, 0.3);
    transform: scale(1.05);
  }
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

/* 四象装饰 */
.cardinal-point {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #C9A96E;
  border-radius: 50%;
  opacity: 0.6;
  animation: pointPulse 2s ease-in-out infinite;
}

.cardinal-point.north { top: 0; left: 50%; transform: translateX(-50%); animation-delay: 0s; }
.cardinal-point.south { bottom: 0; left: 50%; transform: translateX(-50%); animation-delay: 0.5s; }
.cardinal-point.east { right: 0; top: 50%; transform: translateY(-50%); animation-delay: 0.75s; }
.cardinal-point.west { left: 0; top: 50%; transform: translateY(-50%); animation-delay: 1s; }

@keyframes pointPulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.5); }
}

/* 古典装饰文字 */
.classical-text {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-serif, 'Noto Serif SC', serif);
  font-size: 28px;
  color: #C9A96E;
  opacity: 0.8;
  animation: textFadeIn 0.4s ease-out 0.25s both;
  white-space: nowrap;
}

@keyframes textFadeIn {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  100% {
    opacity: 0.8;
    transform: translateX(-50%) translateY(0);
  }
}

.text-decoration {
  opacity: 0.6;
}

.main-text {
  margin: 0 12px;
  letter-spacing: 8px;
}

/* 底部装饰线 */
.bottom-decoration {
  position: absolute;
  bottom: 8%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
  animation: decoFadeIn 0.5s ease-out 0.3s both;
}

@keyframes decoFadeIn {
  0% {
    opacity: 0;
    transform: translateX(-50%) scaleX(0);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) scaleX(1);
  }
}

.deco-line {
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #C9A96E, transparent);
}

.deco-pattern {
  width: 12px;
  height: 12px;
  border: 1px solid #C9A96E;
  transform: rotate(45deg);
  animation: patternPulse 2s ease-in-out infinite;
}

@keyframes patternPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ===== 响应式设计 ===== */

/* 移动设备 - 优化触摸交互和性能 */
@media (max-width: 768px) {
  .classical-frame {
    inset: 20px;
  }
  
  .frame-border.top,
  .frame-border.bottom {
    left: 30px;
    right: 30px;
  }
  
  .frame-border.left,
  .frame-border.right {
    top: 30px;
    bottom: 30px;
  }
  
  .frame-corner {
    width: 40px;
    height: 40px;
  }
  
  .center-emblem {
    width: 200px;
    height: 200px;
  }
  
  .center-icon {
    font-size: 48px;
  }
  
  .center-glow {
    width: 120px;
    height: 120px;
  }
  
  .classical-text {
    font-size: 20px;
    bottom: 12%;
  }
  
  .main-text {
    letter-spacing: 4px;
    margin: 0 8px;
  }
  
  .bottom-decoration {
    bottom: 6%;
    gap: 12px;
  }
  
  .deco-line {
    width: 50px;
  }
  
  .deco-pattern {
    width: 8px;
    height: 8px;
  }
  
  /* 移动设备水墨效果优化 */
  .wash-1 { width: 300px; height: 300px; }
  .wash-2 { width: 250px; height: 250px; }
  .wash-3 { width: 200px; height: 200px; }
  
  .ink-wash {
    filter: blur(40px);
    /* 减少动画复杂度以提升性能 */
    animation-duration: 0.3s !important;
  }
  
  /* 移动设备云纹优化 */
  .cloud-decoration {
    opacity: 0.6;
  }
  
  /* 移动设备笔触优化 */
  .brush-strokes {
    opacity: 0.5;
  }
}

/* 平板设备 - 平衡视觉效果和性能 */
@media (min-width: 769px) and (max-width: 1024px) {
  .classical-frame {
    inset: 30px;
  }
  
  .center-emblem {
    width: 250px;
    height: 250px;
  }
  
  .center-icon {
    font-size: 60px;
  }
  
  .classical-text {
    font-size: 24px;
  }
  
  /* 平板设备水墨效果优化 */
  .wash-1 { width: 400px; height: 400px; }
  .wash-2 { width: 350px; height: 350px; }
  .wash-3 { width: 280px; height: 280px; }
  
  .ink-wash {
    filter: blur(50px);
    animation-duration: 0.35s !important;
  }
}

/* 大屏幕设备 */
@media (min-width: 1921px) {
  .classical-frame {
    inset: 60px;
  }
  
  .frame-corner {
    width: 80px;
    height: 80px;
  }
  
  .center-emblem {
    width: 400px;
    height: 400px;
  }
  
  .center-icon {
    font-size: 96px;
  }
  
  .classical-text {
    font-size: 36px;
  }
  
  .wash-1 { width: 800px; height: 800px; }
  .wash-2 { width: 700px; height: 700px; }
  .wash-3 { width: 600px; height: 600px; }
  
  .ink-wash {
    filter: blur(80px);
  }
}

/* 暗色主题优化 */
.dark-theme .ink-overlay {
  background: linear-gradient(135deg, #0A0908 0%, #1A1714 50%, #0A0908 100%);
}

.dark-theme.scheme-light {
  background: linear-gradient(135deg, rgba(10, 9, 8, 0.98) 0%, rgba(26, 23, 20, 0.98) 50%, rgba(10, 9, 8, 0.98) 100%);
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .frame-border {
    height: 2px !important;
  }
  
  .frame-border.left,
  .frame-border.right {
    width: 2px !important;
  }
  
  .corner-ornament {
    border-width: 3px !important;
  }
  
  .classical-text {
    opacity: 1;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .ink-wash,
  .cloud,
  .clouds,
  .frame-border,
  .corner-ornament,
  .emblem-ring,
  .center-icon,
  .center-glow,
  .cardinal-point,
  .deco-pattern {
    animation: none !important;
  }
  
  .ink-overlay {
    transition-duration: 0.1s !important;
  }
  
  .rice-paper {
    animation: none !important;
  }
  
  .stroke {
    animation: none !important;
    opacity: 1 !important;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .classical-frame {
    inset: 25px;
  }
  
  .center-emblem {
    width: 220px;
    height: 220px;
  }
  
  .center-icon {
    font-size: 52px;
  }
  
  .classical-text {
    font-size: 22px;
    bottom: 13%;
  }
  
  /* 禁用悬停效果 */
  .frame-corner:hover .corner-ornament,
  .classical-text:hover {
    transform: none;
  }
}

.deco-line {
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #C9A96E, transparent);
  animation: lineExtend 4s ease-in-out infinite;
}

.deco-pattern {
  width: 12px;
  height: 12px;
  border: 1px solid #C9A96E;
  transform: rotate(45deg);
  animation: patternRotate 8s linear infinite;
}

@keyframes lineExtend {
  0%, 100% { width: 80px; opacity: 0.5; }
  50% { width: 100px; opacity: 1; }
}

@keyframes patternRotate {
  from { transform: rotate(45deg); }
  to { transform: rotate(405deg); }
}

/* 过渡动画 - 根据方案动态调整 */
.ink-transition-enter-active {
  transition: opacity var(--transition-duration, 0.4s) cubic-bezier(0.4, 0, 0.2, 1);
}

.ink-transition-leave-active {
  transition: opacity var(--transition-duration, 0.4s) cubic-bezier(0.55, 0, 1, 0.45);
}

.ink-transition-enter-from,
.ink-transition-leave-to {
  opacity: 0;
}

/* 轻盈飘逸方案的快速过渡 */
.scheme-light .ink-transition-enter-active,
.scheme-light .ink-transition-leave-active {
  transition-duration: 0.3s;
}

/* 水墨晕染方案的适中过渡 */
.scheme-ink-wash .ink-transition-enter-active,
.scheme-ink-wash .ink-transition-leave-active {
  transition-duration: 0.4s;
}

/* 笔走龙蛇方案的戏剧性过渡 */
.scheme-dramatic .ink-transition-enter-active,
.scheme-dramatic .ink-transition-leave-active {
  transition-duration: 0.5s;
}

/* ===== 页面卷轴展开动画 ===== */

/* 轻盈飘逸方案的快速页面切换 */
.scheme-light .page-unfurl-enter-active {
  animation: pageUnfurlIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.scheme-light .page-unfurl-leave-active {
  animation: pageUnfurlOut 0.3s cubic-bezier(0.55, 0, 1, 0.45);
}

/* 水墨晕染方案的适中页面切换 */
.scheme-ink-wash .page-unfurl-enter-active {
  animation: pageUnfurlIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.scheme-ink-wash .page-unfurl-leave-active {
  animation: pageUnfurlOut 0.4s cubic-bezier(0.55, 0, 1, 0.45);
}

/* 笔走龙蛇方案的戏剧性页面切换 */
.scheme-dramatic .page-unfurl-enter-active {
  animation: pageUnfurlIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.scheme-dramatic .page-unfurl-leave-active {
  animation: pageUnfurlOut 0.5s cubic-bezier(0.55, 0, 1, 0.45);
}

/* 默认页面展开动画（兼容无scheme的情况） */
.page-unfurl-enter-active {
  animation: pageUnfurlIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.page-unfurl-leave-active {
  animation: pageUnfurlOut 0.4s cubic-bezier(0.55, 0, 1, 0.45);
}

@keyframes pageUnfurlIn {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(30px);
    filter: blur(12px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}

@keyframes pageUnfurlOut {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(1.05) translateY(-20px);
    filter: blur(6px);
  }
}

/* 首页特殊效果 */
.style-home .wash-1 {
  background: radial-gradient(circle, #C9A96E 0%, transparent 70%);
  top: -20%;
}

.style-home .center-icon {
  animation: homeGlow 3s ease-in-out infinite;
}

@keyframes homeGlow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 建筑页特殊效果 */
.style-architecture .wash-2 {
  background: radial-gradient(ellipse, #D4B87A 0%, transparent 70%);
  animation: archWash 6s ease-in-out infinite;
}

@keyframes archWash {
  0%, 100% { transform: scale(1) translate(0, 0); }
  50% { transform: scale(1.3) translate(20px, 20px); }
}

/* 测验页特殊效果 */
.style-quiz .center-icon {
  animation: quizGlow 2s ease-in-out infinite;
  font-size: 80px;
}

@keyframes quizGlow {
  0%, 100% { transform: rotate(-5deg) scale(1); }
  50% { transform: rotate(5deg) scale(1.15); }
}

/* 工坊页特殊效果 */
.style-workshop .clouds {
  animation: workshopCloud 15s ease-in-out infinite;
}

@keyframes workshopCloud {
  0%, 100% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
}

/* 社区页特殊效果 */
.style-community .main-text {
  animation: communityText 5s ease-in-out infinite;
  letter-spacing: 1em;
}

@keyframes communityText {
  0%, 100% { letter-spacing: 0.5em; }
  50% { letter-spacing: 0.8em; }
}

/* 管理后台快速切换 */
.admin-layout .page-unfurl-enter-active,
.admin-layout .page-unfurl-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-layout .page-unfurl-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.admin-layout .page-unfurl-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

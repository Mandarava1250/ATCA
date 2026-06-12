<template>
  <!-- 所有背景元素放在同一个 fixed 容器中（参考古建筑-atlas.html 的 #ember-container 模式） -->
  <div class="bg-container">
    <!-- 星火 ember -->
    <div
      v-for="i in props.emberCount"
      :key="'e' + i"
      class="ember-dot"
      :style="emberStyle(i)"
    ></div>
    <!-- 浮动文字（和 ember 同容器，避免层叠问题） -->
    <div
      v-for="(w, i) in words"
      v-show="props.showFloatingText"
      :key="'w' + i"
      class="floating-text"
      :class="w.type"
      :style="{
        left: w.x + '%',
        fontSize: w.size + 'px',
        animationDuration: w.dur + 's',
        animationDelay: w.delay + 's',
      }"
    >
      {{ w.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();

const props = withDefaults(defineProps<{
  emberCount?: number;
  showFloatingText?: boolean;
}>(), {
  emberCount: 80,
  showFloatingText: true,
});

// 浮动文字数据：42个，均匀分布在全屏（含中间区域20%-80%）
const words = computed(() => [
  // === 金色赞美词 text-praise ===
  { text: t('home.float1'),  x: 5,  size: 14, dur: 22, delay: -3,  type: 'text-praise' },
  { text: t('home.float3'),  x: 12, size: 16, dur: 25, delay: -8,  type: 'text-praise' },
  { text: t('home.float5'),  x: 8,  size: 13, dur: 20, delay: -12, type: 'text-praise' },
  { text: t('home.float7'),  x: 2,  size: 15, dur: 24, delay: -5,  type: 'text-praise' },
  { text: t('home.float8'),  x: 15, size: 14, dur: 21, delay: -15, type: 'text-praise' },
  { text: t('home.float10'), x: 18, size: 13, dur: 26, delay: -10, type: 'text-praise' },
  { text: t('home.float27'), x: 88, size: 15, dur: 23, delay: -6,  type: 'text-praise' },
  { text: t('home.float28'), x: 95, size: 14, dur: 19, delay: -14, type: 'text-praise' },
  { text: t('home.float29'), x: 82, size: 16, dur: 27, delay: -2,  type: 'text-praise' },
  { text: t('home.float30'), x: 92, size: 13, dur: 20, delay: -18, type: 'text-praise' },
  // 中间区域赞美词
  { text: t('home.float2'),  x: 30, size: 14, dur: 24, delay: -7,  type: 'text-praise' },
  { text: t('home.float6'),  x: 48, size: 15, dur: 21, delay: -13, type: 'text-praise' },
  { text: t('home.float9'),  x: 62, size: 13, dur: 26, delay: -4,  type: 'text-praise' },
  { text: t('home.float12'), x: 75, size: 14, dur: 19, delay: -20, type: 'text-praise' },

  // === 红色建筑名 text-building ===
  { text: t('home.float11'), x: 90, size: 14, dur: 24, delay: -9,  type: 'text-building' },
  { text: t('home.float13'), x: 85, size: 15, dur: 21, delay: -4,  type: 'text-building' },
  { text: t('home.float21'), x: 22, size: 13, dur: 28, delay: -7,  type: 'text-building' },
  { text: t('home.float23'), x: 35, size: 14, dur: 22, delay: -16, type: 'text-building' },
  // 中间区域建筑名
  { text: t('home.float22'), x: 40, size: 13, dur: 25, delay: -11, type: 'text-building' },
  { text: t('home.float24'), x: 55, size: 14, dur: 20, delay: -2,  type: 'text-building' },
  { text: t('home.float26'), x: 70, size: 12, dur: 23, delay: -15, type: 'text-building' },

  // === 青色人名 text-master ===
  { text: t('home.float15'), x: 78, size: 13, dur: 25, delay: -11, type: 'text-master' },
  { text: t('home.float17'), x: 72, size: 14, dur: 20, delay: -1,  type: 'text-master' },
  { text: t('home.float18'), x: 98, size: 12, dur: 23, delay: -13, type: 'text-master' },
  { text: t('home.float19'), x: 68, size: 15, dur: 26, delay: -19, type: 'text-master' },
  // 中间区域人名
  { text: t('home.float16'), x: 32, size: 14, dur: 22, delay: -6,  type: 'text-master' },
  { text: t('home.float20'), x: 50, size: 13, dur: 27, delay: -10, type: 'text-master' },

  // === 蓝色典籍 text-book ===
  { text: t('home.float4'),  x: 28, size: 14, dur: 24, delay: -8,  type: 'text-book' },
  { text: t('home.float25'), x: 42, size: 13, dur: 21, delay: -17, type: 'text-book' },
  // 中间区域典籍
  { text: t('home.float14'), x: 38, size: 13, dur: 25, delay: -3,  type: 'text-book' },
  { text: t('home.float3'),  x: 58, size: 14, dur: 20, delay: -12, type: 'text-book' },

  // === 额外填充中间区域 ===
  { text: t('home.float1'),  x: 45, size: 12, dur: 29, delay: -5,  type: 'text-praise' },
  { text: t('home.float7'),  x: 52, size: 13, dur: 23, delay: -18, type: 'text-building' },
  { text: t('home.float11'), x: 60, size: 14, dur: 26, delay: -9,  type: 'text-master' },
  { text: t('home.float19'), x: 65, size: 12, dur: 24, delay: -14, type: 'text-book' },
  { text: t('home.float29'), x: 25, size: 13, dur: 21, delay: -21, type: 'text-praise' },
  { text: t('home.float13'), x: 80, size: 14, dur: 28, delay: -1,  type: 'text-building' },
]);

// 星火样式：三种尺寸（小/中/大），更加出色的发光效果
function emberStyle(i: number) {
  // 前60%为小星火，30%为中火，10%为大 Glow orb
  const isLarge = i > props.emberCount * 0.9;
  const isMedium = i > props.emberCount * 0.6 && i <= props.emberCount * 0.9;
  const size = isLarge ? Math.random() * 6 + 5 : isMedium ? Math.random() * 3 + 3 : Math.random() * 2.5 + 1.5;
  const duration = Math.random() * 8 + 6;
  return {
    width: size + 'px',
    height: size + 'px',
    left: Math.random() * 100 + '%',
    animationDuration: duration + 's',
    animationDelay: -Math.random() * duration + 's',
    // 大orb更强发光
    '--glow': isLarge ? 'rgba(210,176,124,0.8)' : isMedium ? 'rgba(210,176,124,0.6)' : 'rgba(210,176,124,0.4)',
    '--glow2': isLarge ? 'rgba(210,176,124,0.3)' : 'rgba(210,176,124,0.1)',
    '--glow3': isLarge ? 'rgba(230,200,150,0.15)' : 'transparent',
  };
}
</script>

<style scoped>
/* 背景容器：和参考HTML的 #ember-container 完全一致 */
.bg-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

/* ===== 星火：三层发光 + 脉动 + 升起摇曳 ===== */
.ember-dot {
  position: absolute;
  bottom: -20px;
  background: radial-gradient(circle, #f0d8a8 0%, #d2b07c 50%, #a88050 100%);
  border-radius: 50%;
  /* 三层发光：核心光晕 + 中光晕 + 外光晕 */
  box-shadow:
    0 0 6px 2px var(--glow, rgba(210,176,124,0.4)),
    0 0 20px 6px var(--glow2, rgba(210,176,124,0.1)),
    0 0 40px 12px var(--glow3, transparent);
  animation-name: rise-sway-pulse;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

/* 大orb增强：脉动 + 更强发光 */
@keyframes rise-sway-pulse {
  0%   { transform: translateY(0) translateX(0) scale(0.4); opacity: 0; }
  5%   { opacity: 0.9; }
  15%  { transform: translateY(-15vh) translateX(8px) scale(1.0); opacity: 1; }
  30%  { transform: translateY(-30vh) translateX(-12px) scale(1.3); opacity: 0.8; }
  45%  { transform: translateY(-45vh) translateX(20px) scale(0.9); opacity: 0.6; }
  60%  { transform: translateY(-60vh) translateX(-8px) scale(1.1); opacity: 0.5; }
  80%  { transform: translateY(-85vh) translateX(15px) scale(0.7); opacity: 0.25; }
  100% { transform: translateY(-120vh) translateX(-5px) scale(0.2); opacity: 0; }
}

/* ===== 浮动文字（参考 .floating-text 样式） ===== */
.floating-text {
  position: absolute;
  top: -200px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  color: #d2b07c;
  font-family: "Noto Serif SC", "STSong", serif;
  letter-spacing: 4px;
  pointer-events: none;
  white-space: nowrap;
  animation-name: fall-and-fade;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes fall-and-fade {
  0%   { transform: translateY(0); opacity: 0; }
  15%  { opacity: 0.7; }
  85%  { opacity: 0.7; }
  100% { transform: translateY(120vh); opacity: 0; }
}

/* ===== 四类文字颜色（参考古建筑-atlas） ===== */
/* 赞美词 - 金色 */
.text-praise {
  color: #d2b07c;
  text-shadow: 0 0 5px rgba(210, 176, 124, 0.5);
}
/* 建筑名 - 红色 */
.text-building {
  color: #a6514d;
  text-shadow: 0 0 5px rgba(166, 81, 77, 0.4);
}
/* 人名 - 青绿色 */
.text-master {
  color: #7a918a;
  text-shadow: 0 0 5px rgba(122, 145, 138, 0.4);
}
/* 典籍 - 蓝色 */
.text-book {
  color: #6b8299;
  text-shadow: 0 0 5px rgba(107, 130, 153, 0.4);
}
</style>

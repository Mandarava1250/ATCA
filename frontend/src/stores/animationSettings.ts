import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// 动画方案类型定义
export type AnimationScheme = 'light' | 'ink-wash' | 'dramatic';

/**
 * 动画方案说明：
 * 
 * 1. light（轻盈飘逸）- 简洁淡雅的过渡效果
 *    - 特点：轻巧、柔和、现代
 *    - 适用场景：日常浏览、快速操作、注重效率的场景
 *    - 复杂度：★☆☆☆☆
 *    - 时长：0.3秒
 * 
 * 2. ink-wash（水墨晕染）- 经典水墨晕染效果
 *    - 特点：层次分明、意境深远、文化气息浓厚
 *    - 适用场景：主页面切换、内容展示、文化体验
 *    - 复杂度：★★★☆☆
 *    - 时长：0.4秒
 * 
 * 3. dramatic（笔走龙蛇）- 大气磅礴的书写效果
 *    - 特点：动感强烈、视觉冲击、戏剧性
 *    - 适用场景：重要功能切换、特殊时刻、深度体验
 *    - 复杂度：★★★★★
 *    - 时长：0.5秒
 */

export interface AnimationSettings {
  // 是否跳过转场动画
  skipTransition: boolean;
  // 当前动画方案
  scheme: AnimationScheme;
  // 是否显示页面名称
  showPageName: boolean;
  // 动画强度（0-100）
  intensity: number;
}

export const useAnimationSettingsStore = defineStore('animationSettings', () => {
  // 是否跳过转场动画
  const skipTransition = ref(false);
  
  // 当前动画方案（默认水墨晕染）
  const scheme = ref<AnimationScheme>('ink-wash');
  
  // 是否显示页面名称
  const showPageName = ref(true);
  
  // 动画强度（0-100），用于调节动画效果的强烈程度
  const intensity = ref(80);

  // 从localStorage加载设置
  function loadSettings() {
    try {
      const saved = localStorage.getItem('animationSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        skipTransition.value = parsed.skipTransition || false;
        scheme.value = parsed.scheme || 'ink-wash';
        showPageName.value = parsed.showPageName !== false;
        intensity.value = parsed.intensity || 80;
      }
    } catch (e) {
      console.error('[AnimationSettings] 加载设置失败:', e);
    }
  }

  // 保存设置到localStorage
  function saveSettings() {
    try {
      localStorage.setItem('animationSettings', JSON.stringify({
        skipTransition: skipTransition.value,
        scheme: scheme.value,
        showPageName: showPageName.value,
        intensity: intensity.value,
      }));
    } catch (e) {
      console.error('[AnimationSettings] 保存设置失败:', e);
    }
  }

  // 监听变化自动保存
  watch([skipTransition, scheme, showPageName, intensity], () => {
    saveSettings();
  });

  // 切换动画方案
  function setScheme(newScheme: AnimationScheme) {
    scheme.value = newScheme;
  }

  // 获取方案时长
  function getSchemeDuration(): number {
    switch (scheme.value) {
      case 'light':
        return 300; // 0.3秒
      case 'ink-wash':
        return 400; // 0.4秒
      case 'dramatic':
        return 500; // 0.5秒
      default:
        return 400;
    }
  }

  // 初始化
  loadSettings();

  return {
    skipTransition,
    scheme,
    showPageName,
    intensity,
    saveSettings,
    loadSettings,
    setScheme,
    getSchemeDuration,
  };
});

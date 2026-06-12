/**
 * 路由切换自动刷新 composable
 * 当路由参数变化或组件被激活时自动刷新数据
 */
import { onMounted, onActivated } from 'vue';

export function useAutoRefresh(loadFn: () => void | Promise<void>) {
  // 首次挂载时刷新
  onMounted(() => { loadFn(); });
  // keep-alive 激活时刷新（如果使用了 keep-alive）
  onActivated(() => { loadFn(); });
}
